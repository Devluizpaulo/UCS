

'use server';

import type { ChartData, CommodityPriceData, HistoryInterval, UcsData, FirestoreQuote } from './types';
import { getCommodities } from './commodity-config-service';
import { ASSET_COLLECTION_MAP } from './marketdata-config';
import { db } from './firebase-admin-config';
import admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { getFormulaParameters } from './formula-service';
import { calculateIndex } from './calculation-service';
import { getCache, setCache } from './cache-service';


// --- Functions to get data from FIRESTORE ---
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
 * Busca dados de uma coleção específica por ativo
 */
export async function getAssetData(assetName: string, limit: number = 10, forDate?: string): Promise<FirestoreQuote[]> {
    const cacheKey = `assetData_${assetName}_${limit}_${forDate || 'latest'}`;
    const cachedData = getCache<FirestoreQuote[]>(cacheKey);
    if (cachedData) return cachedData;
    
    try {
        const collectionName = ASSET_COLLECTION_MAP[assetName];
        if (!collectionName) {
            console.warn(`[DataService] No collection mapping found for asset: ${assetName}`);
            return [];
        }

        const collectionRef = db.collection(collectionName);
        let query;

        if (forDate) {
            // Find data on or before the given date.
            const targetDateStart = new Date(forDate);
            targetDateStart.setUTCHours(0, 0, 0, 0);
            
            const targetDateEnd = new Date(forDate);
            targetDateEnd.setUTCHours(23, 59, 59, 999);

            query = collectionRef
                .where('timestamp', '>=', Timestamp.fromDate(targetDateStart))
                .where('timestamp', '<=', Timestamp.fromDate(targetDateEnd))
                .orderBy('timestamp', 'desc')
                .limit(limit);
        } else {
             query = collectionRef
                .orderBy('timestamp', 'desc')
                .limit(limit);
        }
            
        const querySnapshot = await query.get();
        let data: FirestoreQuote[] = [];

        // If no data for the specific date, try to get the most recent one before it.
        if (querySnapshot.empty && forDate) {
            const fallbackDate = new Date(forDate);
            fallbackDate.setUTCHours(23, 59, 59, 999);
             const fallbackQuery = collectionRef
                .where('timestamp', '<=', Timestamp.fromDate(fallbackDate))
                .orderBy('timestamp', 'desc')
                .limit(limit);
            const fallbackSnapshot = await fallbackQuery.get();
            fallbackSnapshot.forEach(doc => {
                 const docData = doc.data();
                data.push({ id: doc.id, ...serializeFirestoreTimestamp(docData) } as FirestoreQuote);
            });
        } else {
            querySnapshot.forEach(doc => {
                const docData = doc.data();
                data.push({ id: doc.id, ...serializeFirestoreTimestamp(docData) } as FirestoreQuote);
            });
        }
        
        setCache(cacheKey, data);
        return data;
    } catch (error) {
        console.error(`[DataService] Error fetching data for asset ${assetName}:`, error);
        return [];
    }
}

/**
 * Retrieves the prices for all configured commodities for a specific date.
 * If no date is provided, it gets the latest prices.
 */
