
'use server';

import type { ChartData, CommodityPriceData, ScenarioResult, HistoricalQuote, HistoryInterval, UcsData, RiskAnalysisData, RiskMetric, GenerateReportInput, GenerateReportOutput } from './types';
import { getCommodityConfig } from './commodity-config-service';
import { calculate_volatility, calculate_correlation } from './statistics';
import { db } from './firebase-config';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';


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
          const savedDate = (data.savedAt as Timestamp).toDate();
          prices.push({
            id: docData.id,
            name: data.name,
            ticker: data.ticker,
            price: data.price,
            change: data.change,
            absoluteChange: data.absoluteChange,
            lastUpdated: `Fech. ${savedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
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
 * This function DOES NOT perform any calculations itself. It reads what's been saved.
 */
export async function getUcsIndexValue(interval: HistoryInterval = '1d'): Promise<{ history: ChartData[], latest: UcsData }> {
    const { calculateUcsIndex } = await import('@/ai/flows/calculate-ucs-index-flow');
    
    // We call calculateUcsIndex on the fly to get the composition details (VM, VUS, CRS)
    // based on the very latest data in the database.
    const compositionDetails = await calculateUcsIndex();

    // The main indexValue displayed, however, will be the one from the database's history for consistency.
    const historyCollectionRef = collection(db, 'ucs_index_history');
    const q = query(historyCollectionRef, orderBy('savedAt', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);

    let latestIndexValue = 0;
    if (!querySnapshot.empty) {
        latestIndexValue = querySnapshot.docs[0].data().value;
    }
    
    // Override the calculated index value with the one from the database.
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
        
        const historyData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                close: data.price, 
                change: data.change,
                date: (data.savedAt as Timestamp).toDate(),
            };
        }).reverse(); 

        const formattedData: HistoricalQuote[] = historyData.map((current, i) => {
            const previous = i > 0 ? historyData[i - 1] : null;
            return {
                date: getDateFormat(current.date),
                open: previous ? previous.close : current.close,
                high: current.close,
                low: current.close,
                close: current.close,
                volume: 'N/A',
                change: current.change,
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


/**
 * Triggers the Genkit flow to update a single commodity's price.
 * @param assetName The name of the commodity to update.
 * @returns The result of the flow execution.
 */
export async function runFetchAndSavePrices(assetName: string) {
    const { fetchAndSavePricesFlow } = await import('@/ai/flows/fetch-and-save-prices-flow');
    return await fetchAndSavePricesFlow({ assetName });
}
