

'use server';

import type { ChartData, CommodityPriceData, ScenarioResult, HistoricalQuote, HistoryInterval, UcsData, RiskAnalysisData, RiskMetric, GenerateReportInput, GenerateReportOutput } from './types';
import { getOptimizedHistorical, getOptimizedCommodityPrices } from './yahoo-finance-optimizer';
import { COMMODITY_TICKER_MAP } from './yahoo-finance-config-data';
import { calculate_volatility, calculate_correlation } from './statistics';
import { db } from './firebase-config';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { saveCommodityData } from './database-service';
import { scrapeUrlFlow } from '@/ai/flows/scrape-commodity-price-flow';


// Functions for the "Analysis" page that call Genkit flows directly.
export async function runScenarioSimulation(asset: string, changeType: 'percentage' | 'absolute', value: number): Promise<ScenarioResult> {
    const { simulateScenario } = await import('@/ai/flows/simulate-scenario-flow');
    return simulateScenario({ asset, changeType, value });
}

export async function getRiskAnalysisData(): Promise<RiskAnalysisData> {
    const assetNames = Object.keys(COMMODITY_TICKER_MAP);
    const startDate = new Date();
    startDate.setDate(new Date().getDate() - 31); // Last 30 days for volatility/correlation

    try {
        // Fetch index history
        const indexHistoryRaw = await getFormattedHistoricalData('BOVA11.SA', '1d', 30);
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
            lastUpdated: new Date(data.savedAt.seconds * 1000).toLocaleString('pt-BR'),
            currency: commodityInfo.currency,
          });
        }
      } catch (error) {
        console.error(`[DATA_SERVICE] Failed to fetch price for ${name} from Firestore:`, error);
      }
    }
    return prices;
  }

export async function getUcsIndexValue(interval: HistoryInterval = '1d'): Promise<{ history: ChartData[], latest: UcsData }> {
    const { calculateUcsIndex } = await import('@/ai/flows/calculate-ucs-index-flow');
    const result = await calculateUcsIndex();
    
    // If the formula is not configured, we don't need to fetch history.
    if (!result.isConfigured) {
        return {
            history: [],
            latest: result
        }
    }

    // For historical data, we need to calculate it day-by-day based on historical prices
    // This is a simplified version. A production system might pre-calculate and store this.
    // For now, we'll fetch the history of a benchmark (e.g., BOVA11) to represent the index trend.
    const history = await getBenchmarkHistoricalData(interval);
    
    // Adjust the history to end with the current calculated value
    if (history.length > 0) {
        const lastRealValue = history[history.length - 1].value;
        const adjustmentFactor = lastRealValue !== 0 ? result.indexValue / lastRealValue : 1;
        const adjustedHistory = history.map(point => ({
            ...point,
            value: point.value * adjustmentFactor
        }));
        
        // Ensure the very last point is the exact calculated value
        if (adjustedHistory.length > 0) {
            adjustedHistory[adjustedHistory.length - 1].value = result.indexValue;
        }

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
        
        return formattedData.slice(-limit);

    } catch (error) {
        console.error(`[LOG] Error fetching historical data for ${ticker} from Yahoo Finance:`, error);
        return [];
    }
}


async function getFormattedHistoricalData(ticker: string, interval: HistoryInterval, limit: number = 30): Promise<ChartData[]> {
    try {
        const today = new Date();
        const startDate = new Date();

        switch (interval) {
            case '1d':
                startDate.setDate(today.getDate() - (limit + 5));
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
        })).slice(-limit); // Ensure we have a consistent number of points for the main chart

    } catch (error) {
        console.error(`[LOG] Error fetching historical benchmark data for ${ticker}:`, error);
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
        const priceData: Omit<CommodityPriceData, 'id'> = {
            name: assetName,
            ticker: commodityInfo.ticker,
            price: newPrice,
            change: parseFloat(change.toFixed(2)),
            absoluteChange: parseFloat(absoluteChange.toFixed(4)),
            lastUpdated: new Date().toLocaleString('pt-BR'),
            currency: commodityInfo.currency,
        };

        await saveCommodityData(priceData);

        console.log(`[DATA_SERVICE] Successfully updated ${assetName} to ${newPrice}`);
        return { success: true, message: `${assetName} atualizado com sucesso.` };

    } catch (error) {
        console.error(`[DATA_SERVICE] Failed to manually update ${assetName}:`, error);
        return { success: false, message: `Falha ao atualizar ${assetName}.` };
    }
}
