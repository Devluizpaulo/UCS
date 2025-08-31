'use server';

import type { ChartData, CommodityPriceData, ScenarioResult } from './types';

// Functions for the "Analysis" page that call Genkit flows directly.
export async function getAssetAnalysis(assetName: string, historicalData: number[]) {
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
    const commodityNames = ['Créditos de Carbono', 'Boi Gordo', 'Milho', 'Soja', 'Madeira', 'Água'];
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

export async function getAssetHistoricalData(assetName: string, currentPrice: number): Promise<ChartData[]> {
    // Generate some mock historical data ending in the real value
    const { generateRealisticHistoricalData } = await import('./utils');
    return generateRealisticHistoricalData(currentPrice, 30, 0.05, 'day');
}
