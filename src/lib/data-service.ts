



'use server';

import type { ChartData, CommodityPriceData, ScenarioResult, HistoricalQuote, HistoryInterval, UcsData, RiskAnalysisData, RiskMetric, GenerateReportInput, GenerateReportOutput } from './types';
import { getOptimizedHistorical, getOptimizedCommodityPrices } from './yahoo-finance-optimizer';
import { COMMODITY_TICKER_MAP } from './yahoo-finance-config-data';
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
    const assetNames = Object.keys(COMMODITY_TICKER_MAP);
    
    try {
        // Fetch index history
        const indexHistoryRaw = await getUcsIndexHistory('1d', 30);
        const indexReturns = indexHistoryRaw.map((d, i, arr) => i === 0 ? 0 : (d.value - arr[i-1].value) / arr[i-1].value).slice(1);
        
        // Fetch asset histories and calculate metrics
        const metricsPromises = assetNames.map(async (assetName) => {
            const assetHistoryRaw = await getAssetHistoricalData(assetName, '1d', 30);
            const assetReturns = assetHistoryRaw.map((d, i, arr) => i === 0 ? 0 : (d.close - arr[i-1].close) / arr[i-1].close).slice(1);
            
            // Ensure arrays are the same length for correlation
            const minLength = Math.min(indexReturns.length, assetReturns.length);
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

        return {
            metrics: metrics,
        };

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
    const commodityNames = Object.keys(COMMODITY_TICKER_MAP);
    const prices: CommodityPriceData[] = [];
  
    for (const name of commodityNames) {
      try {
        const commodityInfo = COMMODITY_TICKER_MAP[name];
        if (!commodityInfo) continue;
  
        const pricesCollectionRef = collection(db, 'commodities_history', name, 'price_entries');
        // Fetch the single most recent document.
        const q = query(pricesCollectionRef, orderBy('savedAt', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
  
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data() as any;
          prices.push({
            id: doc.id,
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


// Use centralized commodity ticker mapping
export async function getAssetHistoricalData(assetName: string, interval: HistoryInterval = '1d', limit: number = 30): Promise<HistoricalQuote[]> {
    const commodityInfo = COMMODITY_TICKER_MAP[assetName];
    const ticker = commodityInfo?.ticker;
    if (!ticker) {
        console.error(`No ticker found for asset: ${assetName}`);
        return [];
    }

    try {
        const today = new Date();
        const startDate = new Date();

        switch (interval) {
            case '1d':
                startDate.setDate(today.getDate() - (limit + 5)); // Fetch a bit more for calculations
                break;
            case '1wk':
                 startDate.setDate(today.getDate() - (limit * 7 + 5));
                break;
            case '1mo':
                startDate.setFullYear(today.getFullYear() - Math.ceil(limit / 12));
                break;
        }

        const queryOptions = {
            period1: startDate.toISOString().split('T')[0],
            period2: today.toISOString().split('T')[0],
            interval: interval,
        };
        
        const result = await getOptimizedHistorical(ticker, queryOptions, interval);

        if (!result || result.length === 0) {
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


        const formattedData: HistoricalQuote[] = [];
        for (let i = 0; i < result.length; i++) {
            const current = result[i];
            const previousClose = i > 0 ? result[i - 1].close : current.open; // Use open for the first day's change
            
            const change = previousClose === 0 ? 0 : ((current.close - previousClose) / previousClose) * 100;

            formattedData.push({
                date: getDateFormat(current.date),
                open: current.open,
                high: current.high,
                low: current.low,
                close: current.close,
                volume: current.volume?.toLocaleString('pt-BR') ?? 'N/A',
                change: change,
            });
        }
        
        return formattedData.slice(-limit);

    } catch (error) {
        console.error(`[LOG] Error fetching historical data for ${ticker} from Yahoo Finance:`, error);
        return [];
    }
}


export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
    const { generateReportFlow } = await import('@/ai/flows/generate-report-flow');
    return generateReportFlow(input);
}


export async function updateSingleCommodity(assetName: string): Promise<{success: boolean, message: string}> {
    console.log(`[DATA_SERVICE] Initiating manual update for ${assetName}`);
    const commodityInfo = COMMODITY_TICKER_MAP[assetName];
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
