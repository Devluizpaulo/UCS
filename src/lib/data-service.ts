

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

/**
 * Maps the asset document ID from 'commodities' collection to the correct price history collection name.
 * @param assetId The document ID from the 'commodities' collection (e.g., 'boi_gordo_futuros').
 * @returns The name of the collection holding price data (e.g., 'boi_gordo').
 */
function getCollectionNameFromAssetId(assetId: string): string {
    // This logic is critical. It derives the collection name from the asset ID.
    // e.g., "boi_gordo_futuros" -> "boi_gordo"
    // e.g., "usd_brl___dolar_americano_real_brasileiro" -> "usd_brl"
    const normalizedId = assetId.toLowerCase();
    
    // Split by the '___' separator if it exists
    const parts = normalizedId.split('___');
    
    // The collection name is the first part, with "_futuros" removed.
    return parts[0].replace(/_futuros$/, '');
}

// Helper to parse DD/MM/YYYY or DD/MM/YY string to Date object
const parseDateString = (dateStr: string): Date => {
    if (typeof dateStr !== 'string') return new Date(1970, 0, 1);

    // Regex for DD/MM/YY
    if (/^\d{2}\/\d{2}\/\d{2}$/.test(dateStr)) {
        let [day, month, year] = dateStr.split('/').map(Number);
        year += (year > 50 ? 1900 : 2000);
        return new Date(year, month - 1, day);
    }
    
    // Regex for DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
    }
    
    const parsedDate = new Date(dateStr);
    return isNaN(parsedDate.getTime()) ? new Date(1970, 0, 1) : parsedDate;
};


async function getAssetData(assetId: string, limit: number = 1): Promise<FirestoreQuote[]> {
    if (!assetId) return [];
    
    const collectionName = getCollectionNameFromAssetId(assetId);
    
    try {
        const queryLimit = Math.max(limit, 100); 
        const query = db.collection(collectionName).limit(queryLimit);
        const snapshot = await query.get();
        
        if (snapshot.empty) return [];

        const allDocs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...serializeFirestoreTimestamp(doc.data())
        } as FirestoreQuote));

        const sortedDocs = allDocs.sort((a, b) => {
            const dateA = a.data ? parseDateString(a.data).getTime() : new Date(a.created_at).getTime();
            const dateB = b.data ? parseDateString(b.data).getTime() : new Date(b.created_at).getTime();
            return dateB - dateA; // Sort descending (most recent first)
        });

        return sortedDocs.slice(0, limit);

    } catch (error) {
        console.error(`Error fetching data for asset ID ${assetId} (collection: ${collectionName}):`, error);
        return [];
    }
}

export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    try {
        const commodities = await getCommodities();
        if (!commodities || commodities.length === 0) return [];
        
        const allAssetPromises = commodities.map(c => getAssetData(c.id, 2));
        const allAssetHistories = await Promise.all(allAssetPromises);

        const priceDataMap = new Map<string, CommodityPriceData>();

        commodities.forEach((commodity, index) => {
            const assetHistory = allAssetHistories[index];
            let currentPrice = 0, change = 0, absoluteChange = 0, lastUpdated = 'N/A';

            if (assetHistory.length > 0) {
                const latest = assetHistory[0];
                currentPrice = latest.ultimo > 0 ? latest.ultimo : latest.abertura || 0;
                lastUpdated = latest.data ? latest.data : (latest.created_at ? new Date(latest.created_at).toLocaleString('pt-BR') : 'N/A');
                
                if (assetHistory.length > 1) {
                    const previous = assetHistory[1];
                    const previousPrice = previous.ultimo > 0 ? previous.ultimo : previous.abertura || 0;
                    if (previousPrice !== 0) {
                        absoluteChange = currentPrice - previousPrice;
                        change = (absoluteChange / previousPrice) * 100;
                    }
                }
            }
             priceDataMap.set(commodity.id, { ...commodity, price: currentPrice, change, absoluteChange, lastUpdated });
        });
        
        const usdRate = priceDataMap.get('usd_brl___dolar_americano_real_brasileiro')?.price || 0;
        const eurRate = priceDataMap.get('eur_brl___euro_real_brasileiro')?.price || 0;
        
        const finalPrices: CommodityPriceData[] = [];
        for (const commodity of commodities) {
            const data = priceDataMap.get(commodity.id);
            if (data) {
                if (data.currency === 'USD' && usdRate > 0) {
                    data.convertedPriceBRL = data.price * usdRate;
                } else if (data.currency === 'EUR' && eurRate > 0) {
                    data.convertedPriceBRL = data.price * eurRate;
                }
                finalPrices.push(data);
            }
        }

        return finalPrices;
    } catch (error) {
        console.error(`Failed to get commodity prices: ${error}`);
        return [];
    }
}

export async function getCotacoesHistorico(assetId: string, limit: number = 30): Promise<FirestoreQuote[]> {
     return getAssetData(assetId, limit);
}


export async function getUcsIndexValue(): Promise<UcsData> {
    const defaultResult: UcsData = {
        ivp: 0,
        ucsCF: 0,
        ucsASE: 0,
        isConfigured: false,
        components: { vmad: 0, vus: 0, crs: 0 },
        vusDetails: { pecuaria: 0, milho: 0, soja: 0 },
    };

    try {
        const [params, prices] = await Promise.all([getFormulaParameters(), getCommodityPrices()]);
        if (!params.isConfigured || prices.length === 0) {
            return { ...defaultResult, isConfigured: params.isConfigured };
        }
        return calculateIndex(prices, params);
    } catch (error) {
        console.error(`Failed to get latest index value: ${error}`);
        return defaultResult;
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
