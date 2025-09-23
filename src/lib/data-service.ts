

'use server';

import { db } from '@/lib/firebase-admin-config';
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getCache, setCache } from '@/lib/cache-service';
import { Timestamp } from 'firebase-admin/firestore';
import { subDays, format, parse, isValid, startOfDay, parseISO } from 'date-fns';
import { COMMODITIES_CONFIG } from './commodity-config-service';

const CACHE_KEY_PRICES = 'commodity_prices_simple';
const CACHE_TTL_SECONDS = 300; // 5 minutos


function serializeFirestoreTimestamp(data: any): any {
    if (data === null || typeof data !== 'object') {
        if (typeof data === 'string') {
            const formats = [
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                "yyyy-MM-dd HH:mm:ssXXX",
                'yyyy/MM/dd HH:mm:ss.SSSSSSxxx',
                'yyyy-MM-dd',
                "dd/MM/yyyy",
            ];
            let parsedDate = parseISO(data); // Padrão ISO 8601
            if (isValid(parsedDate)) return parsedDate.getTime();
            
            for (const fmt of formats) {
                parsedDate = parse(data, fmt, new Date());
                if (isValid(parsedDate)) return parsedDate.getTime();
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
    
    // 1. Try fetching by the 'data' string field first. This is more reliable.
    const stringDateSnapshot = await db.collection(assetId)
        .where('data', '==', formattedDate)
        .limit(1)
        .get();

    if (!stringDateSnapshot.empty) {
        const doc = stringDateSnapshot.docs[0];
        const data = doc.data();
        return { id: doc.id, ...data } as FirestoreQuote;
    }

    // 2. If it fails, fallback to timestamp range query.
    const startDate = startOfDay(date);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);

    const timestampSnapshot = await db.collection(assetId)
        .where('timestamp', '>=', Timestamp.fromDate(startDate))
        .where('timestamp', '<=', Timestamp.fromDate(endDate))
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

    if (timestampSnapshot.empty) {
        return null;
    }
    
    const doc = timestampSnapshot.docs[0];
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
                price: cleanAndParseNumber(latestPrice), 
                change, 
                absoluteChange, 
                lastUpdated: displayDate
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
                price: cleanAndParseNumber(latestPrice), 
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

// Helper to clean and parse number values that might come as formatted strings
function cleanAndParseNumber(value: any): number {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        const cleanedString = value.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleanedString);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
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

        return {
            id: doc.id,
            data: docData.data, // Preserve the original 'data' field
            timestamp: serializeFirestoreTimestamp(docData.timestamp),
            ultimo: cleanAndParseNumber(docData.ultimo),
            variacao_pct: cleanAndParseNumber(docData.variacao_pct),
            boi_gordo: cleanAndParseNumber(docData.boi_gordo),
            milho: cleanAndParseNumber(docData.milho),
            soja: cleanAndParseNumber(docData.soja),
            madeira: cleanAndParseNumber(docData.madeira),
            carbono: cleanAndParseNumber(docData.carbono),
        } as FirestoreQuote;
    });

    return data;

  } catch (error) {
    console.error(`Error fetching historical data for ${assetId}:`, error);
    return [];
  }
}

export async function getCh2oCompositionHistory(limit = 90): Promise<FirestoreQuote[]> {
    try {
        const ch2oHistory = await getCotacoesHistorico('agua');
        return ch2oHistory;
    } catch (error) {
        console.error(`Error fetching CH2O composition history:`, error);
        return [];
    }
}

    
