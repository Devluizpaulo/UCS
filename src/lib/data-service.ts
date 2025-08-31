'use server';

import type { ChartData, CommodityPriceData, ScenarioResult, HistoricalQuote, AnalyzeAssetOutput } from './types';
import yahooFinance from 'yahoo-finance2';

// Functions for the "Analysis" page that call Genkit flows directly.
export async function getAssetAnalysis(assetName: string, historicalData: number[]): Promise<AnalyzeAssetOutput> {
    const { analyzeAsset } = await import('@/ai/flows/analyze-asset-flow');
    return analyzeAsset({ assetName, historicalData });
}

export async function runScenarioSimulation(asset: string, changeType: 'percentage' | 'absolute', value: number): Promise<ScenarioResult> {
    const { simulateScenario } = await import('@/ai/flows/simulate-scenario-flow');
    return simulateScenario({ asset, changeType, value });
}

// Functions for the dashboard to get real-time data via flows
export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const { getCommodityPrices } = await import('@/ai/flows/get-commodity-prices-flow');
    const commodityNames = [
        'USD/BRL Histórico',
        'EUR/BRL Histórico',
    ];
    return getCommodityPrices({ commodities: commodityNames });
}

export async function getUcsIndexValue(): Promise<ChartData[]> {
    const { calculateUcsIndex } = await import('@/ai/flows/calculate-ucs-index-flow');
    // For simplicity, we'll get a single index value and create a mock history for the chart.
    // In a real scenario with a database, you'd fetch the true history.
    const { indexValue } = await calculateUcsIndex();
    
    // Generate some mock historical data ending in the real value
    const { generateRealisticHistoricalData } = await import('./utils');
    return generateRealisticHistoricalData(indexValue, 60, 0.02, 'minute');
}


const commodityTickerMap: { [key: string]: string } = {
  'USD/BRL Histórico': 'BRL=X',
  'EUR/BRL Histórico': 'EURBRL=X',
};

export async function getAssetHistoricalData(assetName: string): Promise<HistoricalQuote[]> {
    const ticker = commodityTickerMap[assetName];
    if (!ticker) {
        console.error(`No ticker found for asset: ${assetName}`);
        return [];
    }

    try {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 31); // Fetch 31 days to ensure we get 30 data points

        const queryOptions = {
            period1: thirtyDaysAgo.toISOString().split('T')[0],
            period2: today.toISOString().split('T')[0], // Fetch up to today to get the latest completed session
            interval: '1d' as const,
        };
        
        const result = await yahooFinance.historical(ticker, queryOptions);

        if (!result || result.length === 0) {
            return [];
        }

        const formattedData: HistoricalQuote[] = [];
        for (let i = 0; i < result.length; i++) {
            const current = result[i];
            const previousClose = i > 0 ? result[i - 1].close : current.open; // Use open for the first day's change
            
            const change = previousClose === 0 ? 0 : ((current.close - previousClose) / previousClose) * 100;

            formattedData.push({
                date: current.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                open: current.open,
                high: current.high,
                low: current.low,
                close: current.close,
                volume: current.volume?.toLocaleString('pt-BR') ?? 'N/A',
                change: change,
            });
        }

        return formattedData.slice(-30); // Return only the last 30 data points

    } catch (error) {
        console.error(`[LOG] Error fetching historical data for ${ticker} from Yahoo Finance:`, error);
        return [];
    }
}
