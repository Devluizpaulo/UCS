
'use server';

import { db } from '@/lib/firebase-admin-config';
import { getCommodityConfigs } from '@/lib/commodity-config-service';
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getCache, setCache } from '@/lib/cache-service';
import { Timestamp } from 'firebase-admin/firestore';
import { subDays, format, parse, isValid } from 'date-fns';


const CACHE_KEY_PRICES = 'commodity_prices_simple';
const CACHE_TTL_SECONDS = 300; // 5 minutos

function serializeFirestoreTimestamp(data: any): any {
    if (data === null || typeof data !== 'object') {
        if (typeof data === 'string') {
            // Handle "YYYY/MM/DD HH:mm:ss..." format
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

// Retorna a cotação de um ativo para uma data específica
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


// Calcula o preço do CH²O com base nos seus componentes para uma data específica
async function calculateCh2oPriceForDate(date: Date): Promise<number> {
    const componentIds = ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'];
    
    const componentQuotes = await Promise.all(
        componentIds.map(id => getQuoteForDate(id, date))
    );

    const rentMedia = componentQuotes.reduce((acc, quote, index) => {
        acc[componentIds[index]] = quote?.rent_media ?? 0;
        return acc;
    }, {} as Record<string, number>);

    if (Object.values(rentMedia).every(val => val === 0)) return 0;

    const price = 
        (rentMedia['boi_gordo'] * 0.35) +
        (rentMedia['milho'] * 0.30) +
        (rentMedia['soja'] * 0.35) +
        (rentMedia['madeira']) +
        (rentMedia['carbono']);
        
    return price;
}

// Calcula o preço mais recente do CH²O com base nos seus componentes
async function calculateLatestCh2oPrice(): Promise<number> {
    const componentIds = ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'];
    
    const componentQuotes = await Promise.all(
        componentIds.map(id => getLatestQuote(id))
    );

    const rentMedia = componentQuotes.reduce((acc, quote, index) => {
        acc[componentIds[index]] = quote?.rent_media ?? 0;
        return acc;
    }, {} as Record<string, number>);

    if (Object.values(rentMedia).every(val => val === 0)) return 0;

    const price = 
        (rentMedia['boi_gordo'] * 0.35) +
        (rentMedia['milho'] * 0.30) +
        (rentMedia['soja'] * 0.35) +
        (rentMedia['madeira']) +
        (rentMedia['carbono']);
        
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
            let latestPrice: number;
            let previousPrice: number;

            if (config.id === 'agua') {
                const quoteToday = await getQuoteForDate(config.id, date);
                latestPrice = quoteToday?.ultimo ?? await calculateCh2oPriceForDate(date);
                
                const quoteYesterday = await getQuoteForDate(config.id, previousDate);
                previousPrice = quoteYesterday?.ultimo ?? await calculateCh2oPriceForDate(previousDate);
                
            } else {
                const [latestDoc, previousDoc] = await Promise.all([
                    getQuoteForDate(config.id, date),
                    getQuoteForDate(config.id, previousDate)
                ]);
                
                latestPrice = latestDoc?.ultimo ?? 0;
                previousPrice = previousDoc?.ultimo ?? latestPrice;
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
             if (config.id === 'agua') {
                const quoteToday = await getLatestQuote(config.id);
                const latestPrice = quoteToday?.ultimo ?? await calculateLatestCh2oPrice();

                // Para a variação, buscamos os últimos 2 docs salvos, se existirem
                const snapshot = await db.collection(config.id).orderBy('timestamp', 'desc').limit(2).get();
                let previousPrice = latestPrice;

                if (snapshot.docs.length > 1) {
                    previousPrice = snapshot.docs[1].data().ultimo ?? latestPrice;
                } else {
                    // Se não houver histórico salvo, calculamos para o dia anterior
                    previousPrice = await calculateCh2oPriceForDate(subDays(new Date(), 1));
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
