
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
        // We fetch ordered by a server timestamp to get recent documents efficiently
        const snapshot = await db.collection(collectionName).orderBy('timestamp', 'desc').limit(limit).get();
        if (snapshot.empty) return [];

        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...serializeFirestoreTimestamp(doc.data())
        } as FirestoreQuote));
        
        // After fetching, we sort in-memory using the 'data' field (DD/MM/YYYY)
        // from newest to oldest, as requested.
        data.sort((a, b) => parseDateString(b.data).getTime() - parseDateString(a.data).getTime());
        
        await setCache(cacheKey, data);
        return data;

    } catch (error) {
        console.error(`Error fetching data for asset ${assetId} from collection ${collectionName}:`, error);
        return [];
    }
}


export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const cacheKey = 'commodityPrices_v5_all'; 
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
            
            if (history && history.length > 0) {
                // history is sorted newest to oldest, so history[0] is the latest.
                const latest = history[0];
                currentPrice = latest.ultimo || 0; // Use 'ultimo' as the main price.
                lastUpdated = latest.data || new Date(latest.created_at).toLocaleString('pt-BR');
                
                if (history.length > 1) {
                    // history[1] is the previous day.
                    const previousPrice = history[1].ultimo || 0;
                    if (previousPrice > 0) { // Avoid division by zero
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
     return getAssetData(assetId, limit);
}


// --- UCS INDEX FUNCTIONS (Temporarily returning default data) ---

export async function getUcsIndexValue(): Promise<UcsData> {
    const defaultResult: UcsData = {
        ivp: 0,
        ucsCF: 0,
        ucsASE: 0,
        pdm: 0,
        isConfigured: false,
        components: { vmad: 0, vus: 0, crs: 0 },
        vusDetails: { pecuaria: 0, milho: 0, soja: 0 },
    };
    // Return default empty data to "disable" the index display.
    return Promise.resolve(defaultResult);
}

export async function getUcsIndexHistory(interval: HistoryInterval = '1d'): Promise<ChartData[]> {
    // Return empty array to "disable" the history chart.
    return Promise.resolve([]);
}
