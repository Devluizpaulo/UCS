

'use server';

import type { ChartData, CommodityPriceData, HistoryInterval, UcsData, FirestoreQuote } from './types';
import { getCommodities } from './commodity-config-service';
import { ASSET_COLLECTION_MAP } from './marketdata-config';
import { db } from './firebase-admin-config';
import admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { getFormulaParameters } from './formula-service';
import { calculateIndex } from './calculation-service';
import { getCache, setCache, clearCache } from './cache-service';

// --- Funções para get data from FIRESTORE ---

const CACHE_TTL_COMMODITY_PRICES = 60 * 1000; // 1 minute
const CACHE_TTL_INDEX_HISTORY = 5 * 60 * 1000; // 5 minutes

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
 * Helper to parse a "DD/MM/YYYY" string into a Date object.
 * Returns null if the format is invalid.
 */
function parseDateString(dateStr: string): Date | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return null;
  }
  const parts = dateStr.split('/');
  // Month is 0-indexed in JavaScript Date objects
  return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
}


/**
 * Fetches the most recent asset data from Firestore for a specific date or the latest available.
 * @param assetName The canonical name of the asset (e.g., 'USD/BRL...').
 * @param limit The number of recent documents to fetch.
 * @param forDate Optional date string in "YYYY-MM-DD" format.
 * @returns A promise that resolves to an array of FirestoreQuote documents.
 */
export async function getAssetData(assetName: string, limit: number = 1): Promise<FirestoreQuote[]> {
    const collectionName = ASSET_COLLECTION_MAP[assetName];
    if (!collectionName) {
        console.warn(`[DataService] No collection mapping for asset: ${assetName}`);
        return [];
    }
    
    try {
        const collectionRef = db.collection(collectionName);
        const query = collectionRef.orderBy('created_at', 'desc').limit(limit);
        const snapshot = await query.get();

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...serializeFirestoreTimestamp(data)
            } as FirestoreQuote;
        });

    } catch (error) {
        console.error(`[DataService] Error fetching data for ${assetName} in collection ${collectionName}:`, error);
        return [];
    }
}


/**
 * Retrieves the latest prices for all configured commodities.
 * It uses the 'abertura' field first, falling back to 'ultimo'.
 * It also calculates the daily change.
 * @returns A promise resolving to an array of CommodityPriceData.
 */
export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const cacheKey = 'commodityPrices_latest';
    const cachedData = await getCache<CommodityPriceData[]>(cacheKey, CACHE_TTL_COMMODITY_PRICES);
    if (cachedData) return cachedData;

    try {
        const commodities = await getCommodities();
        if (!commodities || commodities.length === 0) {
            console.warn('[DataService] No commodities configured.');
            return [];
        }

        const pricePromises = commodities.map(async (commodity) => {
            const assetHistory = await getAssetData(commodity.name, 2);

            let currentPrice = 0;
            let change = 0;
            let absoluteChange = 0;
            let lastUpdated = 'N/A';

            if (assetHistory.length > 0) {
                const latest = assetHistory[0];
                // Prioritize 'abertura', then 'ultimo'
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

            return {
                ...commodity,
                price: currentPrice,
                change,
                absoluteChange,
                lastUpdated,
            };
        });

        const result = await Promise.all(pricePromises);
        
        await setCache(cacheKey, result, CACHE_TTL_COMMODITY_PRICES);
        return result;

    } catch (error) {
        console.error(`[DataService] CRITICAL: Failed to get commodity prices. Error: ${error}`);
        return [];
    }
}


/**
 * Fetches historical quotes for a specific asset.
 * @param assetName The canonical name of the asset.
 * @param limit The number of historical points to fetch.
 * @returns An array of FirestoreQuote objects.
 */
export async function getCotacoesHistorico(assetName: string, limit: number = 30, forDate?: string): Promise<FirestoreQuote[]> {
  const collectionName = ASSET_COLLECTION_MAP[assetName];
  if (!collectionName) {
    console.warn(`[DataService] No collection mapping for asset: ${assetName}`);
    return [];
  }

  try {
    const collectionRef = db.collection(collectionName);
    let query;

    if (forDate) {
        // Find the specific date. Firestore can't query "DD/MM/YYYY" strings effectively with ranges.
        // We fetch a larger batch and filter in memory, which is acceptable for this use case.
        const snapshot = await collectionRef.orderBy('created_at', 'desc').limit(60).get();
        if (snapshot.empty) return [];

        const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreQuote));
        
        const targetDate = new Date(forDate);
        
        // Find the index of the document for the target date
        const targetIndex = allDocs.findIndex(doc => {
            if (!doc.data) return false;
            const docDate = parseDateString(doc.data);
            if (!docDate) return false;
            return docDate.getUTCFullYear() === targetDate.getUTCFullYear() &&
                   docDate.getUTCMonth() === targetDate.getUTCMonth() &&
                   docDate.getUTCDate() === targetDate.getUTCDate();
        });

        if (targetIndex !== -1) {
            // If found, return the 30 days of data ending on that date
            return allDocs.slice(targetIndex, targetIndex + limit).map(d => serializeFirestoreTimestamp(d));
        } else {
             // If not found, fall back to the latest 30 days
             return allDocs.slice(0, limit).map(d => serializeFirestoreTimestamp(d));
        }

    } else {
        // Default behavior: get the latest N quotes
        query = collectionRef.orderBy('created_at', 'desc').limit(limit);
        const snapshot = await query.get();
        if (snapshot.empty) return [];
        return snapshot.docs.map(doc => ({ id: doc.id, ...serializeFirestoreTimestamp(doc.data()) } as FirestoreQuote));
    }

  } catch (error) {
    console.error(`[DataService] Error fetching history for ${assetName}:`, error);
    return [];
  }
}


