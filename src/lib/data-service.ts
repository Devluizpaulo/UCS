
'use server';

import type { ChartData, CommodityPriceData, ScenarioResult, HistoricalQuote, HistoryInterval, UcsData, RiskAnalysisData, RiskMetric, GenerateReportInput, GenerateReportOutput, CommodityConfig } from './types';
import { getCommodities } from './commodity-config-service';
import { calculate_volatility, calculate_correlation } from './statistics';
import { db } from './firebase-admin-config';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { getMarketDataHistory } from './marketdata-service';


// Functions for the "Analysis" page that call Genkit flows directly.
export async function runScenarioSimulation(asset: string, changeType: 'percentage' | 'absolute', value: number): Promise<ScenarioResult> {
    const { simulateScenario } = await import('@/ai/flows/simulate-scenario-flow');
    return simulateScenario({ asset, changeType, value });
}

export async function runFetchAndSavePrices(assetName?: string): Promise<{success: boolean, message: string}> {
    const { fetchAndSavePrices } = await import('@/ai/flows/fetch-and-save-prices-flow');
    return fetchAndSavePrices({ assetName });
}


export async function getRiskAnalysisData(): Promise<RiskAnalysisData> {
    const commodities = await getCommodities();
    const ucsHistoryData = await getUcsIndexValue('1d'); // Use daily data for correlation
    const ucsReturns = ucsHistoryData.history.map(d => d.value).slice(1).map((v, i, a) => (v / a[i-1]) -1);

    const metrics: RiskMetric[] = [];

    for (const asset of commodities) {
        try {
            const assetHistory = await getAssetHistoricalData(asset.name, '1d');
            if (assetHistory.length < 2) continue;

            const assetReturns = assetHistory.map(d => d.close).slice(1).map((v, i, a) => (v / a[i-1]) -1);
            const volatility = calculate_volatility(assetReturns);
            
            // Ensure array lengths match for correlation
            const correlation = calculate_correlation(ucsReturns.slice(-assetReturns.length), assetReturns);
            
            metrics.push({ asset: asset.name, volatility, correlation });
        } catch (error) {
            console.error(`Could not analyze risk for ${asset.name}:`, error);
        }
    }
    return { metrics };
}

export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  const { generateReport } = await import('@/ai/flows/generate-report-flow');
  return generateReport(input);
}


// --- Functions to get data from FIRESTORE ---

export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const commodities = await getCommodities();
    const prices: CommodityPriceData[] = [];

    for (const commodity of commodities) {
        try {
            // Get the latest price entry to calculate the change
            const pricesCollectionRef = collection(db, 'commodities', commodity.id, 'price_entries');
            const q = query(pricesCollectionRef, orderBy('savedAt', 'desc'), limit(2));
            const querySnapshot = await getDocs(q);

            let change = 0;
            let absoluteChange = 0;

            if (querySnapshot.size > 1) {
                const latestData = querySnapshot.docs[0].data();
                const previousData = querySnapshot.docs[1].data();
                absoluteChange = latestData.price - previousData.price;
                change = previousData.price !== 0 ? (absoluteChange / previousData.price) * 100 : 0;
            }
            
            const lastUpdatedTimestamp = commodity.lastUpdated ? (commodity.lastUpdated as unknown as Timestamp) : null;
            const lastUpdated = lastUpdatedTimestamp ? lastUpdatedTimestamp.toDate().toLocaleString('pt-BR') : 'N/A';
            
            prices.push({
                ...commodity,
                price: commodity.price || 0,
                change,
                absoluteChange,
                lastUpdated,
            });

        } catch (error) {
            console.error(`Error fetching price for ${commodity.name} from Firestore:`, error);
            // Push commodity with default values if fetching details fails
            prices.push({
                ...commodity,
                price: 0,
                change: 0,
                absoluteChange: 0,
                lastUpdated: 'Erro ao carregar',
            });
        }
    }

    return prices.sort((a, b) => a.name.localeCompare(b.name));
}


export async function getUcsIndexValue(interval: HistoryInterval = '1d'): Promise<{ latest: UcsData, history: ChartData[] }> {
    const { calculateUcsIndex } = await import('@/ai/flows/calculate-ucs-index-flow');
    
    // This will calculate the index based on latest prices in DB.
    const ucsResult = await calculateUcsIndex();

    const historyCollectionRef = collection(db, 'ucs_index_history');
    
    // Determine limit based on interval
    const limitMap = { '1d': 30, '1wk': 26, '1mo': 60 };
    const qLimit = limitMap[interval] || 30;

    const q = query(historyCollectionRef, orderBy('savedAt', 'desc'), limit(qLimit));
    const querySnapshot = await getDocs(q);
    
    const history: ChartData[] = [];
    querySnapshot.forEach(doc => {
        const data = doc.data();
        const timestamp = data.savedAt as Timestamp;
        const date = timestamp.toDate();
        let formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        history.push({
            time: formattedDate,
            value: data.value,
        });
    });

    return {
        latest: ucsResult,
        history: history.reverse(),
    };
}


// Function to get detailed historical data for a single asset for the modal
export async function getAssetHistoricalData(assetName: string, interval: HistoryInterval): Promise<HistoricalQuote[]> {
    const commodities = await getCommodities();
    const commodityInfo = commodities.find(c => c.name === assetName);

    if (!commodityInfo) {
        throw new Error(`Asset ${assetName} not found in config.`);
    }
  
    const resolutionMap = { '1d': 'D', '1wk': 'W', '1mo': 'M' };
    const countbackMap = { '1d': 90, '1wk': 52, '1mo': 60 }; // 3 months, 1 year, 5 years

    try {
        const history = await getMarketDataHistory(
            commodityInfo.ticker,
            resolutionMap[interval] as 'D' | 'W' | 'M',
            countbackMap[interval]
        );

        if (history.s !== 'ok') {
            throw new Error(`MarketData API returned error for ${assetName}: ${history.errmsg || 'Unknown error'}`);
        }
    
        const formattedHistory: HistoricalQuote[] = [];
        for (let i = 0; i < history.t.length; i++) {
            const prevClose = i > 0 ? history.c[i - 1] : history.o[i];
            const change = prevClose !== 0 ? ((history.c[i] - prevClose) / prevClose) * 100 : 0;
            formattedHistory.push({
                date: new Date(history.t[i] * 1000).toLocaleDateString('pt-BR'),
                open: history.o[i],
                high: history.h[i],
                low: history.l[i],
                close: history.c[i],
                volume: history.v[i].toString(),
                change: change,
            });
        }
    
        return formattedHistory;

    } catch (error) {
        console.error(`Failed to get historical data for ${assetName}:`, error);
        return []; // Return empty array on failure
    }
}
