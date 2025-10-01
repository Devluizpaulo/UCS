

'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin-config';
import type { CommodityConfig, CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getCache, setCache, clearCache as clearMemoryCache } from '@/lib/cache-service';
import { Timestamp } from 'firebase-admin/firestore';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';

// --- CONSTANTS ---
const CACHE_KEY_PRICES = 'commodity_prices_simple';
const CACHE_TTL_SECONDS = 30; // Cache de 30 segundos para dados "tempo real"
const SETTINGS_COLLECTION = 'settings';
const COMMODITIES_DOC = 'commodities';
const COMMODITIES_CONFIG_CACHE_KEY = 'commodities_config';

// --- HELPER FUNCTIONS ---

function serializeFirestoreTimestamp(data: any): any {
    if (data === null || typeof data !== 'object') {
        return data;
    }
    if (data instanceof Timestamp) {
        return data.toMillis();
    }
    if (data instanceof Date) {
        return data.getTime();
    }
    if (data && typeof data.toDate === 'function') {
        return data.toDate().getTime();
    }
    if (Array.isArray(data)) {
        return data.map(serializeFirestoreTimestamp);
    }
    const serializedData: { [key: string]: any } = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            serializedData[key] = serializeFirestoreTimestamp(data[key]);
        }
    }
    return serializedData;
}

function getPriceFromQuote(quoteData: any): number {
    if (quoteData) {
        if (typeof quoteData.ultimo === 'number') return quoteData.ultimo;
        if (typeof quoteData.valor === 'number') return quoteData.valor;
    }
    return 0;
}

// --- CONFIGURATION MANAGEMENT (CRUD Ativos) ---

const initialCommoditiesConfig: Record<string, Omit<CommodityConfig, 'id'>> = {
    // Commodities Base
    'milho': { name: 'Milho', currency: 'BRL', category: 'agricultural', description: 'Milho Futuros (convertido para BRL)', unit: 'BRL por saca' },
    'soja': { name: 'Soja', currency: 'BRL', category: 'agricultural', description: 'Soja Futuros (convertido para BRL)', unit: 'BRL por saca' },
    'boi_gordo': { name: 'Boi Gordo', currency: 'BRL', category: 'agricultural', description: 'Preço da arroba (15kg) de Boi Gordo.', unit: 'BRL por @' },
    'madeira': { name: 'Madeira', currency: 'BRL', category: 'material', description: 'Madeira Serrada (convertido para BRL)', unit: 'BRL por m³' },
    'carbono': { name: 'Carbono', currency: 'BRL', category: 'material', description: 'Crédito de Carbono (convertido para BRL)', unit: 'BRL por Tonelada' },
    'usd': { name: 'Dólar Americano', currency: 'BRL', category: 'exchange', description: 'Cotação do Dólar Americano (USD) em Reais (BRL).', unit: 'BRL por USD' },
    'eur': { name: 'Euro', currency: 'BRL', category: 'exchange', description: 'Cotação do Euro (EUR) em Reais (BRL).', unit: 'BRL por EUR' },
    
    // Indices Calculados
    'ch2o_agua': { name: 'CH2O Água', currency: 'BRL', category: 'sub-index', description: 'Índice de uso da água.', unit: 'Pontos' },
    'custo_agua': { name: 'Custo Água', currency: 'BRL', category: 'sub-index', description: 'Custo do uso da água (7% de CH2O).', unit: 'BRL' },
    'pdm': { name: 'PDM', currency: 'BRL', category: 'sub-index', description: 'Produto Desenvolvido Mundial.', unit: 'Pontos' },
    'ucs': { name: 'UCS', currency: 'BRL', category: 'sub-index', description: 'Universal Carbon Sustainability.', unit: 'Pontos' },
    'vus': { name: 'VUS', currency: 'BRL', category: 'vus', description: 'Valor Universal Sustentável (commodities agrícolas).', unit: 'Pontos' },
    'vmad': { name: 'VMAD', currency: 'BRL', category: 'vmad', description: 'Valor da Madeira.', unit: 'Pontos' },
    'carbono_crs': { name: 'Carbono CRS', currency: 'BRL', category: 'crs', description: 'Valor do Carbono.', unit: 'Pontos' },
    'agua_crs': { name: 'Água CRS', currency: 'BRL', category: 'crs', description: 'Valor da Água.', unit: 'Pontos' },
    'valor_uso_solo': { name: 'Valor Uso Solo', currency: 'BRL', category: 'sub-index', description: 'Valor total do uso do solo.', unit: 'Pontos' },
    
    // Indice Principal
    'ucs_ase': { name: 'Índice UCS ASE', currency: 'BRL', category: 'index', description: 'Índice principal de sustentabilidade (amplificado).', unit: 'Pontos' },
};


