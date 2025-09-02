
'use server';

import type { ChartData, CommodityPriceData, ScenarioResult, HistoricalQuote, HistoryInterval, UcsData, RiskAnalysisData, RiskMetric, GenerateReportInput, GenerateReportOutput, CommodityConfig, FormulaParameters } from './types';
import type { CalculateUcsIndexOutput } from '@/ai/flows/calculate-ucs-index-flow';
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


/**
 * Pure calculation function for the UCS Index. This is not a flow and can be called from anywhere.
 * @param prices - A dictionary of asset names to their latest prices.
 * @param params - The formula parameters.
 * @returns {CalculateUcsIndexOutput} The calculated index data.
 */
export async function calculateIndex(prices: { [key: string]: number }, params: FormulaParameters): Promise<CalculateUcsIndexOutput> {
    const defaultResult = { 
        indexValue: 0, 
        isConfigured: params.isConfigured,
        components: { vm: 0, vus: 0, crs: 0 }, 
        vusDetails: { pecuaria: 0, milho: 0, soja: 0 }
    };
    
    if (!params.isConfigured) {
        return defaultResult;
    }

    // --- Data Validation ---
    const requiredAssets = [
        'USD/BRL Histórico', 'EUR/BRL Histórico', 'Madeira Futuros',
        'Boi Gordo Futuros - Ago 25 (BGIc1)', 'Milho Futuros', 'Soja Futuros', 'Carbono Futuros'
    ];
    for (const asset of requiredAssets) {
        if (prices[asset] === undefined || prices[asset] === null || prices[asset] === 0) {
            console.error(`[LOG] Missing or zero price for required asset in calculation: ${asset}.`);
            return { ...defaultResult, isConfigured: true }; // Return default but indicate it was configured
        }
    }
  
    // Exchange Rates
    const taxa_usd_brl = prices['USD/BRL Histórico'];
    const taxa_eur_brl = prices['EUR/BRL Histórico'];
  
    // Prices (raw)
    const preco_lumber_mbf = prices['Madeira Futuros'];
    const preco_boi_arroba = prices['Boi Gordo Futuros - Ago 25 (BGIc1)'];
    const preco_milho_bushel_cents = prices['Milho Futuros'];
    const preco_soja_bushel_cents = prices['Soja Futuros'];
    const preco_carbono_eur = prices['Carbono Futuros'];

    // --- Price Conversions ---
    const preco_madeira_serrada_m3_usd = (preco_lumber_mbf / 1000) * 424;
    const preco_madeira_serrada_m3_brl = preco_madeira_serrada_m3_usd * taxa_usd_brl;
    const preco_madeira_tora_m3_brl = preco_madeira_serrada_m3_brl * params.FATOR_CONVERSAO_SERRADA_TORA;
    const preco_milho_ton_usd = (preco_milho_bushel_cents / 100) * (1000 / 25.4);
    const preco_milho_ton_brl = preco_milho_ton_usd * taxa_usd_brl;
    const preco_soja_ton_usd = (preco_soja_bushel_cents / 100) * (1000 / 27.2);
    const preco_soja_ton_brl = preco_soja_ton_usd * taxa_usd_brl;
    const preco_carbono_brl = preco_carbono_eur * taxa_eur_brl;
    
    // --- Formula Calculation ---
    const VM = preco_madeira_tora_m3_brl * params.VOLUME_MADEIRA_HA;
    const renda_pecuaria = params.PROD_BOI * preco_boi_arroba * params.PESO_PEC;
    const renda_milho = params.PROD_MILHO * preco_milho_ton_brl * params.PESO_MILHO;
    const renda_soja = params.PROD_SOJA * preco_soja_ton_brl * params.PESO_SOJA;
    const renda_bruta_ha = renda_pecuaria + renda_milho + renda_soja;
    const VUS = renda_bruta_ha / params.FATOR_ARREND;
    const valor_carbono = preco_carbono_brl * params.VOLUME_MADEIRA_HA * params.FATOR_CARBONO;
    const valor_agua = VUS * params.FATOR_AGUA;
    const CRS = valor_carbono + valor_agua;
    
    const ucsValue = VM + VUS + CRS;

    if (!isFinite(ucsValue)) {
        console.error('[LOG] UCS calculation resulted in a non-finite number. Returning default.');
        return { ...defaultResult, isConfigured: true };
    }

    return { 
        indexValue: parseFloat(ucsValue.toFixed(2)),
        isConfigured: params.isConfigured,
        components: {
            vm: parseFloat(VM.toFixed(2)),
            vus: parseFloat(VUS.toFixed(2)),
            crs: parseFloat(CRS.toFixed(2)),
        },
        vusDetails: {
            pecuaria: parseFloat((renda_pecuaria / params.FATOR_ARREND).toFixed(2)),
            milho: parseFloat((renda_milho / params.FATOR_ARREND).toFixed(2)),
            soja: parseFloat((renda_soja / params.FATOR_ARREND).toFixed(2)),
        }
    };
}
