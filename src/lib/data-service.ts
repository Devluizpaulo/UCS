
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin-config';
import type { CommodityConfig, CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getCache, setCache, clearCache as clearMemoryCache } from '@/lib/cache-service';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { subDays, format, parse, isValid, startOfDay, parseISO, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { revalidatePath } from 'next/cache';
import { CALCULATION_CONFIGS, isCalculableAsset } from './calculation-service';

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
        // 'rent_media' é o campo principal para cálculos, se existir.
        if (typeof quoteData.rent_media === 'number') return quoteData.rent_media;
        if (typeof quoteData.valor === 'number') return quoteData.valor;
        if (typeof quoteData.ultimo === 'number') return quoteData.ultimo;
    }
    return 0;
}

// --- CONFIGURATION MANAGEMENT (CRUD Ativos) ---

const initialCommoditiesConfig: Record<string, Omit<CommodityConfig, 'id'>> = {
    'ucs_ase': { name: 'UCS ASE', currency: 'BRL', category: 'index', description: 'Índice principal de Unidade de Crédito de Sustentabilidade.', unit: 'Pontos' },
    'ucs': { name: 'UCS', currency: 'BRL', category: 'index', description: 'Unidade de Crédito de Sustentabilidade.', unit: 'BRL por UCS' },
    'pdm': { name: 'PDM', currency: 'BRL', category: 'index', description: 'Potencial Desflorestador Monetizado.', unit: 'BRL por PDM' },
    'vus': { name: 'VUS', currency: 'BRL', category: 'index', description: 'Valor de Uso do Solo.', unit: 'BRL por VUS' },
    'vmad': { name: 'VMAD', currency: 'BRL', category: 'index', description: 'Valor da Madeira.', unit: 'BRL por VMAD' },
    'crs': { name: 'CRS', currency: 'BRL', category: 'index', description: 'Custo de Responsabilidade Socioambiental.', unit: 'BRL por CRS' },
    'usd': { name: 'Dólar Comercial', currency: 'BRL', category: 'exchange', description: 'Cotação do Dólar Americano (USD) em Reais (BRL).', unit: 'BRL por USD' },
    'eur': { name: 'Euro', currency: 'BRL', category: 'exchange', description: 'Cotação do Euro (EUR) em Reais (BRL).', unit: 'BRL por EUR' },
    'soja': { name: 'Soja', currency: 'USD', category: 'vus', description: 'Preço da saca de 60kg de Soja.', unit: 'USD por saca' },
    'milho': { name: 'Milho', currency: 'BRL', category: 'vus', description: 'Preço da saca de 60kg de Milho.', unit: 'BRL por saca' },
    'boi_gordo': { name: 'Boi Gordo', currency: 'BRL', category: 'vus', description: 'Preço da arroba (15kg) de Boi Gordo.', unit: 'BRL por @' },
    'carbono': { name: 'Crédito de Carbono', currency: 'EUR', category: 'crs', description: 'Custo da manutenção com a chamada Responsabilidade Social do projeto.', unit: 'EUR por Tonelada' },
    'custo_agua': { name: 'Crédito de Água', currency: 'BRL', category: 'crs', description: 'Custo da Água para Produção de Alimentos.', unit: 'BRL por m³' },
    'madeira': { name: 'Madeira Serrada', currency: 'USD', category: 'vmad', description: 'Preço por metro cúbico de madeira serrada.', unit: 'USD por m³' },
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

    if (!doc.exists) {
        console.log("Nenhuma configuração de commodity encontrada, usando configuração inicial e criando documento.");
        configData = initialCommoditiesConfig;
        await docRef.set(configData);
    } else {
        configData = doc.data() as Record<string, Omit<CommodityConfig, 'id'>>;
    }
    
    const configsArray = Object.entries(configData).map(([id, config]) => ({
        id,
        ...config,
    }));

    setCache(COMMODITIES_CONFIG_CACHE_KEY, configsArray, CACHE_TTL_SECONDS * 10);
    return configsArray;
}

// --- DATA FETCHING SERVICES ---

/**
 * Busca o documento de cotação completo para um ativo em uma data específica.
 * NOTA: Esta função não faz cálculos, apenas busca dados brutos.
 */