export async function getCommodityPrices(forDate?: string): Promise<CommodityPriceData[]> {
    const cacheKey = `commodityPrices_${forDate || 'latest'}`;
    const cachedData = getCache<CommodityPriceData[]>(cacheKey);
    if (cachedData) return cachedData;
    
    try {
        const commodities = await getCommodities();

        if (!commodities || commodities.length === 0) {
            console.warn('[DataService] No commodities configured.');
            return [];
        }

        const pricePromises = commodities.map(async (commodity) => {
            const assetData = await getAssetData(commodity.name, 2, forDate);
            
            let currentPrice = 0;
            let change = 0;
            let absoluteChange = 0;
            let lastUpdated = forDate ? new Date(forDate).toLocaleDateString('pt-BR') : 'N/A';

            if (assetData.length > 0) {
                const latest = assetData[0];
                currentPrice = latest.ultimo || 0;
                
                const ts = latest.timestamp;
                 if (ts) {
                    lastUpdated = new Date(ts).toLocaleString('pt-BR');
                 }

                if (assetData.length > 1) {
                    const previous = assetData[1];
                    const previousPrice = previous.ultimo || 0;
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

        const result = (await Promise.all(pricePromises)).sort((a, b) => {
            if (a.category === 'exchange' && b.category !== 'exchange') return -1;
            if (a.category !== 'exchange' && b.category === 'exchange') return 1;
            return a.name.localeCompare(b.name);
        });
        
        setCache(cacheKey, result);
        return result;

    } catch (error) {
        console.error(`[DataService] CRITICAL: Failed to get commodity prices. Error: ${error}`);
        return [];
    }
}

export async function getCotacoesHistorico(ativo: string, limit: number = 30, forDate?: string): Promise<FirestoreQuote[]> {
    try {
        return await getAssetData(ativo, limit, forDate);
    } catch (error) {
        console.error(`Erro ao buscar histórico para ${ativo}:`, error);
        return [];
    }
}


/**
 * Fetches the latest calculated UCS Index value from the history collection.
 * This function ONLY reads data.
 * @param forDate - Optional date to fetch the index for.
 * @returns The latest UcsData object or a default if not found/configured.
 */
export async function getUcsIndexValue(forDate?: string): Promise<UcsData> {
  const cacheKey = `ucsIndexValue_${forDate || 'latest'}`;
  const cachedData = getCache<UcsData>(cacheKey);
  if (cachedData) return cachedData;
  
  try {
    let query: admin.firestore.Query;
    const collectionRef = db.collection('ucs_index_history');

    if (forDate) {
      const docId = new Date(forDate).toISOString().split('T')[0];
      const docSnap = await collectionRef.doc(docId).get();
      if (docSnap.exists) {
        const data = docSnap.data() as UcsData;
        setCache(cacheKey, data);
        return data;
      } else {
        query = collectionRef
            .where('savedAt', '<=', Timestamp.fromDate(new Date(forDate)))
            .orderBy('savedAt', 'desc')
            .limit(1);
      }
    } else {
      query = collectionRef.orderBy('savedAt', 'desc').limit(1);
    }
    
    const snapshot = await query.get();

    if (snapshot.empty) {
      console.warn('[DataService] No UCS index history found.');
      const params = await getFormulaParameters();
      const defaultData = {
        indexValue: 0,
        isConfigured: params.isConfigured,
        components: { vm: 0, vus: 0, crs: 0 },
        vusDetails: { pecuaria: 0, milho: 0, soja: 0 },
      };
      setCache(cacheKey, defaultData);
      return defaultData;
    }

    const data = snapshot.docs[0].data() as UcsData;
    setCache(cacheKey, data);
    return data;

  } catch (error) {
    console.error(`[DataService] Failed to get latest index value. Error: ${error}`);
    const params = await getFormulaParameters();
    return {
      indexValue: 0,
      isConfigured: params.isConfigured,
      components: { vm: 0, vus: 0, crs: 0 },
      vusDetails: { pecuaria: 0, milho: 0, soja: 0 },
    };
  }
}


/**
 * Fetches the historical data for the UCS Index chart.
 * This function ONLY reads data.
 * @param interval The time interval for the history.
 * @returns An array of ChartData points.
 */
export async function getUcsIndexHistory(interval: HistoryInterval = '1d'): Promise<ChartData[]> {
    const cacheKey = `ucsIndexHistory_${interval}`;
    const cachedData = getCache<ChartData[]>(cacheKey);
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
                const date = timestamp?.toDate ? timestamp.toDate() : (timestamp ? new Date(timestamp) : new Date());
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
    setCache(cacheKey, result);
    return result;
}

/**
 * Saves a batch of commodity price data to Firestore. This is meant to be called by a trusted
 * server-side process (like a Genkit flow or a dedicated API route) to populate the daily quotes.
 *
 * @param {Omit<FirestoreQuote, 'id' | 'timestamp'>[]} quotes - An array of quote data objects.
 * @returns {Promise<void>}
 */
export async function saveLatestQuotes(quotes: Omit<FirestoreQuote, 'id' | 'timestamp'>[]): Promise<void> {
  if (!quotes || quotes.length === 0) {
    console.log('[DataService] No quote data provided to save.');
    return;
  }
  console.log(`[DataService] Starting batched write for ${quotes.length} quotes.`);
  const batch = db.batch();
  const collectionRef = db.collection('cotacoes_do_dia');

  quotes.forEach((quote) => {
    const docRef = collectionRef.doc(); // Auto-generate ID
    
    const dataToSave = {
        ...quote,
        timestamp: admin.firestore.FieldValue.serverTimestamp(), // Add server-side timestamp
    };

    batch.set(docRef, dataToSave);
  });

  try {
    await batch.commit();
    console.log('[DataService] Batched quote write completed successfully.');
  } catch (error) {
    console.error('[DataService] Batched quote write failed:', error);
    throw new Error('Failed to save latest quotes.');
  }
}
