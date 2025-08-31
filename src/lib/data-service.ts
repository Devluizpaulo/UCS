'use server';

import { generateRealisticHistoricalData } from './utils';
import type { ChartData, CommodityPriceData } from './types';

export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const { getCommodityPrices } = await import('@/ai/flows/get-commodity-prices-flow');
    const commodityNames = ['Créditos de Carbono', 'Boi Gordo', 'Milho', 'Soja', 'Madeira', 'Água'];
    return getCommodityPrices({ commodities: commodityNames });
}

export async function getUcsIndexValue(): Promise<ChartData[]> {
    const { calculateUcsIndex } = await import('@/ai/flows/calculate-ucs-index-flow');
    // This flow calculates a single value. We will wrap it in an array with a timestamp
    // to match the ChartData structure, but in a real scenario, you'd fetch a series.
    const result = await calculateUcsIndex();
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // For the chart, we need a history. We'll generate some realistic-looking
    // data for the past, ending with the most recent calculated value.
    const historicalData = generateRealisticHistoricalData(result.indexValue, 30, 0.05, 'minute');
    
    return historicalData;
}


// Functions for the "Analysis" page that call Genkit flows directly.
export async function getAssetAnalysis(assetName: string, historicalData: number[]) {
    const { analyzeAsset } = await import('@/ai/flows/analyze-asset-flow');
    return analyzeAsset({ assetName, historicalData });
}

export async function runScenarioSimulation(asset: string, changeType: 'percentage' | 'absolute', value: number) {
    const { simulateScenario } = await import('@/ai/flows/simulate-scenario-flow');
    return simulateScenario({ asset, changeType, value });
}