export async function saveCommodityConfig(id: string, config: Omit<CommodityConfig, 'id'>): Promise<void> {
    const { db } = await getFirebaseAdmin();
    const settingsDocRef = db.collection(SETTINGS_COLLECTION).doc(COMMODITIES_DOC);
    
    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(settingsDocRef);
        if (!doc.exists) {
            const initialData = { ...initialCommoditiesConfig, [id]: config };
            transaction.set(settingsDocRef, initialData);
        } else {
            transaction.update(settingsDocRef, { [id]: config });
        }
    });

    setCache(COMMODITIES_CONFIG_CACHE_KEY, null, 0);
}

export async function getCommodityConfigs(): Promise<CommodityConfig[]> {
    const cachedConfigs = getCache<CommodityConfig[]>(COMMODITIES_CONFIG_CACHE_KEY);
    if (cachedConfigs) {
        return cachedConfigs;
    }
    
    const { db } = await getFirebaseAdmin();
    const docRef = db.collection(SETTINGS_COLLECTION).doc(COMMODITIES_DOC);
    const doc = await docRef.get();

    let configData: Record<string, Omit<CommodityConfig, 'id'>> | undefined = doc.data() as any;

    if (!doc.exists || !configData) {
        console.log("Nenhuma configuração de commodity encontrada, usando configuração inicial e (re)criando documento se necessário.");
        configData = initialCommoditiesConfig;
        if (!doc.exists) {
            try {
                await docRef.set(configData);
            } catch (error) {
                console.error("Falha ao criar o documento de configuração inicial:", error);
            }
        }
    }
    
    const configsArray = Object.entries(configData).map(([id, config]) => ({
        id,
        ...config,
    }));

    setCache(COMMODITIES_CONFIG_CACHE_KEY, configsArray, CACHE_TTL_SECONDS * 10);
    return configsArray;
}

// --- DATA FETCHING SERVICES ---

export async function getQuoteByDate(assetId: string, date: Date): Promise<FirestoreQuote | null> {
    const { db } = await getFirebaseAdmin();
    const formattedDate = format(date, 'dd/MM/yyyy');
    
    const snapshot = await db.collection(assetId)
        .where('data', '==', formattedDate)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    return serializeFirestoreTimestamp({ id: doc.id, ...data }) as FirestoreQuote;
}


