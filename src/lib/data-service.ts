'use server';

import type { ChartData, CommodityPriceData, ScenarioResult, HistoricalQuote, HistoryInterval, UcsData, RiskAnalysisData, RiskMetric, GenerateReportInput, GenerateReportOutput } from './types';
import { getOptimizedHistorical, getOptimizedCommodityPrices } from './yahoo-finance-optimizer';
import { getCommodityConfig } from './commodity-config-service';
import { calculate_volatility, calculate_correlation } from './statistics';
import { db } from './firebase-config';
import { collection, query, orderBy, limit, getDocs, Timestamp, getDoc, doc } from 'firebase/firestore';
import { saveCommodityData } from './database-service';
import { scrapeUrlFlow } from '@/ai/flows/scrape-commodity-price-flow';


// Functions for the "Analysis" page that call Genkit flows directly.
export async function runScenarioSimulation(asset: string, changeType: 'percentage' | 'absolute', value: number): Promise<ScenarioResult> {
    const { simulateScenario } = await import('@/ai/flows/simulate-scenario-flow');
    return simulateScenario({ asset, changeType, value });
}

export async function getRiskAnalysisData(): Promise<RiskAnalysisData> {
    const { commodityMap } = await getCommodityConfig();
    const assetNames = Object.keys(commodityMap);
    
    try {
        // Fetch index history from our database
        const indexHistoryRaw = await getUcsIndexHistory('1d', 30);
        if (indexHistoryRaw.length < 2) throw new Error("Not enough index history to calculate risk.");
        const indexReturns = indexHistoryRaw.map((d, i, arr) => i === 0 ? 0 : (d.value - arr[i-1].value) / arr[i-1].value).slice(1);
        
        // Fetch asset histories and calculate metrics
        const metricsPromises = assetNames.map(async (assetName) => {
            const assetHistoryRaw = await getAssetHistoricalData(assetName, '1d', 30);
             if (assetHistoryRaw.length < 2) return { asset: assetName, volatility: 0, correlation: 0 };

            const assetReturns = assetHistoryRaw.map((d, i, arr) => i === 0 ? 0 : (d.close - arr[i-1].close) / arr[i-1].close).slice(1);
            
            // Ensure arrays are the same length for correlation
            const minLength = Math.min(indexReturns.length, assetReturns.length);
            if (minLength < 2) return { asset: assetName, volatility: 0, correlation: 0 };

            const alignedIndexReturns = indexReturns.slice(indexReturns.length - minLength);
            const alignedAssetReturns = assetReturns.slice(assetReturns.length - minLength);

            const volatility = calculate_volatility(alignedAssetReturns);
            const correlation = calculate_correlation(alignedAssetReturns, alignedIndexReturns);

            return {
                asset: assetName,
                volatility: isNaN(volatility) ? 0 : volatility,
                correlation: isNaN(correlation) ? 0 : correlation,
            };
        });

        const metrics: RiskMetric[] = await Promise.all(metricsPromises);

        return { metrics };

    } catch (error) {
        console.error("[LOG] Failed to getRiskAnalysisData:", error);
        throw new Error("Failed to compute risk analysis data.");
    }
}


/**
 * Fetches the latest commodity prices directly from Firestore.
 * This is the primary function used by the frontend to display data.
 */
export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const { commodityMap } = await getCommodityConfig();
    const commodityNames = Object.keys(commodityMap);
    const prices: CommodityPriceData[] = [];
  
    for (const name of commodityNames) {
      try {
        const commodityInfo = commodityMap[name];
        if (!commodityInfo) continue;
  
        const pricesCollectionRef = collection(db, 'commodities_history', name, 'price_entries');
        const q = query(pricesCollectionRef, orderBy('savedAt', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
  
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0];
          const data = docData.data() as any;
          prices.push({
            id: docData.id,
            name: data.name,
            ticker: data.ticker,
            price: data.price,
            change: data.change,
            absoluteChange: data.absoluteChange,
            lastUpdated: new Date((data.savedAt as Timestamp).seconds * 1000).toLocaleString('pt-BR'),
            currency: commodityInfo.currency,
          });
        }
      } catch (error) {
        console.error(`[DATA_SERVICE] Failed to fetch price for ${name} from Firestore:`, error);
      }
    }
    return prices;
  }

/**
 * Reads the latest calculated UCS index data and its history from Firestore.
 * This function DOES NOT perform any calculations.
 */
export async function getUcsIndexValue(interval: HistoryInterval = '1d'): Promise<{ history: ChartData[], latest: UcsData }> {
    const { calculateUcsIndex } = await import('@/ai/flows/calculate-ucs-index-flow');
    
    // We still call calculateUcsIndex on the fly to get the composition details (VM, VUS, CRS).
    // The main indexValue displayed will be the one from the database.
    const compositionDetails = await calculateUcsIndex();

    // Fetch the single most recent index value from the history collection
    const historyCollectionRef = collection(db, 'ucs_index_history');
    const q = query(historyCollectionRef, orderBy('savedAt', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);

    let latestIndexValue = 0;
    if (!querySnapshot.empty) {
        latestIndexValue = querySnapshot.docs[0].data().value;
    }
    
    // Override the calculated index value with the one from the database for consistency.
    const latestData: UcsData = {
        ...compositionDetails,
        indexValue: latestIndexValue,
    };

    // If the formula is not configured, we don't need to fetch history.
    if (!latestData.isConfigured) {
        return {
            history: [],
            latest: { ...latestData, indexValue: 0 } // Ensure index is 0 if not configured
        }
    }

    const history = await getUcsIndexHistory(interval);

    return { history, latest: latestData };
}

async function getUcsIndexHistory(interval: HistoryInterval, limitCount: number = 30): Promise<ChartData[]> {
    try {
        const historyCollectionRef = collection(db, 'ucs_index_history');
        const q = query(historyCollectionRef, orderBy('savedAt', 'desc'), limit(limitCount));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return [];
        }

        const getDateFormat = (date: Date) => {
             switch(interval) {
                case '1d': return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                case '1wk': return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                case '1mo': return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                default: return date.toLocaleDateString('pt-BR');
            }
        };

        const history = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const date = (data.savedAt as Timestamp).toDate();
            return {
                time: getDateFormat(date),
                value: data.value,
            };
        }).reverse(); // Reverse to have chronological order for the chart

        return history;
    } catch (error) {
        console.error("[LOG] Error fetching UCS index history:", error);
        return [];
    }
}


