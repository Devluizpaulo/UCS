
'use server';

import { db } from '@/lib/firebase-admin-config';
import { getCommodityConfigs } from '@/lib/commodity-config-service';
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getCache, setCache } from '@/lib/cache-service';
import { Timestamp } from 'firebase-admin/firestore';
import { subDays, format, parse, isValid } from 'date-fns';

const CACHE_KEY_PRICES = 'commodity_prices_simple';
const CACHE_TTL_SECONDS = 300; // 5 minutos

const CH2O_COMPONENTS = ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'];

function serializeFirestoreTimestamp(data: any): any {
    if (data === null || typeof data !== 'object') {
        if (typeof data === 'string') {
            const parsedDate = parse(data, 'yyyy/MM/dd HH:mm:ss.SSSSSSxxx', new Date());
            if (isValid(parsedDate)) {
                return parsedDate.getTime();
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

// Retorna a cotação completa de um ativo para uma data específica
async function getQuoteForDate(assetId: string, date: Date): Promise<FirestoreQuote | null> {
    const formattedDate = format(date, 'dd/MM/yyyy');

    const snapshot = await db.collection(assetId)
        .where('data', '==', formattedDate)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return { id: doc.id, ...data } as FirestoreQuote;
}


// Retorna a cotação mais recente de um ativo
async function getLatestQuote(assetId: string): Promise<FirestoreQuote | null> {
    const snapshot = await db.collection(assetId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return { id: doc.id, ...data } as FirestoreQuote;
}

async function calculateCh2oPrice(quoteFetcher: (assetId: string) => Promise<FirestoreQuote | null>): Promise<number> {
    const componentQuotes = await Promise.all(
        CH2O_COMPONENTS.map(id => quoteFetcher(id))
    );
    
    const prices: Record<string, number> = {};
    componentQuotes.forEach((quote, index) => {
        prices[CH2O_COMPONENTS[index]] = quote?.ultimo ?? 0;
    });

    if (Object.values(prices).every(val => val === 0)) return 0;
    
    const price = 
        (prices['boi_gordo'] * 0.35) +
        (prices['milho'] * 0.30) +
        (prices['soja'] * 0.35) +
        (prices['madeira']) +
        (prices['carbono']);
        
    return price;
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
                const quoteFetcherForDate = (assetId: string) => getQuoteForDate(assetId, date);
                const quoteFetcherForPrevDate = (assetId: string) => getQuoteForDate(assetId, previousDate);

                // Tenta buscar o valor salvo primeiro
                let latestPrice = (await getQuoteForDate(config.id, date))?.ultimo;
                if (latestPrice === undefined) {
                    latestPrice = await calculateCh2oPrice(quoteFetcherForDate);
                }

                let previousPrice = (await getQuoteForDate(config.id, previousDate))?.ultimo;
                 if (previousPrice === undefined) {
                    previousPrice = await calculateCh2oPrice(quoteFetcherForPrevDate);
                }

                const absoluteChange = latestPrice - previousPrice;
                const change = (previousPrice !== 0) ? (absoluteChange / previousPrice) * 100 : 0;
                
                return { 
                    ...config, 
                    price: latestPrice, 
                    change, 
                    absoluteChange, 
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
             if (config.isCalculated && config.id === 'agua') {
                const quoteFetcherForLatest = (assetId: string) => getLatestQuote(assetId);

                // Tenta buscar o valor salvo mais recente
                let latestPrice = (await getLatestQuote(config.id))?.ultimo;
                if (latestPrice === undefined) {
                    latestPrice = await calculateCh2oPrice(quoteFetcherForLatest);
                }

                // Para a variação, buscamos o valor calculado para o dia anterior
                const previousDate = subDays(new Date(), 1);
                const quoteFetcherForPrevDate = (assetId: string) => getQuoteForDate(assetId, previousDate);
                let previousPrice = (await getQuoteForDate(config.id, previousDate))?.ultimo;
                if (previousPrice === undefined) {
                    previousPrice = await calculateCh2oPrice(quoteFetcherForPrevDate);
                }

                const absoluteChange = latestPrice - previousPrice;
                const change = (previousPrice !== 0) ? (absoluteChange / previousPrice) * 100 : 0;

                return { 
                    ...config, 
                    price: latestPrice, 
                    change, 
                    absoluteChange, 
                    lastUpdated: 'Tempo Real'
                };
            }


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
                lastUpdated: "Tempo Real"
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
        // Sanitize variacao_pct
        if (docData.variacao_pct === 'null' || docData.variacao_pct === null) {
            docData.variacao_pct = null;
        } else if (typeof docData.variacao_pct === 'string') {
            const parsed = parseFloat(docData.variacao_pct);
            docData.variacao_pct = isNaN(parsed) ? null : parsed;
        }

        return {
            id: doc.id,
            ...serializeFirestoreTimestamp(docData),
        } as FirestoreQuote;
    });

    return data;

  } catch (error) {
    console.error(`Error fetching historical data for ${assetId}:`, error);
    return [];
  }
}

    