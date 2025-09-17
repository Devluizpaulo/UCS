

'use server';

import type { ChartData, CommodityPriceData, HistoryInterval, UcsData, FirestoreQuote, CommodityConfig } from './types';
import { getCommodities } from './commodity-config-service';
import { db } from './firebase-admin-config';
import admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { getFormulaParameters } from './formula-service';
import { calculateIndex } from './calculation-service';

// --- Funções para get data from FIRESTORE ---

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
 * Normalizes a ticker into a Firestore-safe collection name.
 * Example: 'BRL=X' becomes 'brl_x'
 * @param ticker The asset ticker.
 * @returns A normalized string for use as a collection name.
 */
const getCollectionNameFromTicker = (ticker: string): string => {
    return ticker.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Fetches the most recent asset data from Firestore for a specific date or the latest available.
 * @param ticker The asset's ticker (e.g., 'LBS=F').
 * @param limit The number of recent documents to fetch.
 * @returns A promise that resolves to an array of FirestoreQuote documents.
 */
export async function getAssetData(ticker: string, limit: number = 1): Promise<FirestoreQuote[]> {
    if (!ticker) {
        console.warn(`[DataService] Ticker is missing, cannot fetch asset data.`);
        return [];
    }
    const collectionName = getCollectionNameFromTicker(ticker);
    
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
        console.error(`[DataService] Error fetching data for ticker ${ticker} in collection ${collectionName}:`, error);
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
    try {
        const commodities = await getCommodities();
        if (!commodities || commodities.length === 0) {
            console.warn('[DataService] No commodities configured.');
            return [];
        }

        const pricePromises = commodities.map(async (commodity) => {
            // Use the commodity's ticker to fetch its history
            const assetHistory = await getAssetData(commodity.ticker, 2);

            let currentPrice = 0;
            let change = 0;
            let absoluteChange = 0;
            let lastUpdated = 'N/A';

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

            return {
                ...commodity,
                price: currentPrice,
                change,
                absoluteChange,
                lastUpdated,
            };
        });

        const result = await Promise.all(pricePromises);
        
        return result;

    } catch (error) {
        console.error(`[DataService] CRITICAL: Failed to get commodity prices. Error: ${error}`);
        return [];
    }
}


/**
 * Fetches historical quotes for a specific asset using its ticker.
 * @param ticker The asset's ticker.
 * @param limit The number of historical points to fetch.
 * @returns An array of FirestoreQuote objects.
 */
export async function getCotacoesHistorico(ticker: string, limit: number = 30, forDate?: string): Promise<FirestoreQuote[]> {
  if (!ticker) {
    console.warn(`[DataService] Ticker is missing, cannot fetch historical quotes.`);
    return [];
  }
  const collectionName = getCollectionNameFromTicker(ticker);

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
    console.error(`[DataService] Error fetching history for ticker ${ticker}:`, error);
    return [];
  }
}


/**
 * Fetches the latest calculated UCS Index value.
 * If no value is found in history, it attempts to calculate a new one.
 * @returns The latest UcsData object or a default if not found/configured.
 */
export async function getUcsIndexValue(): Promise<UcsData> {
  try {
    const collectionRef = db.collection('ucs_index_history');
    const query = collectionRef.orderBy('savedAt', 'desc').limit(1);
    const snapshot = await query.get();

    if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        return serializeFirestoreTimestamp(data) as UcsData;
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
    return result;
}

/**
 * Saves a batch of commodity price data to Firestore.
 * @param {Omit<FirestoreQuote, 'id' | 'created_at'>[]} quotes - An array of quote data objects.
 * @returns {Promise<void>}
 */
export async function saveLatestQuotes(quotes: (Omit<FirestoreQuote, 'id' | 'created_at'> & { ticker: string })[]): Promise<void> {
  if (!quotes || quotes.length === 0) {
    console.log('[DataService] No quote data provided to save.');
    return;
  }
  console.log(`[DataService] Starting batched write for ${quotes.length} quotes.`);
  const batch = db.batch();

  quotes.forEach((quote) => {
    const collectionName = getCollectionNameFromTicker(quote.ticker);
    if (!collectionName) {
        console.warn(`[DataService] Could not derive collection name for ticker: ${quote.ticker}`);
        return;
    }
    const docRef = db.collection(collectionName).doc(); // Auto-generate ID
    
    // Remove ticker from the data being saved to the document
    const { ticker, ...dataToSave } = quote;

    const finalData = {
        ...dataToSave,
        created_at: admin.firestore.FieldValue.serverTimestamp(), // Add server-side timestamp
    };

    batch.set(docRef, finalData);
  });

  try {
    await batch.commit();
    console.log('[DataService] Batched quote write completed successfully.');
  } catch (error) {
    console.error('[DataService] Batched quote write failed:', error);
    throw new Error('Failed to save latest quotes.');
  }
}