/**
 * Fetches historical data for a given asset directly from the Firestore database.
 * This ensures consistency and reduces external API calls.
 */
export async function getAssetHistoricalData(assetName: string, interval: HistoryInterval = '1d', limitCount: number = 30): Promise<HistoricalQuote[]> {
    const { commodityMap } = await getCommodityConfig();
    const commodityInfo = commodityMap[assetName];
    if (!commodityInfo) {
        console.error(`No configuration found for asset: ${assetName}`);
        return [];
    }

    try {
        const pricesCollectionRef = collection(db, 'commodities_history', assetName, 'price_entries');
        const q = query(pricesCollectionRef, orderBy('savedAt', 'desc'), limit(limitCount));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return [];
        }

        const getDateFormat = (date: Date) => {
            switch (interval) {
                case '1d': return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                case '1wk': return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                case '1mo': return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                default: return date.toLocaleDateString('pt-BR');
            }
        };
        
        // Firestore data doesn't have open, high, low, so we adapt the model.
        // We use the saved price as 'close' and calculate change based on the previous day's 'close'.
        const historyData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                // We use the 'price' field from our saved data as the 'close' price
                close: data.price, 
                // The daily change is already pre-calculated and saved
                change: data.change,
                // The saved timestamp
                date: (data.savedAt as Timestamp).toDate(),
            };
        }).reverse(); // .reverse() to get chronological order for change calculation.

        const formattedData: HistoricalQuote[] = historyData.map((current, i) => {
            const previous = i > 0 ? historyData[i - 1] : null;
            return {
                date: getDateFormat(current.date),
                // Since we only store closing price, we'll use it for O-H-L as a reasonable approximation for the chart
                open: previous ? previous.close : current.close,
                high: current.close,
                low: current.close,
                close: current.close,
                volume: 'N/A', // Volume is not stored in our DB
                change: current.change, // Use the pre-calculated change
            };
        });

        return formattedData;
    } catch (error) {
        console.error(`[DATA_SERVICE] Error fetching historical data for ${assetName} from Firestore:`, error);
        return [];
    }
}


export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
    const { generateReportFlow } = await import('@/ai/flows/generate-report-flow');
    return generateReportFlow(input);
}


export async function updateSingleCommodity(assetName: string): Promise<{success: boolean, message: string}> {
    console.log(`[DATA_SERVICE] Initiating manual update for ${assetName}`);
    const { commodityMap } = await getCommodityConfig();
    const commodityInfo = commodityMap[assetName];
    if (!commodityInfo || !commodityInfo.scrapeConfig) {
        return { success: false, message: 'Ativo não configurado para atualização manual.' };
    }

    try {
        // Step 1: Scrape the latest price
        const newPriceStr = await scrapeUrlFlow({ 
            url: commodityInfo.scrapeConfig.url, 
            selector: commodityInfo.scrapeConfig.selector 
        });

        if (!newPriceStr) {
            throw new Error('Scraping did not return a value.');
        }

        const newPrice = parseFloat(newPriceStr);
        if (isNaN(newPrice)) {
            throw new Error(`Scraped value "${newPriceStr}" is not a valid number.`);
        }

        // Step 2: Fetch the last saved price from DB to calculate change
        const pricesCollectionRef = collection(db, 'commodities_history', assetName, 'price_entries');
        const q = query(pricesCollectionRef, orderBy('savedAt', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);

        let lastPrice = newPrice; // Default if no previous price exists
        if (!querySnapshot.empty) {
            lastPrice = querySnapshot.docs[0].data().price;
        }

        const absoluteChange = newPrice - lastPrice;
        const change = lastPrice !== 0 ? (absoluteChange / lastPrice) * 100 : 0;

        // Step 3: Create the data object and save to Firestore
        const priceData: CommodityPriceData = {
            id: new Date().toISOString(), // Temporary ID
            name: assetName,
            ticker: commodityInfo.ticker,
            price: newPrice,
            change: parseFloat(change.toFixed(2)),
            absoluteChange: parseFloat(absoluteChange.toFixed(4)),
            lastUpdated: new Date().toISOString(), // Use ISO string for consistency
            currency: commodityInfo.currency,
        };

        await saveCommodityData([priceData]);

        console.log(`[DATA_SERVICE] Successfully updated ${assetName} to ${newPrice}`);
        return { success: true, message: `${assetName} atualizado com sucesso.` };

    } catch (error) {
        console.error(`[DATA_SERVICE] Failed to manually update ${assetName}:`, error);
        return { success: false, message: `Falha ao atualizar ${assetName}.` };
    }
}