

'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin-config';
import type { CommodityConfig, CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getCache, setCache, clearCache as clearMemoryCache } from '@/lib/cache-service';
import { Timestamp } from 'firebase-admin/firestore';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';
import { revalidatePath } from 'next/cache';

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
        if (typeof quoteData.resultado_final_brl === 'number') return quoteData.resultado_final_brl;
        if (typeof quoteData.valor_brl === 'number') return quoteData.valor_brl;
        if (typeof quoteData.ultimo === 'number') return quoteData.ultimo;
        if (typeof quoteData.valor === 'number') return quoteData.valor;
    }
    return 0;
}


// --- CONFIGURATION MANAGEMENT (CRUD Ativos) ---

const initialCommoditiesConfig: Record<string, Omit<CommodityConfig, 'id'>> = {
    // Commodities Base
    'milho': { name: 'Milho', currency: 'BRL', category: 'agricultural', description: 'Milho Futuros (convertido para BRL)', unit: 'saca', sourceUrl: 'https://br.investing.com/commodities/us-corn-futures' },
    'soja': { name: 'Soja', currency: 'BRL', category: 'agricultural', description: 'Soja Futuros (convertido para BRL)', unit: 'saca', sourceUrl: 'https://br.investing.com/commodities/us-soybeans-futures' },
    'boi_gordo': { name: 'Boi Gordo', currency: 'BRL', category: 'agricultural', description: 'Preço da arroba (15kg) de Boi Gordo.', unit: '@', sourceUrl: 'https://br.investing.com/commodities/live-cattle-futures' },
    'madeira': { name: 'Madeira', currency: 'BRL', category: 'material', description: 'Madeira Serrada (convertido para BRL)', unit: 'm³', sourceUrl: 'https://br.investing.com/commodities/lumber-futures' },
    'carbono': { name: 'Carbono', currency: 'BRL', category: 'material', description: 'Crédito de Carbono (convertido para BRL)', unit: 'Tonelada', sourceUrl: 'https://br.investing.com/commodities/carbon-emissions-futures' },
    'usd': { name: 'Dólar Americano', currency: 'BRL', category: 'exchange', description: 'Cotação do Dólar Americano (USD) em Reais (BRL).', unit: 'BRL', sourceUrl: 'https://br.investing.com/currencies/usd-brl' },
    'eur': { name: 'Euro', currency: 'BRL', category: 'exchange', description: 'Cotação do Euro (EUR) em Reais (BRL).', unit: 'BRL', sourceUrl: 'https://br.investing.com/currencies/eur-brl' },

    // Indices Calculados (conforme documentação)
    'ch2o_agua': { name: 'CH2O Água', currency: 'BRL', category: 'sub-index', description: 'Índice de uso da água.', unit: 'Pontos' },
    'custo_agua': { name: 'Custo Água', currency: 'BRL', category: 'sub-index', description: 'Custo do uso da água (7% de CH2O).', unit: 'BRL' },
    'pdm': { name: 'PDM', currency: 'BRL', category: 'sub-index', description: 'Potencial Desflorestador Monetizado.', unit: 'BRL por PDM' },
    'ucs': { name: 'UCS', currency: 'BRL', category: 'sub-index', description: 'Universal Carbon Sustainability.', unit: 'Pontos' },
    'vus': { name: 'VUS', currency: 'BRL', category: 'vus', description: 'Valor Universal Sustentável (commodities agrícolas).', unit: 'Pontos' },
    'vmad': { name: 'VMAD', currency: 'BRL', category: 'vmad', description: 'Valor da Madeira.', unit: 'Pontos' },
    'carbono_crs': { name: 'Carbono CRS', currency: 'BRL', category: 'crs', description: 'Valor do Carbono.', unit: 'Pontos' },
    'Agua_CRS': { name: 'Água CRS', currency: 'BRL', category: 'crs', description: 'Valor da Água.', unit: 'Pontos' },
    'valor_uso_solo': { name: 'Valor Uso Solo', currency: 'BRL', category: 'sub-index', description: 'Valor total do uso do solo.', unit: 'Pontos' },
    
    // Indice Principal
    'ucs_ase': { name: 'Índice UCS ASE', currency: 'BRL', category: 'index', description: 'Índice principal de Unidade de Crédito de Sustentabilidade.', unit: 'Pontos' },
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

    let configData: Record<string, Omit<CommodityConfig, 'id'>>;

    if (!doc.exists || !doc.data()) {
        console.log("Nenhuma configuração de commodity encontrada, usando configuração inicial e (re)criando documento se necessário.");
        configData = initialCommoditiesConfig;
        try {
            await docRef.set(configData);
        } catch (error) {
            console.error("Falha ao criar o documento de configuração inicial:", error);
        }
    } else {
         const data = doc.data();
         configData = data ? (data as Record<string, Omit<CommodityConfig, 'id'>>) : initialCommoditiesConfig;
    }
    
    const configsArray = Object.entries(configData).map(([id, config]) => ({
        id,
        ...config,
    }));
    
    // START: Hotfix para garantir as descrições corretas
    const pdmAsset = configsArray.find(c => c.id === 'pdm');
    if (pdmAsset) {
        pdmAsset.description = "Potencial Desflorestador Monetizado.";
    }

    const ucsAseAsset = configsArray.find(c => c.id === 'ucs_ase');
    if (ucsAseAsset) {
        ucsAseAsset.description = "Índice principal de Unidade de Crédito de Sustentabilidade.";
    }
    // END: Hotfix

    setCache(COMMODITIES_CONFIG_CACHE_KEY, configsArray, CACHE_TTL_SECONDS * 10);
    return configsArray;
}

