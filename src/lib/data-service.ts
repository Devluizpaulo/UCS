

'use server';

import { db } from '@/lib/firebase-admin-config';
import { getCommodityConfigs } from '@/lib/commodity-config-service';
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getCache, setCache } from '@/lib/cache-service';
import { Timestamp } from 'firebase-admin/firestore';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';


const CACHE_KEY_PRICES = 'commodity_prices_simple';
const CACHE_TTL_SECONDS = 300; // 5 minutos

function serializeFirestoreTimestamp(data: any): any {
    if (data === null || typeof data !== 'object') {
        return data;
    }

    if (data instanceof Date) {
        return data.toISOString();
    }
    
    if (data instanceof Timestamp) {
        return data.toDate().toISOString();
    }

    if ('toDate' in data && typeof data.toDate === 'function') {
        return data.toDate().toISOString();
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

async function getQuoteForDate(assetId: string, date: Date): Promise<FirestoreQuote | null> {
    const start = Timestamp.fromDate(startOfDay(date));
    const end = Timestamp.fromDate(endOfDay(date));

    const snapshot = await db.collection(assetId)
        .where('timestamp', '>=', start)
        .where('timestamp', '<=', end)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as FirestoreQuote;
}


export async function getCommodityPricesByDate(date: Date): Promise<CommodityPriceData[]> {
    const cacheKey = `commodity_prices_${date.toISOString().split('T')[0]}`;
    const cachedData = getCache<CommodityPriceData[]>(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    const previousDate = subDays(date, 1);
    const formattedDate = format(date, 'dd/MM/yyyy');

    try {
        const configs = await getCommodityConfigs();
        
        const assetPromises = configs.map(async (config) => {
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
                lastUpdated: formattedDate // Logic change: Always show the date being queried.
            };
        });

        const results = await Promise.all(assetPromises);

        setCache(cacheKey, results, CACHE_TTL_SECONDS * 12 * 24); // Cache histórico por 1 dia
        return results;

    } catch (error) {
        console.error("Error fetching commodity prices by date:", error);
        return [];
    }
}


export async function getLatestQuoteWithComponents(assetId: string): Promise<FirestoreQuote | null> {
    const snapshot = await db.collection(assetId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }
    const data = snapshot.docs[0].data();
    return serializeFirestoreTimestamp({ ...data, id: snapshot.docs[0].id }) as FirestoreQuote;
}


export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const cachedData = getCache<CommodityPriceData[]>(CACHE_KEY_PRICES);
    if (cachedData) {
        return cachedData;
    }

    try {
        const configs = await getCommodityConfigs();
        
        const assetPromises = configs.map(async (config) => {
            const snapshot = await db.collection(config.id).orderBy('timestamp', 'desc').limit(2).get();

            if (snapshot.empty) {
                return { 
                    ...config, 
                    price: 0, 
                    change: 0, 
                    absoluteChange: 0, 
                    lastUpdated: 'N/A' 
                };
            }

            const latestDoc = snapshot.docs[0].data() as FirestoreQuote;
            const previousDoc = snapshot.docs.length > 1 ? snapshot.docs[1].data() as FirestoreQuote : null;
            
            const latestPrice = latestDoc.ultimo || 0;
            const previousPrice = previousDoc ? (previousDoc.ultimo || 0) : latestPrice;

            const absoluteChange = latestPrice - previousPrice;
            const change = (previousPrice !== 0) ? (absoluteChange / previousPrice) * 100 : 0;
            
            return { 
                ...config, 
                price: latestPrice, 
                change, 
                absoluteChange, 
                lastUpdated: "Tempo Real" // Logic change: Always show "real time" for the latest prices.
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
    
    const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...serializeFirestoreTimestamp(doc.data()),
    })) as FirestoreQuote[];

    return data;

  } catch (error) {
    console.error(`Error fetching historical data for ${assetId}:`, error);
    return [];
  }
}
