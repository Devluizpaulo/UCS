'use server';

import type { ChartData, CommodityPriceData, ScenarioResult } from './types';
import { db } from './firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// Helper function to get the most recent data document from Firestore
async function getLatestDataDocument() {
    const dataRef = collection(db, 'dados_historicos');
    const q = query(dataRef, orderBy('timestamp', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.error("Nenhum documento encontrado na coleção 'dados_historicos'.");
        return null;
    }
    return querySnapshot.docs[0].data();
}

// Helper function to get the full historical data
async function getFullHistoricalData() {
    const dataRef = collection(db, 'dados_historicos');
    const q = query(dataRef, orderBy('timestamp', 'asc')); // Get all data in chronological order
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.error("Nenhum documento encontrado na coleção 'dados_historicos'.");
        return [];
    }
    return querySnapshot.docs.map(doc => doc.data());
}


export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const latestData = await getLatestDataDocument();
    if (!latestData || !latestData.commodities) {
        return [];
    }

    // Assuming latestData.commodities is an object like { 'Boi Gordo': { price: X, change: Y }, ... }
    return Object.entries(latestData.commodities).map(([name, data]) => ({
        name,
        price: (data as any).price || 0,
        change: (data as any).change || 0,
    }));
}

export async function getUcsIndexValue(): Promise<ChartData[]> {
     const historicalData = await getFullHistoricalData();
     if (!historicalData.length) {
         return [];
     }
     
     return historicalData.map(data => ({
         // Assuming timestamp is a Firestore Timestamp object
         time: data.timestamp.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
         value: data.ucs_index || 0,
     }));
}

export async function getAssetHistoricalData(assetName: string): Promise<ChartData[]> {
    const historicalData = await getFullHistoricalData();
    if (!historicalData.length) {
        return [];
    }
    return historicalData.map(data => ({
        time: data.timestamp.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        value: data.commodities?.[assetName]?.price || 0,
    })).filter(d => d.value > 0);
}


// Functions for the "Analysis" page that call Genkit flows directly.
// These can remain as they are, since they perform real-time AI analysis and simulation.
export async function getAssetAnalysis(assetName: string, historicalData: number[]) {
    const { analyzeAsset } = await import('@/ai/flows/analyze-asset-flow');
    return analyzeAsset({ assetName, historicalData });
}

export async function runScenarioSimulation(asset: string, changeType: 'percentage' | 'absolute', value: number): Promise<ScenarioResult> {
    const { simulateScenario } = await import('@/ai/flows/simulate-scenario-flow');
    // This flow needs real-time prices to work, so it will still call the scraping flow internally.
    return simulateScenario({ asset, changeType, value });
}
