'use server';

import { db } from './firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import type { CommodityPriceData, ChartData } from './types';
import { generateRealisticHistoricalData } from './utils';

// This is a placeholder. In a real app, you would have a more robust way
// to handle the fact that Firestore doesn't store historical data for assets out of the box.
// You would likely have a separate collection for historical data points.
async function getAssetHistoricalData(assetName: string, currentPrice: number): Promise<ChartData[]> {
    // For now, we'll generate realistic-looking data for the chart.
    // Your Python service would be responsible for populating a proper historical collection.
    return generateRealisticHistoricalData(currentPrice, 30, 0.1, 'day');
}


export async function getCommodityPricesFromFirestore(): Promise<CommodityPriceData[]> {
    console.log("Fetching commodity prices from Firestore...");
    try {
        const commoditiesCol = collection(db, 'commodities');
        const q = query(commoditiesCol, orderBy('name'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn("Firestore 'commodities' collection is empty. Returning mock data.");
            // Return mock data if Firestore is empty, so the app doesn't break.
            return [
                { name: 'Água', price: 15.00, change: 0.0 },
                { name: 'Boi Gordo', price: 225.40, change: -0.25 },
                { name: 'Créditos de Carbono', price: 27.50, change: 1.5 },
                { name: 'Madeira', price: 550.00, change: 2.3 },
                { name: 'Milho', price: 58.70, change: 0.5 },
                { name: 'Soja', price: 125.20, change: -1.1 },
            ];
        }

        const prices = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                name: data.name,
                price: data.price,
                change: data.change,
            } as CommodityPriceData;
        });
        console.log("Successfully fetched prices:", prices);
        return prices;

    } catch (error) {
        console.error("Error fetching from Firestore:", error);
        throw new Error("Could not connect to the database to fetch commodity prices.");
    }
}


export async function getUcsIndexHistory(): Promise<ChartData[]> {
    console.log("Fetching UCS Index history from Firestore...");
    try {
        const indexHistoryCol = collection(db, 'ucs_index_history');
        const q = query(indexHistoryCol, orderBy('timestamp', 'desc'), limit(30));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn("Firestore 'ucs_index_history' collection is empty. Generating mock data.");
            // Generate mock data if Firestore is empty.
            return generateRealisticHistoricalData(102.5, 30, 0.05, 'minute');
        }

        const history = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const date = data.timestamp.toDate();
            return {
                time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                value: data.value,
            };
        }).reverse(); // reverse to show oldest to newest

        console.log("Successfully fetched UCS Index history.");
        return history;

    } catch (error) {
        console.error("Error fetching UCS Index history from Firestore:", error);
        throw new Error("Could not connect to the database to fetch index history.");
    }
}


// The functions below are now simulated as your Python API would handle them.
// We keep them here to ensure the "Analysis" page continues to function.

export async function getAssetAnalysis(assetName: string, historicalData: number[]) {
    // This now calls the Genkit flow directly, as it's a pure AI function.
    const { analyzeAsset } = await import('@/ai/flows/analyze-asset-flow');
    return analyzeAsset({ assetName, historicalData });
}

export async function runScenarioSimulation(asset: string, changeType: 'percentage' | 'absolute', value: number) {
    // This now calls the Genkit flow directly.
    const { simulateScenario } = await import('@/ai/flows/simulate-scenario-flow');
    return simulateScenario({ asset, changeType, value });
}