export async function getQuoteByDate(assetId: string, date: Date): Promise<FirestoreQuote | null> {
    const { db } = await getFirebaseAdmin();
    const formattedDate = format(date, 'dd/MM/yyyy');
    
    const stringDateSnapshot = await db.collection(assetId)
        .where('data', '==', formattedDate)
        .limit(1)
        .get();

    if (!stringDateSnapshot.empty) {
        const doc = stringDateSnapshot.docs[0];
        const data = doc.data();
        return serializeFirestoreTimestamp({ id: doc.id, ...data }) as FirestoreQuote;
    }

    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    const timestampSnapshot = await db.collection(assetId)
        .where('timestamp', '>=', Timestamp.fromDate(startDate))
        .where('timestamp', '<=', Timestamp.fromDate(endDate))
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

    if (timestampSnapshot.empty) return null;
    
    const doc = timestampSnapshot.docs[0];
    const data = doc.data();
    return serializeFirestoreTimestamp({ id: doc.id, ...data }) as FirestoreQuote;
}

/**
 * Busca ou calcula a cotação de um ativo para uma data específica.
 * Se o ativo for "calculável", busca seus componentes e executa o cálculo.
 * Caso contrário, busca a cotação diretamente do Firestore.
 */
async function getOrCalculateAssetForDate(assetId: string, date: Date): Promise<FirestoreQuote | null> {
    if (!isCalculableAsset(assetId)) {
        return getQuoteByDate(assetId, date);
    }

    const config = CALCULATION_CONFIGS[assetId];
    const componentPromises = config.components.map(componentId => getQuoteByDate(componentId, date));
    const componentsQuotes = await Promise.all(componentPromises);

    const componentValues: Record<string, number> = {};
    let allComponentsAvailable = true;
    
    componentsQuotes.forEach((quote, index) => {
        const componentId = config.components[index];
        if (quote) {
            // Usa 'rent_media' como prioridade para os cálculos
            componentValues[componentId] = quote.rent_media ?? getPriceFromQuote(quote);
        } else {
            allComponentsAvailable = false;
        }
    });

    if (!allComponentsAvailable) {
        // console.warn(`Não foi possível calcular ${assetId} para ${format(date, 'dd/MM/yyyy')} pois faltam componentes.`);
        return null;
    }

    const calculatedValue = config.calculate(componentValues);

    return {
        id: `calculated_${assetId}_${date.getTime()}`,
        ultimo: calculatedValue,
        valor: calculatedValue,
        rent_media: calculatedValue,
        data: format(date, 'dd/MM/yyyy'),
        timestamp: date.getTime(),
        variacao_pct: 0, // Variação de ativos calculados precisa de lógica adicional
    };
}

export async function getLatestQuote(assetId: string): Promise<FirestoreQuote | null> {
    const { db } = await getFirebaseAdmin();
    const snapshot = await db.collection(assetId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    
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
                getOrCalculateAssetForDate(config.id, date),
                getOrCalculateAssetForDate(config.id, subDays(date, 1))
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
        
        const assetPromises = configs.map(async (config) => {
             const [latestDoc, previousDoc] = await Promise.all([
                getOrCalculateAssetForDate(config.id, today),
                getOrCalculateAssetForDate(config.id, subDays(today, 1))
            ]);

            const latestPrice = getPriceFromQuote(latestDoc);
            const previousPrice = getPriceFromQuote(previousDoc);
            
            const absoluteChange = latestPrice - previousPrice;
            const change = previousPrice !== 0 ? (absoluteChange / previousPrice) * 100 : 0;

            let lastUpdated = 'N/A';
            if (latestDoc?.timestamp) {
                lastUpdated = format(serializeFirestoreTimestamp(latestDoc.timestamp), "HH:mm:ss");
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
    try {
        const today = new Date();
        const datePromises: Promise<FirestoreQuote | null>[] = [];
        for (let i = 0; i < days; i++) {
            const date = subDays(today, i);
            datePromises.push(getOrCalculateAssetForDate(assetId, date));
        }
        
        const results = await Promise.all(datePromises);
        
        // Filtra resultados nulos e ordena do mais recente para o mais antigo
        return results.filter((quote): quote is FirestoreQuote => quote !== null);

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
    
    try {
        // A abordagem de iterar dia a dia é mais robusta para ativos calculados
        const datePromises: Promise<FirestoreQuote | null>[] = [];
        let currentDate = startOfDay(dateRange.from);
        const endDate = startOfDay(dateRange.to);

        while (currentDate <= endDate) {
            datePromises.push(getOrCalculateAssetForDate(assetId, new Date(currentDate)));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        const results = await Promise.all(datePromises);
        return results
            .filter((quote): quote is FirestoreQuote => quote !== null)
            .sort((a, b) => b.timestamp - a.timestamp); // Ordena do mais recente para o mais antigo

    } catch (error) {
        console.error(`Erro ao buscar histórico por período para ${assetId}:`, error);
        throw new Error(`Falha ao obter o histórico por período para ${assetId}.`);
    }
}

export async function clearCacheAndRefresh() {
    clearMemoryCache();
    // A revalidação do caminho é feita no lado do cliente que chama esta ação.
}