/**
 * Fetches the latest calculated UCS Index value.
 * If no value is found in history, it attempts to calculate a new one.
 * @returns The latest UcsData object or a default if not found/configured.
 */
export async function getUcsIndexValue(): Promise<UcsData> {
  const cacheKey = `ucsIndexValue_latest`;
  const cachedData = await getCache<UcsData>(cacheKey, CACHE_TTL_COMMODITY_PRICES);
  if (cachedData) return cachedData;
  
  try {
    const collectionRef = db.collection('ucs_index_history');
    const query = collectionRef.orderBy('savedAt', 'desc').limit(1);
    const snapshot = await query.get();

    if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as UcsData;
        await setCache(cacheKey, data, CACHE_TTL_COMMODITY_PRICES);
        return data;
    }

    // If history is empty, calculate on the fly
    console.warn('[DataService] No UCS index history found. Calculating a new value.');
    const [params, prices] = await Promise.all([getFormulaParameters(), getCommodityPrices()]);
    if (!params.isConfigured || prices.length === 0) {
        return {
            indexValue: 0,
            isConfigured: false,
            components: { vm: 0, vus: 0, crs: 0 },
            vusDetails: { pecuaria: 0, milho: 0, soja: 0 },
        };
    }
    const result = calculateIndex(prices, params);
    await setCache(cacheKey, result, CACHE_TTL_COMMODITY_PRICES);
    return result;

  } catch (error) {
    console.error(`[DataService] Failed to get latest index value. Error: ${error}`);
    return {
      indexValue: 0,
      isConfigured: false,
      components: { vm: 0, vus: 0, crs: 0 },
      vusDetails: { pecuaria: 0, milho: 0, soja: 0 },
    };
  }
}


/**
 * Fetches the historical data for the UCS Index chart.
 * This function ONLY reads data from the history collection.
 * @param interval The time interval for the history.
 * @returns An array of ChartData points.
 */
export async function getUcsIndexHistory(interval: HistoryInterval = '1d'): Promise<ChartData[]> {
    const cacheKey = `ucsIndexHistory_${interval}`;
    const cachedData = await getCache<ChartData[]>(cacheKey, CACHE_TTL_INDEX_HISTORY);
    if (cachedData) return cachedData;
    
    const history: ChartData[] = [];
    try {
        const limitMap = { '1d': 30, '1wk': 26, '1mo': 60 };
        const qLimit = limitMap[interval] || 30;

        const historyQuery = db.collection('ucs_index_history').orderBy('savedAt', 'desc').limit(qLimit);
        const querySnapshot = await historyQuery.get();

        if (!querySnapshot.empty) {
             querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                const timestamp = data.savedAt;
                const date = timestamp?.toDate ? timestamp.toDate() : new Date();
                let formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                history.push({
                    time: formattedDate,
                    value: data.value,
                });
            });
        }
    } catch (error) {
        console.error(`[DataService] Failed to get index history. Error: ${error}`);
    }
    const result = history.reverse();
    await setCache(cacheKey, result, CACHE_TTL_INDEX_HISTORY);
    return result;
}

/**
 * Saves a batch of commodity price data to Firestore.
 * @param {Omit<FirestoreQuote, 'id' | 'timestamp'>[]} quotes - An array of quote data objects.
 * @returns {Promise<void>}
 */
export async function saveLatestQuotes(quotes: Omit<FirestoreQuote, 'id' | 'created_at'>[]): Promise<void> {
  if (!quotes || quotes.length === 0) {
    console.log('[DataService] No quote data provided to save.');
    return;
  }
  console.log(`[DataService] Starting batched write for ${quotes.length} quotes.`);
  const batch = db.batch();

  quotes.forEach((quote) => {
    const collectionName = ASSET_COLLECTION_MAP[quote.ativo];
    if (!collectionName) {
        console.warn(`[DataService] No collection mapping for asset to save: ${quote.ativo}`);
        return;
    }
    const docRef = db.collection(collectionName).doc(); // Auto-generate ID
    
    const dataToSave = {
        ...quote,
        created_at: admin.firestore.FieldValue.serverTimestamp(), // Add server-side timestamp
    };

    batch.set(docRef, dataToSave);
  });

  try {
    await batch.commit();
    console.log('[DataService] Batched quote write completed successfully.');
    // Clear relevant caches
    await clearCache('commodityPrices_latest');
    await clearCache('ucsIndexValue_latest');
  } catch (error) {
    console.error('[DataService] Batched quote write failed:', error);
    throw new Error('Failed to save latest quotes.');
  }
}
