
'use server';

import type { ChartData, CommodityPriceData, HistoryInterval, UcsData, FirestoreQuote, CommodityConfig } from './types';
import { getCommodities } from './commodity-config-service';
import { db } from './firebase-admin-config';
import { Timestamp } from 'firebase-admin/firestore';
import { getFormulaParameters } from './formula-service';
import { calculateIndex } from './calculation-service';

const serializeFirestoreTimestamp = (data: any): any => {
    if (data && typeof data === 'object') {
        if (data instanceof Timestamp) {
            return data.toDate().toISOString();
        }
        if (Array.isArray(data)) {
            return data.map(serializeFirestoreTimestamp);
        }
        const newObj: { [key: string]: any } = {};
        for (const key in data) {
            newObj[key] = serializeFirestoreTimestamp(data[key]);
        }
        return newObj;
    }
    return data;
};

// Derives the collection name from the asset's ID, which is more reliable.
// e.g., "boi_gordo_futuros" becomes "boi_gordo"
function getCollectionNameFromAssetId(assetId: string): string {
    return assetId.replace(/_futuros$/, '').toLowerCase();
}


async function getAssetData(assetId: string, limit: number = 1): Promise<FirestoreQuote[]> {
    if (!assetId) return [];
    const collectionName = getCollectionNameFromAssetId(assetId);
    
    try {
        const query = db.collection(collectionName).orderBy('created_at', 'desc').limit(limit);
        const snapshot = await query.get();
        if (snapshot.empty) return [];
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...serializeFirestoreTimestamp(doc.data())
        } as FirestoreQuote));
    } catch (error) {
        console.error(`Error fetching data for asset ID ${assetId} (collection: ${collectionName}):`, error);
        return [];
    }
}

export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    try {
        const commodities = await getCommodities();
        if (!commodities || commodities.length === 0) return [];

        const pricePromises = commodities.map(async (commodity) => {
            // Pass the commodity.id, not the ticker, to getAssetData
            const assetHistory = await getAssetData(commodity.id, 2);
            let currentPrice = 0, change = 0, absoluteChange = 0, lastUpdated = 'N/A';

            if (assetHistory.length > 0) {
                const latest = assetHistory[0];
                currentPrice = latest.abertura > 0 ? latest.abertura : latest.ultimo || 0;
                lastUpdated = latest.created_at ? new Date(latest.created_at).toLocaleString('pt-BR') : 'N/A';
                
                if (assetHistory.length > 1) {
                    const previous = assetHistory[1];
                    const previousPrice = previous.abertura > 0 ? previous.abertura : previous.ultimo || 0;
                    if (previousPrice !== 0) {
                        absoluteChange = currentPrice - previousPrice;
                        change = (absoluteChange / previousPrice) * 100;
                    }
                }
            }
            return { ...commodity, price: currentPrice, change, absoluteChange, lastUpdated };
        });

        return Promise.all(pricePromises);
    } catch (error) {
        console.error(`Failed to get commodity prices: ${error}`);
        return [];
    }
}

export async function getCotacoesHistorico(assetId: string, limit: number = 30): Promise<FirestoreQuote[]> {
     return getAssetData(assetId, limit);
}


export async function getUcsIndexValue(): Promise<UcsData> {
    try {
        const [params, prices] = await Promise.all([getFormulaParameters(), getCommodityPrices()]);
        if (!params.isConfigured || prices.length === 0) {
            return {
                indexValue: 0, isConfigured: false, components: { vm: 0, vus: 0, crs: 0 },
                vusDetails: { pecuaria: 0, milho: 0, soja: 0 },
            };
        }
        return calculateIndex(prices, params);
    } catch (error) {
        console.error(`Failed to get latest index value: ${error}`);
        return {
            indexValue: 0, isConfigured: false, components: { vm: 0, vus: 0, crs: 0 },
            vusDetails: { pecuaria: 0, milho: 0, soja: 0 },
        };
    }
}

export async function getUcsIndexHistory(interval: HistoryInterval = '1d'): Promise<ChartData[]> {
    const history: ChartData[] = [];
    try {
        const limit = { '1d': 30, '1wk': 26, '1mo': 60 }[interval] || 30;
        const querySnapshot = await db.collection('ucs_index_history').orderBy('savedAt', 'desc').limit(limit).get();
        if (!querySnapshot.empty) {
            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                const date = data.savedAt?.toDate ? data.savedAt.toDate() : new Date();
                history.push({
                    time: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                    value: data.value,
                });
            });
        }
    } catch (error) {
        console.error(`Failed to get index history: ${error}`);
    }
    return history.reverse();
}
