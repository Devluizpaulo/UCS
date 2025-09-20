
'use server';

import { db } from '@/lib/firebase-admin-config';
import { getCommodityConfigs } from '@/lib/commodity-config-service';
import type { CommodityPriceData, FirestoreQuote, CommodityConfig } from '@/lib/types';
import { getCache, setCache } from '@/lib/cache-service';

const CACHE_KEY_PRICES = 'commodity_prices';
const CACHE_TTL_SECONDS = 60 * 5; // 5 minutos

function serializeFirestoreTimestamp(data: any): any {
    if (data === null || typeof data !== 'object') {
        return data;
    }

    if (data instanceof Date) {
        return data.toISOString();
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


export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const cachedData = getCache<CommodityPriceData[]>(CACHE_KEY_PRICES);
    if (cachedData) {
        return cachedData;
    }

    try {
        const configs = await getCommodityConfigs();
        
        const pricePromises = configs.map(async (config) => {
            const collectionRef = db.collection(config.id);
            const snapshot = await collectionRef
                .orderBy('timestamp', 'desc')
                .limit(2)
                .get();

            if (snapshot.empty) {
                return {
                    ...config,
                    price: 0,
                    change: 0,
                    absoluteChange: 0,
                    lastUpdated: 'N/A',
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
                change: change,
                absoluteChange: absoluteChange,
                lastUpdated: latestDoc.data || new Date(serializeFirestoreTimestamp(latestDoc.timestamp)).toLocaleDateString('pt-BR'),
            };
        });

        const results = await Promise.all(pricePromises);
        
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