// --- DATA FETCHING SERVICES ---

export async function getQuoteByDate(assetId: string, date: Date): Promise<FirestoreQuote | null> {
    const { db } = await getFirebaseAdmin();
    const formattedDate = format(date, 'dd/MM/yyyy');
    
    try {
        const snapshot = await db.collection(assetId)
            .where('data', '==', formattedDate)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const data = doc.data();
            return serializeFirestoreTimestamp({ id: doc.id, ...data }) as FirestoreQuote;
        }

        return null;

    } catch (error) {
        console.error(`Error fetching quote for ${assetId} on ${formattedDate}:`, error);
        return null;
    }
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
                const timestamp = latestDoc.timestamp;
                const tsAsString = typeof timestamp === 'string' ? timestamp : serializeFirestoreTimestamp(timestamp).toString();
                const dateToFormat = new Date(tsAsString.replace(' ', 'T').replace(/\//g, '-'));

                if (!isNaN(dateToFormat.getTime())) {
                    lastUpdated = format(dateToFormat, "HH:mm:ss");
                } else if (latestDoc?.data) {
                    lastUpdated = latestDoc.data;
                }
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
        
        const snapshot = await db.collection(assetId)
            .orderBy('timestamp', 'desc')
            .limit(days)
            .get();

        if (snapshot.empty) return [];
        
        return snapshot.docs.map(doc => serializeFirestoreTimestamp({ id: doc.id, ...doc.data() })) as FirestoreQuote[];

    } catch (error) {
        console.error(`Erro ao buscar histórico de ${days} dias para ${assetId}:`, error);
        throw new Error(`Falha ao obter o histórico para ${assetId}.`);
    }
}

export async function getCotacoesHistoricoPorRange(assetId: string, dateRange: { from: Date, to: Date }): Promise<FirestoreQuote[]> {
    const { db } = await getFirebaseAdmin();
    
    try {
        const startDate = startOfDay(dateRange.from);
        const endDate = endOfDay(dateRange.to);

        const snapshot = await db.collection(assetId)
            .where('timestamp', '>=', Timestamp.fromDate(startDate))
            .where('timestamp', '<=', Timestamp.fromDate(endDate))
            .orderBy('timestamp', 'desc')
            .get();
        
        if (snapshot.empty) return [];

        return snapshot.docs.map(doc => serializeFirestoreTimestamp({ id: doc.id, ...doc.data() })) as FirestoreQuote[];

    } catch (error) {
        console.error(`Erro ao buscar histórico por período para ${assetId}:`, error);
        throw new Error(`Falha ao obter o histórico por período para ${assetId}.`);
    }
}

export async function clearCacheAndRefresh() {
    clearMemoryCache();
    revalidatePath('/dashboard');
}

/**
 * Aciona um webhook no n8n para reprocessar os dados de uma data específica.
 * @param date A data a ser reprocessada.
 */
export async function reprocessDate(date: Date): Promise<{ success: boolean; message: string }> {
    const webhookUrl = process.env.N8N_REPROCESS_WEBHOOK_URL;
    
    if (!webhookUrl) {
        const errorMessage = "A URL do webhook de reprocessamento não está configurada no servidor.";
        console.error(`[reprocessDate] ${errorMessage}`);
        return { success: false, message: errorMessage };
    }

    const formattedDate = format(date, 'yyyy-MM-dd');

    try {
        console.log(`[reprocessDate] Acionando webhook para reprocessar a data: ${formattedDate}`);
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: formattedDate }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`O webhook respondeu com o status ${response.status}: ${errorBody}`);
        }
        
        // Limpa o cache para forçar a busca dos novos dados reprocessados.
        clearMemoryCache();
        revalidatePath('/dashboard');
        revalidatePath('/admin/audit');

        const successMessage = `Solicitação de reprocessamento para ${format(date, 'dd/MM/yyyy')} enviada com sucesso.`;
        return { success: true, message: successMessage };

    } catch (error: any) {
        console.error(`[reprocessDate] Falha ao acionar o webhook:`, error);
        return { success: false, message: error.message || "Ocorreu um erro desconhecido ao tentar reprocessar a data." };
    }
}
