
'use server';

import { db } from '@/lib/firebase-admin-config';
import type { CommodityPriceData, FirestoreQuote, Ch2oCompositionData } from '@/lib/types';
import { getCache, setCache } from '@/lib/cache-service';
import { Timestamp } from 'firebase-admin/firestore';
import { subDays, format, parse, isValid, startOfDay, parseISO } from 'date-fns';
import { COMMODITIES_CONFIG } from './commodity-config-service';

const CACHE_KEY_PRICES = 'commodity_prices_simple';
const CACHE_TTL_SECONDS = 300; // 5 minutos


function serializeFirestoreTimestamp(data: any): any {
    if (data === null || typeof data !== 'object') {
        if (typeof data === 'string') {
            const parsedDate = parse(data, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", new Date());
             if (isValid(parsedDate)) {
                return parsedDate.getTime();
            }
            const parsedDate2 = parse(data, 'yyyy/MM/dd HH:mm:ss.SSSSSSxxx', new Date());
            if (isValid(parsedDate2)) {
                return parsedDate2.getTime();
            }
             const isoDate = parseISO(data);
            if (isValid(isoDate)) {
                return isoDate.getTime();
            }
        }
        return data;
    }

    if (data instanceof Timestamp) {
        return data.toMillis();
    }
    
    if (data instanceof Date) {
        return data.getTime();
    }

    if ('toDate' in data && typeof data.toDate === 'function') {
        return data.toDate().getTime();
    }

    if (Array.isArray(data)) {
        return data.map(serializeFirestoreTimestamp);
    }

    const serializedData: { [key: string]: any } = {};
    for (const key in data) {
        serializedData[key] = serializeFirestoreTimestamp(data[key]);
    }
    return serializedData;
}

export async function getQuoteForDate(assetId: string, date: Date): Promise<FirestoreQuote | null> {
    const formattedDate = format(date, 'dd/MM/yyyy');
    
    // Normalize date to start of day for query consistency
    const startDate = startOfDay(date);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000 -1);

    const snapshot = await db.collection(assetId)
        .where('timestamp', '>=', Timestamp.fromDate(startDate))
        .where('timestamp', '<=', Timestamp.fromDate(endDate))
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

    if (snapshot.empty) {
        // Fallback to string-based date for older data
         const fallbackSnapshot = await db.collection(assetId)
            .where('data', '==', formattedDate)
            .limit(1)
            .get();
        if (fallbackSnapshot.empty) return null;

        const doc = fallbackSnapshot.docs[0];
        const data = doc.data();
        return { id: doc.id, ...data } as FirestoreQuote;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return { id: doc.id, ...data } as FirestoreQuote;
}


export async function saveQuote(assetId: string, quoteData: Omit<FirestoreQuote, 'id'>): Promise<void> {
    try {
        const docId = format(new Date(quoteData.timestamp), 'yyyy-MM-dd');
        const docRef = db.collection(assetId).doc(docId);
        await docRef.set({
            ...quoteData,
            timestamp: Timestamp.fromMillis(quoteData.timestamp)
        }, { merge: true });
        console.log(`[data-service] Saved quote for ${assetId} on date ${quoteData.data}`);
    } catch (error) {
        console.error(`[data-service] Error saving quote for ${assetId}:`, error);
        throw error;
    }
}


export async function getLatestQuote(assetId: string): Promise<FirestoreQuote | null> {
    const snapshot = await db.collection(assetId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return { id: doc.id, ...data } as FirestoreQuote;
}


async function getCh2oData(date?: Date): Promise<Pick<CommodityPriceData, 'price' | 'change' | 'absoluteChange'>> {
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` 
    : 'http://localhost:9002';

  const dateParam = date ? `?date=${format(date, 'yyyy-MM-dd')}` : '';
  const url = `${baseUrl}/api/calculate/ch2o${dateParam}`;
  
  try {
    const response = await fetch(url, { next: { revalidate: 60 } }); // Revalidate every 60s
    if (!response.ok) {
        console.error(`[data-service] Failed to fetch CH2O data from API. Status: ${response.status}. URL: ${url}`);
        return { price: 0, change: 0, absoluteChange: 0 };
    }
    const data = await response.json();
    return {
        price: data.price ?? 0,
        change: data.change ?? 0,
        absoluteChange: data.absoluteChange ?? 0,
    };
  } catch (error) {
    console.error(`[data-service] Error calling CH2O API. URL: ${url}`, error);
    return { price: 0, change: 0, absoluteChange: 0 };
  }
}

export async function getCommodityConfigs(): Promise<CommodityPriceData[]> {
    return Object.entries(COMMODITIES_CONFIG).map(([id, config]) => ({
        id,
        ...config,
        price: 0,
        change: 0,
        absoluteChange: 0,
        lastUpdated: ''
    }));
}


export async function getCommodityPricesByDate(date: Date): Promise<CommodityPriceData[]> {
    const cacheKey = `commodity_prices_${date.toISOString().split('T')[0]}`;
    const cachedData = getCache<CommodityPriceData[]>(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    const previousDate = subDays(date, 1);
    const displayDate = format(date, 'dd/MM/yyyy');

    try {
        const configs = await getCommodityConfigs();
        
        const assetPromises = configs.map(async (config) => {
            if (config.isCalculated && config.id === 'agua') {
                const ch2oData = await getCh2oData(date);
                return { 
                    ...config, 
                    ...ch2oData,
                    lastUpdated: displayDate
                };

            } else {
                const [latestDoc, previousDoc] = await Promise.all([
                    getQuoteForDate(config.id, date),
                    getQuoteForDate(config.id, previousDate)
                ]);
                
                const latestPrice = latestDoc?.ultimo ?? 0;
                const previousPrice = previousDoc?.ultimo ?? latestPrice;
            
                const absoluteChange = latestPrice - previousPrice;
                const change = (previousPrice !== 0) ? (absoluteChange / previousPrice) * 100 : 0;
                
                return { 
                    ...config, 
                    price: latestPrice, 
                    change, 
                    absoluteChange, 
                    lastUpdated: displayDate
                };
            }
        });

        const results = await Promise.all(assetPromises);

        setCache(cacheKey, results, CACHE_TTL_SECONDS * 12 * 24); // Cache histórico por 1 dia
        return results;

    } catch (error) {
        console.error("Error fetching commodity prices by date:", error);
        return [];
    }
}


export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const cachedData = getCache<CommodityPriceData[]>(CACHE_KEY_PRICES);
    if (cachedData) {
        return cachedData;
    }

    try {
        const configs = await getCommodityConfigs();
        
        const assetPromises = configs.map(async (config) => {
             if (config.isCalculated && config.id === 'agua') {
                const ch2oData = await getCh2oData();
                return { 
                    ...config, 
                    ...ch2oData,
                    lastUpdated: 'Tempo Real'
                };
            }

            const snapshot = await db.collection(config.id).orderBy('timestamp', 'desc').limit(2).get();

            if (snapshot.empty) {
                return { ...config, price: 0, change: 0, absoluteChange: 0, lastUpdated: 'N/A' };
            }

            const latestDocData = snapshot.docs[0].data();
            const previousDocData = snapshot.docs.length > 1 ? snapshot.docs[1].data() : null;

            const latestPrice = latestDocData.ultimo ?? 0;
            const previousPrice = previousDocData ? (previousDocData.ultimo ?? latestPrice) : latestPrice;

            const absoluteChange = latestPrice - previousPrice;
            const change = (previousPrice !== 0) ? (absoluteChange / previousPrice) * 100 : 0;
            const lastUpdatedTimestamp = latestDocData.timestamp;
            
            return { 
                ...config, 
                price: latestPrice, 
                change, 
                absoluteChange, 
                lastUpdated: lastUpdatedTimestamp ? format(serializeFirestoreTimestamp(lastUpdatedTimestamp), "HH:mm:ss") : 'Tempo Real'
            };
        });

        const results = await Promise.all(assetPromises);

        setCache(CACHE_KEY_PRICES, results, CACHE_TTL_SECONDS);
        return results;

    } catch (error) {
        console.error("Error fetching commodity prices:", error);
        return [];
    }
}

export async function getCotacoesHistorico(assetId: string): Promise<FirestoreQuote[]> {
  try {
    const snapshot = await db.collection(assetId)
      .orderBy('timestamp', 'desc')
      .limit(90)
      .get();

    if (snapshot.empty) {
      return [];
    }
    
    const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        
        const variacaoPctRaw = docData.variacao_pct;
        let variacaoPctProcessed = null;
        if (variacaoPctRaw !== null && variacaoPctRaw !== undefined && variacaoPctRaw !== 'null') {
            const parsed = parseFloat(String(variacaoPctRaw).replace(',', '.'));
            if (!isNaN(parsed)) {
                variacaoPctProcessed = parsed;
            }
        }
        
        return {
            ...serializeFirestoreTimestamp(docData),
            id: doc.id,
            variacao_pct: variacaoPctProcessed,
        } as FirestoreQuote;
    });

    return data;

  } catch (error) {
    console.error(`Error fetching historical data for ${assetId}:`, error);
    return [];
  }
}

export async function getCh2oCompositionHistory(limit = 90): Promise<Ch2oCompositionData[]> {
    try {
        const ch2oHistory = await getCotacoesHistorico('agua');
        if (ch2oHistory.length === 0) return [];

        const compositionHistory = ch2oHistory.map((ch2oQuote) => {
            return {
                date: ch2oQuote.data,
                timestamp: ch2oQuote.timestamp,
                total: ch2oQuote.ultimo,
                components: {
                    boi_gordo: ch2oQuote.boi_gordo ?? 0,
                    milho: ch2oQuote.milho ?? 0,
                    soja: ch2oQuote.soja ?? 0,
                    madeira: ch2oQuote.madeira ?? 0,
                    carbono: ch2oQuote.carbono ?? 0,
                }
            };
        });
        
        return compositionHistory;

    } catch (error) {
        console.error(`Error fetching CH2O composition history:`, error);
        return [];
    }
}
