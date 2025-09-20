
'use server';

import type { CommodityPriceData, FirestoreQuote } from './types';
import { getCommodities } from './commodity-config-service';
import { db } from './firebase-admin-config';
import { Timestamp, DocumentData } from 'firebase-admin/firestore';
import { getCache, setCache } from './cache-service';
import { ASSET_COLLECTION_MAP } from './marketdata-config';

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

function getCollectionNameFromAssetId(assetId: string): string | null {
    return ASSET_COLLECTION_MAP[assetId] || null;
}

/**
 * Fetches historical data for a single asset.
 * Data is sorted by date from newest to oldest.
 * @param assetId - The ID of the asset configuration.
 * @param limit - The number of recent documents to retrieve.
 * @returns A promise that resolves to an array of Firestore quotes.
 */
async function getAssetData(assetId: string, limit: number = 30): Promise<FirestoreQuote[]> {
    const cacheKey = `assetData_${assetId}_${limit}`;
    const cached = await getCache<FirestoreQuote[]>(cacheKey, 60 * 5); // Cache for 5 minutes
    if (cached) return cached;
    
    const collectionName = getCollectionNameFromAssetId(assetId);
    if (!collectionName) {
        console.warn(`[DataService] No collection mapping for asset ID: ${assetId}`);
        return [];
    }
    
    try {
        const snapshot = await db.collection(collectionName).orderBy('timestamp', 'desc').limit(limit).get();
        if (snapshot.empty) return [];

        const data = snapshot.docs.map((doc: DocumentData) => ({
            id: doc.id,
            ...serializeFirestoreTimestamp(doc.data())
        } as FirestoreQuote));
        
        await setCache(cacheKey, data);
        return data;

    } catch (error) {
        console.error(`Error fetching data for asset ${assetId} from collection ${collectionName}:`, error);
        return [];
    }
}


export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const cacheKey = 'commodityPrices_v14_final';
    const cachedData = await getCache<CommodityPriceData[]>(cacheKey, 60); // 1 minute cache
    if (cachedData) return cachedData;

    try {
        const commodities = await getCommodities();
        if (!commodities || commodities.length === 0) return [];

        const allHistoriesPromises = commodities.map(c => getAssetData(c.id, 2));
        const allHistories = await Promise.all(allHistoriesPromises);

        const priceData = commodities.map((commodity, index) => {
            const history = allHistories[index];
            let currentPrice = 0, change = 0, absoluteChange = 0, lastUpdated = 'N/A';
            
            if (history && history.length > 0) {
                const latest = history[0];
                currentPrice = latest.ultimo || 0;
                change = latest.variacao_pct ?? 0;
                lastUpdated = latest.data || new Date(latest.timestamp).toLocaleString('pt-BR');

                if (currentPrice > 0 && change !== 0) {
                    // Calculate absoluteChange based on the percentage change
                    // The formula is PreviousPrice = CurrentPrice / (1 + (Change/100))
                    // AbsoluteChange = CurrentPrice - PreviousPrice
                    const previousPrice = currentPrice / (1 + (change / 100));
                    absoluteChange = currentPrice - previousPrice;
                } else if (history.length > 1) {
                    // Fallback to calculating from previous day if variacao_pct is not available
                    const previous = history[1];
                    const previousPrice = previous.ultimo || 0;
                    if (previousPrice > 0) {
                        absoluteChange = currentPrice - previousPrice;
                        change = (absoluteChange / previousPrice) * 100;
                    }
                }
            }
            
            return {
                ...commodity,
                price: currentPrice,
                change,
                absoluteChange,
                lastUpdated,
            };
        });
        
        await setCache(cacheKey, priceData);
        return priceData;
    } catch (error) {
        console.error(`Failed to get commodity prices: ${error}`);
        return [];
    }
}


export async function getCotacoesHistorico(assetId: string, limit: number = 30): Promise<FirestoreQuote[]> {
     return getAssetData(assetId, limit);
}
