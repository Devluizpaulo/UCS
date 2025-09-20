
'use server';

import type { ChartData, CommodityPriceData, HistoryInterval, UcsData, FirestoreQuote, CommodityConfig } from './types';
import { getCommodities } from './commodity-config-service';
import { db } from './firebase-admin-config';
import { Timestamp } from 'firebase-admin/firestore';
import { getFormulaParameters } from './formula-service';
import { calculateIndex } from './calculation-service';
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
        return new Date(fullYear, month - 1, day);
    }
    const parsedDate = new Date(dateStr);
    return isNaN(parsedDate.getTime()) ? new Date(1970, 0, 1) : parsedDate;
};


/**
 * Fetches and caches historical data for a single asset.
 * This is the new centralized function for data retrieval.
 * @param assetId - The ID of the asset configuration.
 * @param limit - The number of recent documents to retrieve.
 * @returns A promise that resolves to an array of Firestore quotes, sorted newest to oldest.
 */
async function fetchAndCacheAssetData(assetId: string, limit: number = 30): Promise<FirestoreQuote[]> {
    const cacheKey = `assetData_v3_${assetId}_${limit}`;
    const cachedData = await getCache<FirestoreQuote[]>(cacheKey, 60000); // 1 minute cache
    if (cachedData) return cachedData;
    
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
        
        // Data from Firestore is already ordered by timestamp desc, so it's newest to oldest.
        // For consistency, let's ensure it's sorted by the 'data' field string just in case.
        data.sort((a, b) => parseDateString(b.data).getTime() - parseDateString(a.data).getTime());
        
        await setCache(cacheKey, data);
        return data;

    } catch (error) {
        console.error(`Error fetching data for asset ${assetId} from collection ${collectionName}:`, error);
        return [];
    }
}


export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const cacheKey = 'commodityPrices_v3';
    const cachedData = await getCache<CommodityPriceData[]>(cacheKey, 60000); // 1 minute cache
    if (cachedData) return cachedData;

    try {
        const commodities = await getCommodities();
        if (!commodities || commodities.length === 0) return [];
        
        const allHistoriesPromises = commodities.map(c => fetchAndCacheAssetData(c.id, 2));
        const allHistories = await Promise.all(allHistoriesPromises);

        const priceData = commodities.map((commodity, index) => {
            const history = allHistories[index];
            let currentPrice = 0, change = 0, absoluteChange = 0, lastUpdated = 'N/A';
            
            // The price is taken directly from 'ultimo' as it's assumed to be pre-converted by n8n.
            if (history.length > 0) {
                const latest = history[0];
                currentPrice = latest.ultimo || 0;
                lastUpdated = latest.data || new Date(latest.created_at).toLocaleString('pt-BR');
                
                if (history.length > 1) {
                    const previousPrice = history[1].ultimo || 0;
                    if (previousPrice !== 0) {
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
                // No more currency conversion here, currency is assumed to be BRL if not specified.
                currency: commodity.currency || 'BRL',
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
     return fetchAndCacheAssetData(assetId, limit);
}


export async function getUcsIndexValue(): Promise<UcsData> {
    const cacheKey = 'ucsIndexValue_latest';
    const cachedData = await getCache<UcsData>(cacheKey);
    if (cachedData) return cachedData;

    const defaultResult: UcsData = {
        ivp: 0,
        ucsCF: 0,
        ucsASE: 0,
        pdm: 0,
        isConfigured: false,
        components: { vmad: 0, vus: 0, crs: 0 },
        vusDetails: { pecuaria: 0, milho: 0, soja: 0 },
    };

    try {
        const [params, prices] = await Promise.all([getFormulaParameters(), getCommodityPrices()]);
        if (!params.isConfigured || prices.length === 0) {
            return { ...defaultResult, isConfigured: params.isConfigured };
        }
        const result = await calculateIndex(prices, params);
        await setCache(cacheKey, result);
        return result;
    } catch (error) {
        console.error(`Failed to get latest index value: ${error}`);
        return defaultResult;
    }
}

export async function getUcsIndexHistory(interval: HistoryInterval = '1d'): Promise<ChartData[]> {
    const cacheKey = `ucsIndexHistory_v2_${interval}`;
    const cachedData = await getCache<ChartData[]>(cacheKey);
    if (cachedData) return cachedData;

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
    const result = history.reverse();
    await setCache(cacheKey, result);
    return result;
}
