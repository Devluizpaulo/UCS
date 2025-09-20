'use server';

import { db } from '@/lib/firebase-admin-config';
import { getCommodityConfigs } from '@/lib/commodity-config-service';
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getCache, setCache } from '@/lib/cache-service';
import { calculateCh2oAgua, calculateCustoAgua, calculatePdm } from './calculation-service';
import { Timestamp } from 'firebase-admin/firestore';

const CACHE_KEY_PRICES = 'commodity_prices';
const CACHE_TTL_SECONDS = 21600; // 6 horas

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


async function getLatestQuote(assetId: string): Promise<FirestoreQuote | null> {
    const snapshot = await db.collection(assetId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }
    return snapshot.docs[0].data() as FirestoreQuote;
}


export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const cachedData = getCache<CommodityPriceData[]>(CACHE_KEY_PRICES);
    if (cachedData) {
        return cachedData;
    }

    try {
        const configs = await getCommodityConfigs();
        const assetDataMap = new Map<string, CommodityPriceData>();
        let ch2oAguaValue = 0;
        let custoAguaValue = 0;

        // First pass: get all non-calculated assets
        const pricePromises = configs
            .filter(config => !config.isCalculated)
            .map(async (config) => {
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
                
                const data: CommodityPriceData = {
                    ...config,
                    price: latestPrice,
                    change: change,
                    absoluteChange: absoluteChange,
                    lastUpdated: latestDoc.data || new Date(serializeFirestoreTimestamp(latestDoc.timestamp)).toLocaleDateString('pt-BR'),
                };
                assetDataMap.set(config.id, data);
                return data;
            });

        await Promise.all(pricePromises);

        // Second pass: process calculated assets
        const calculatedAssetConfigs = configs.filter(config => config.isCalculated);
        for (const config of calculatedAssetConfigs) {
            let calculatedPrice = 0;
            let docToSave: any = {};
            const now = Timestamp.now();
            const today = now.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

            if (config.id === 'agua') {
                const rentMediaIds = ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'];
                const rentMediaQuotes = await Promise.all(rentMediaIds.map(id => getLatestQuote(id)));

                const rentMediaValues = {
                    boi_gordo: rentMediaQuotes[0]?.rent_media ?? 0,
                    milho: rentMediaQuotes[1]?.rent_media ?? 0,
                    soja: rentMediaQuotes[2]?.rent_media ?? 0,
                    madeira: rentMediaQuotes[3]?.rent_media ?? 0,
                    carbono: rentMediaQuotes[4]?.rent_media ?? 0,
                };
                
                calculatedPrice = calculateCh2oAgua(rentMediaValues);
                ch2oAguaValue = calculatedPrice;
                docToSave.rent_media_components = rentMediaValues;

            } else if (config.id === 'custo_agua') {
                calculatedPrice = calculateCustoAgua(ch2oAguaValue);
                custoAguaValue = calculatedPrice;
                docToSave.base_ch2o_agua = ch2oAguaValue;

            } else if (config.id === 'pdm') {
                calculatedPrice = calculatePdm(ch2oAguaValue, custoAguaValue);
                docToSave.base_ch2o_agua = ch2oAguaValue;
                docToSave.base_custo_agua = custoAguaValue;
            }

            // Save the new calculated value to its collection, if it's a valid number
            if (typeof calculatedPrice === 'number' && isFinite(calculatedPrice)) {
                 Object.assign(docToSave, {
                    ultimo: calculatedPrice,
                    timestamp: now,
                    data: today,
                    variacao_pct: 0, // Simplified for now
                });
                await db.collection(config.id).add(docToSave);
            }
            
            // For immediate display, we calculate change based on the last stored value
            const snapshot = await db.collection(config.id)
                .orderBy('timestamp', 'desc')
                .limit(2)
                .get();
            
            const previousPrice = snapshot.docs.length > 1 ? (snapshot.docs[1].data() as FirestoreQuote).ultimo : calculatedPrice;
            const absoluteChange = calculatedPrice - previousPrice;
            const change = previousPrice !== 0 ? (absoluteChange / previousPrice) * 100 : 0;

            const data: CommodityPriceData = {
                ...config,
                price: calculatedPrice,
                change,
                absoluteChange,
                lastUpdated: today,
            };
            assetDataMap.set(config.id, data);
        }
        
        // Ensure original order is maintained
        const results = configs.map(config => assetDataMap.get(config.id)).filter(Boolean) as CommodityPriceData[];

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
