'use server';

import type { ChartData, CommodityPriceData, ScenarioResult, HistoricalQuote, AnalyzeAssetOutput, HistoryInterval, IvcfData } from './types';
import { getOptimizedHistorical, getOptimizedCommodityPrices } from './yahoo-finance-optimizer';
import { COMMODITY_TICKER_MAP } from './yahoo-finance-config-data';

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
    const commodityNames = [
        'USD/BRL Histórico',
        'EUR/BRL Histórico',
        'Boi Gordo Futuros',
        'Soja Futuros',
        'Milho Futuros',
        'Madeira Futuros',
        'Carbono Futuros',
    ];
    return getOptimizedCommodityPrices(commodityNames);
}

export async function getIvcfIndexValue(interval: HistoryInterval = '1d'): Promise<{ history: ChartData[], latest: IvcfData }> {
    const { calculateIvcfIndex } = await import('@/ai/flows/calculate-ivcf-flow');
    const result = await calculateIvcfIndex();
    
    // For historical data, we need to calculate it day-by-day based on historical prices
    // This is a simplified version. A production system might pre-calculate and store this.
    // For now, we'll fetch the history of a benchmark (e.g., BOVA11) to represent the index trend.
    const history = await getBenchmarkHistoricalData(interval);
    
    // Adjust the history to end with the current calculated value
    if (history.length > 0) {
        const lastRealValue = history[history.length - 1].value;
        const adjustmentFactor = result.indexValue / lastRealValue;
        const adjustedHistory = history.map(point => ({
            ...point,
            value: point.value * adjustmentFactor
        }));
        
        // Ensure the very last point is the exact calculated value
        adjustedHistory[adjustedHistory.length -1].value = result.indexValue;

        return { history: adjustedHistory, latest: result };
    }

    // Fallback if benchmark history fails
    return {
        history: [{ time: new Date().toLocaleDateString('pt-BR'), value: result.indexValue }],
        latest: result
    };
}


async function getBenchmarkHistoricalData(interval: HistoryInterval = '1d'): Promise<ChartData[]> {
     // Using a major Brazilian ETF as a proxy for market trend
    const ticker = 'BOVA11.SA'; 
    return getFormattedHistoricalData(ticker, interval);
}


// Use centralized commodity ticker mapping
export async function getAssetHistoricalData(assetName: string, interval: HistoryInterval = '1d'): Promise<HistoricalQuote[]> {
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
                startDate.setDate(today.getDate() - 31); // Last 30 days
                break;
            case '1wk':
                startDate.setFullYear(today.getFullYear() - 1); // Last year for weekly data
                break;
            case '1mo':
                startDate.setFullYear(today.getFullYear() - 5); // Last 5 years for monthly data
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

        if (interval === '1d') {
            return formattedData.slice(-30); // Ensure we only show 30 data points for daily
        }
        return formattedData;

    } catch (error) {
        console.error(`[LOG] Error fetching historical data for ${ticker} from Yahoo Finance:`, error);
        return [];
    }
}


async function getFormattedHistoricalData(ticker: string, interval: HistoryInterval): Promise<ChartData[]> {
    try {
        const today = new Date();
        const startDate = new Date();

        switch (interval) {
            case '1d':
                startDate.setDate(today.getDate() - 31);
                break;
            case '1wk':
                startDate.setFullYear(today.getFullYear() - 1);
                break;
            case '1mo':
                startDate.setFullYear(today.getFullYear() - 5);
                break;
        }

        const queryOptions = {
            period1: startDate.toISOString().split('T')[0],
            period2: today.toISOString().split('T')[0],
            interval: interval,
        };

        const result = await getOptimizedHistorical(ticker, queryOptions, interval);
        if (!result || result.length === 0) return [];

        const getDateFormat = (date: Date) => {
            switch(interval) {
                case '1d': return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                case '1wk': return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                case '1mo': return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                default: return date.toLocaleDateString('pt-BR');
            }
        };

        return result.map((d: any) => ({
            time: getDateFormat(d.date),
            value: d.close
        })).slice(-30); // Ensure we have a consistent number of points for the main chart

    } catch (error) {
        console.error(`[LOG] Error fetching historical benchmark data for ${ticker}:`, error);
        return [];
    }
}
