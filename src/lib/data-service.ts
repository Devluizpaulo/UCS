
'use server';

import type { CommodityPriceData, FirestoreQuote } from './types';
import { getCommodities } from './commodity-config-service';
import { db } from './firebase-admin-config';
import { Timestamp } from 'firebase-admin/firestore';
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

// Helper to parse DD/MM/YYYY or DD/MM/YY string to Date object
const parseDateString = (dateStr: string): Date => {
    if (typeof dateStr !== 'string') return new Date(1970, 0, 1);
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        const fullYear = year < 100 ? year + 2000 : year;
        // Month in JS Date is 0-indexed, so we subtract 1.
        return new Date(fullYear, month - 1, day);
    }
    // Fallback for other potential date formats
    const parsedDate = new Date(dateStr);
    return isNaN(parsedDate.getTime()) ? new Date(1970, 0, 1) : parsedDate;
};


/**
 * Fetches historical data for a single asset.
 * Data is sorted by date from newest to oldest.
 * @param assetId - The ID of the asset configuration.
 * @param limit - The number of recent documents to retrieve.
 * @returns A promise that resolves to an array of Firestore quotes.
 */
async function getAssetData(assetId: string, limit: number = 30): Promise<FirestoreQuote[]> {
    const cacheKey = `assetData_${assetId}_${limit}`;
    const cached = await getCache<FirestoreQuote[]>(cacheKey, 60000 * 5); // Cache for 5 minutes
    if (cached) return cached;
    
    const collectionName = getCollectionNameFromAssetId(assetId);
    if (!collectionName) {
        console.warn(`[DataService] No collection mapping for asset ID: ${assetId}`);
        return [];
    }
    
    try {
        const snapshot = await db.collection(collectionName).orderBy('timestamp', 'desc').limit(limit).get();
        if (snapshot.empty) return [];

        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...serializeFirestoreTimestamp(doc.data())
        } as FirestoreQuote));
        
        data.sort((a, b) => parseDateString(b.data).getTime() - parseDateString(a.data).getTime());
        
        await setCache(cacheKey, data);
        return data;

    } catch (error) {
        console.error(`Error fetching data for asset ${assetId} from collection ${collectionName}:`, error);
        return [];
    }
}


export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const cacheKey = 'commodityPrices_v10_simple_refactor';
    const cachedData = await getCache<CommodityPriceData[]>(cacheKey, 60000); // 1 minute cache
    if (cachedData) return cachedData;

    try {
        const commodities = await getCommodities();
        if (!commodities || commodities.length === 0) return [];

        const allHistoriesPromises = commodities.map(c => getAssetData(c.id, 2));
        const allHistories = await Promise.all(allHistoriesPromises);

        const priceData = commodities.map((commodity, index) => {
            const history = allHistories[index];
            let currentPrice = 0, change = 0, absoluteChange = 0, lastUpdated = 'N/A';
            let originalCurrency = commodity.currency;

            if (history && history.length > 0) {
                const latest = history[0];
                lastUpdated = latest.data || new Date(latest.created_at).toLocaleString('pt-BR');
                
                // For 'madeira', use the pre-converted and adjusted BRL price.
                if (commodity.id === 'madeira_serrada_futuros' && latest.madeira_tora_brl_ajustado) {
                    currentPrice = latest.madeira_tora_brl_ajustado;
                    originalCurrency = 'BRL'; // The final price is in BRL
                } else {
                    currentPrice = latest.ultimo || 0;
                }
                
                if (history.length > 1) {
                    const previous = history[1];
                    let previousPrice = 0;
                    
                    if (commodity.id === 'madeira_serrada_futuros' && previous.madeira_tora_brl_ajustado) {
                        previousPrice = previous.madeira_tora_brl_ajustado;
                    } else {
                        previousPrice = previous.ultimo || 0;
                    }

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
                currency: originalCurrency, // Use the correct final currency.
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