export async function getCommodityPricesByDate(date: Date): Promise<CommodityPriceData[]> {
    const cacheKey = `commodity_prices_${date.toISOString().split('T')[0]}`;
    const cachedData = getCache<CommodityPriceData[]>(cacheKey);
    if (cachedData) return cachedData;

    const previousDate = subDays(date, 1);
    const displayDate = format(date, 'dd/MM/yyyy');

    try {
        const configs = await getCommodityConfigs();
        
        const assetPromises = configs.map(async (config) => {
            const [latestDoc, previousDoc] = await Promise.all([
                getQuoteByDate(config.id, date),
                getQuoteByDate(config.id, previousDate)
            ]);
            
            const latestPrice = getPriceFromQuote(latestDoc);
            const previousPrice = getPriceFromQuote(previousDoc);
        
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

        setCache(cacheKey, results, CACHE_TTL_SECONDS * 12 * 24); // Cache de 1 dia
        return results;

    } catch (error) {
        console.error("Erro ao buscar preços por data:", error);
        throw new Error("Falha ao obter as cotações para a data especificada.");
    }
}

export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const cachedData = getCache<CommodityPriceData[]>(CACHE_KEY_PRICES);
    if (cachedData) return cachedData;

    try {
        const configs = await getCommodityConfigs();
        const today = new Date();
        const yesterday = subDays(today, 1);
        
        const assetPromises = configs.map(async (config) => {
             const [latestDoc, previousDoc] = await Promise.all([
                getQuoteByDate(config.id, today),
                getQuoteByDate(config.id, yesterday)
            ]);

            const latestPrice = getPriceFromQuote(latestDoc);
            const previousPrice = getPriceFromQuote(previousDoc);
            
            const absoluteChange = latestPrice - previousPrice;
            const change = previousPrice !== 0 ? (absoluteChange / previousPrice) * 100 : 0;

            let lastUpdated = 'N/A';
            if (latestDoc?.timestamp) {
                // If timestamp is a string (ISO format), format it. If it's a number (milliseconds), create a Date object first.
                const dateToFormat = typeof latestDoc.timestamp === 'string' ? new Date(latestDoc.timestamp.replace(' ', 'T').replace(/\//g, '-')) : new Date(serializeFirestoreTimestamp(latestDoc.timestamp));
                lastUpdated = format(dateToFormat, "HH:mm:ss");
            } else if (latestDoc?.data) {
                lastUpdated = latestDoc.data;
            }

            return {
                ...config,
                price: latestPrice,
                change,
                absoluteChange,
                lastUpdated
            };
        });

        const results = await Promise.all(assetPromises);

        setCache(CACHE_KEY_PRICES, results, CACHE_TTL_SECONDS);
        return results;

    } catch (error) {
        console.error("Erro ao buscar preços 'em tempo real':", error);
        throw new Error("Falha ao obter as cotações mais recentes.");
    }
}

export async function getCotacoesHistorico(assetId: string, days: number): Promise<FirestoreQuote[]> {
     const { db } = await getFirebaseAdmin();
    try {
        const endDate = new Date();
        const startDate = subDays(endDate, days);
        
        // This query is inefficient with the current string format but will work.
        // It fetches all documents and filters in memory.
        // A proper fix would require changing the data format in Firestore.
        const snapshot = await db.collection(assetId)
            .orderBy('timestamp', 'desc')
            .limit(days * 2) // Fetch more to be safe
            .get();

        if (snapshot.empty) return [];
        
        const allQuotes = snapshot.docs.map(doc => serializeFirestoreTimestamp({ id: doc.id, ...doc.data() })) as FirestoreQuote[];

        return allQuotes.filter(quote => {
            try {
                const quoteDate = new Date(quote.timestamp.replace(' ', 'T').replace(/\//g, '-'));
                return quoteDate >= startDate && quoteDate <= endDate;
            } catch (e) {
                return false;
            }
        }).slice(0, days);


    } catch (error) {
        console.error(`Erro ao buscar histórico de ${days} dias para ${assetId}:`, error);
        throw new Error(`Falha ao obter o histórico para ${assetId}.`);
    }
}

export async function getCotacoesHistoricoPorRange(assetId: string, dateRange: DateRange): Promise<FirestoreQuote[]> {
    if (!dateRange.from || !dateRange.to) {
        console.warn('getCotacoesHistoricoPorRange chamada sem um intervalo de datas válido.');
        return [];
    }

    const { db } = await getFirebaseAdmin();
    
    try {
        const startDate = startOfDay(dateRange.from);
        const endDate = endOfDay(dateRange.to);

        const snapshot = await db.collection(assetId)
            .orderBy('timestamp', 'desc')
            .get();
        
        if (snapshot.empty) return [];

        const allQuotes = snapshot.docs.map(doc => serializeFirestoreTimestamp({ id: doc.id, ...doc.data() })) as FirestoreQuote[];

        return allQuotes.filter(quote => {
             try {
                const quoteDate = new Date(quote.timestamp.replace(' ', 'T').replace(/\//g, '-'));
                return quoteDate >= startDate && quoteDate <= endDate;
            } catch (e) {
                return false;
            }
        });

    } catch (error) {
        console.error(`Erro ao buscar histórico por período para ${assetId}:`, error);
        throw new Error(`Falha ao obter o histórico por período para ${assetId}.`);
    }
}

export async function clearCacheAndRefresh() {
    clearMemoryCache();
}
