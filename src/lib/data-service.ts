

'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin-config';
import type { CommodityConfig, CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getCache, setCache } from '@/lib/cache-service';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { subDays, format, parse, isValid, startOfDay, parseISO, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { isCalculableAsset, CALCULATION_CONFIGS } from './calculation-service';

// --- CONSTANTS ---
const CACHE_KEY_PRICES = 'commodity_prices_simple';
const CACHE_TTL_SECONDS = 300; // 5 minutos
const SETTINGS_COLLECTION = 'settings';
const COMMODITIES_DOC = 'commodities';
const COMMODITIES_CONFIG_CACHE_KEY = 'commodities_config';

// --- HELPER FUNCTIONS ---

/**
 * Normaliza Timestamps do Firestore ou objetos Date para milissegundos.
 * Essencial para garantir a consistência dos dados, especialmente em ambientes de serialização.
 */
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

/**
 * Obtém o valor principal de uma cotação, priorizando 'valor' e depois 'ultimo'.
 * Abstrai a inconsistência dos campos nos dados de origem.
 */
function getPriceFromQuote(quoteData: any): number {
    if (quoteData) {
        if (typeof quoteData.valor === 'number') return quoteData.valor;
        if (typeof quoteData.ultimo === 'number') return quoteData.ultimo;
    }
    return 0;
}


// --- CONFIGURATION MANAGEMENT (CRUD Ativos) ---

/**
 * Configuração inicial dos ativos. Usada apenas se o documento de configuração
 * no Firestore não existir.
 */
const initialCommoditiesConfig: Record<string, Omit<CommodityConfig, 'id'>> = {
    'ucs_ase': { name: 'UCS ASE', currency: 'BRL', category: 'index', description: 'Índice principal de Unidade de Crédito de Sustentabilidade da Amazônia em pé.', unit: 'Pontos' },
    'ucs': { name: 'UCS', currency: 'BRL', category: 'index', description: 'Unidade de Crédito de Sustentabilidade.', unit: 'BRL por UCS' },
    'pdm': { name: 'PDM', currency: 'BRL', category: 'index', description: 'Produto de Desenvolvimento de Mercado.', unit: 'BRL por PDM' },
    'usd': { name: 'Dólar Comercial', currency: 'BRL', category: 'exchange', description: 'Cotação do Dólar Americano (USD) em Reais (BRL).', unit: 'BRL por USD' },
    'eur': { name: 'Euro', currency: 'BRL', category: 'exchange', description: 'Cotação do Euro (EUR) em Reais (BRL).', unit: 'BRL por EUR' },
    'soja': { name: 'Soja', currency: 'USD', category: 'vus', description: 'Preço da saca de 60kg de Soja.', unit: 'USD por saca' },
    'milho': { name: 'Milho', currency: 'BRL', category: 'vus', description: 'Preço da saca de 60kg de Milho.', unit: 'BRL por saca' },
    'boi_gordo': { name: 'Boi Gordo', currency: 'BRL', category: 'vus', description: 'Preço da arroba (15kg) de Boi Gordo.', unit: 'BRL por @' },
    'carbono': { name: 'Crédito de Carbono', currency: 'EUR', category: 'crs', description: 'Preço do crédito de carbono em Euros.', unit: 'EUR por tonelada' },
    'ch2o_agua': { name: 'CH²O', currency: 'BRL', category: 'crs', description: 'Índice de Custo Hídrico para Produção de Alimentos.', unit: 'BRL por m³' },
    'custo_agua': { name: 'Custo da Água', currency: 'BRL', category: 'crs', description: 'Custo da Água para Produção de Alimentos.', unit: 'BRL por m³' },
    'madeira': { name: 'Madeira Serrada', currency: 'USD', category: 'vmad', description: 'Preço por metro cúbico de madeira serrada.', unit: 'USD por m³' },
};

/**
 * Salva uma nova configuração de ativo ou atualiza uma existente no Firestore.
 * Invalida o cache de configurações para forçar a releitura dos dados frescos.
 * @param id O ID do ativo (ex: 'meu_ativo').
 * @param config O objeto de configuração do ativo.
 */
export async function saveCommodityConfig(id: string, config: Omit<CommodityConfig, 'id'>): Promise<void> {
    const { db } = await getFirebaseAdmin();
    const settingsDocRef = db.collection(SETTINGS_COLLECTION).doc(COMMODITIES_DOC);
    
    // Transação para garantir atomicidade.
    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(settingsDocRef);
        if (!doc.exists) {
            // Se o documento não existe, cria com a configuração inicial + a nova.
            const initialData = { ...initialCommoditiesConfig, [id]: config };
            transaction.set(settingsDocRef, initialData);
        } else {
            // Se existe, apenas atualiza o campo do ativo específico.
            transaction.update(settingsDocRef, { [id]: config });
        }
    });

    // Invalida o cache para forçar a releitura.
    setCache(COMMODITIES_CONFIG_CACHE_KEY, null, 0);
}

/**
 * Busca a lista de todas as configurações de ativos.
 * Primeiro tenta buscar do cache; se não encontrar, busca do Firestore e armazena em cache.
 * @returns Um array com todas as configurações de ativos.
 */
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
        await docRef.set(configData); // Salva a configuração inicial no banco.
    } else {
        configData = doc.data() as Record<string, Omit<CommodityConfig, 'id'>>;
    }
    
    const configsArray = Object.entries(configData).map(([id, config]) => ({
        id,
        ...config,
    }));

    setCache(COMMODITIES_CONFIG_CACHE_KEY, configsArray, CACHE_TTL_SECONDS * 10); // Cache longo (50 min)
    return configsArray;
}


// --- DATA FETCHING SERVICES ---

/**
 * Busca a cotação mais recente para um ativo em uma data específica.
 * Tenta buscar por campo 'data' (string) e depois por 'timestamp' (data).
 * @param assetId O ID da coleção do ativo.
 * @param date A data para a qual a cotação é desejada.
 * @returns A cotação encontrada ou nulo.
 */
export async function getQuoteForDate(assetId: string, date: Date): Promise<FirestoreQuote | null> {
    const { db } = await getFirebaseAdmin();

    // Se o ativo for calculável, calcula e salva, depois retorna.
    if (isCalculableAsset(assetId)) {
        return getOrCalculateAssetForDate(assetId, date);
    }
    
    const formattedDate = format(date, 'dd/MM/yyyy');
    
    // Tentativa 1: Buscar pela data em formato string 'dd/MM/yyyy'
    const stringDateSnapshot = await db.collection(assetId)
        .where('data', '==', formattedDate)
        .limit(1)
        .get();

    if (!stringDateSnapshot.empty) {
        const doc = stringDateSnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as FirestoreQuote;
    }

    // Tentativa 2: Buscar por timestamp dentro do dia
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
    return { id: doc.id, ...doc.data() } as FirestoreQuote;
}


/**
 * Obtém ou calcula o valor de um ativo calculável para uma data específica.
 * Primeiro, verifica se o valor já foi calculado e salvo no Firestore.
 * Se não, busca os componentes, calcula o novo valor e salva no banco antes de retornar.
 * @param assetId O ID do ativo calculável (ex: 'ucs').
 * @param date A data para o cálculo.
 * @returns A cotação calculada.
 */
export async function getOrCalculateAssetForDate(assetId: string, date: Date): Promise<FirestoreQuote | null> {
    if (!isCalculableAsset(assetId)) {
        throw new Error(`${assetId} não é um ativo calculável.`);
    }

    const { db } = await getFirebaseAdmin();
    const config = CALCULATION_CONFIGS[assetId];
    const formattedDate = format(date, 'dd/MM/yyyy');
    const startOfDate = startOfDay(date);

    // 1. Tenta buscar um valor já calculado para a data
    const existingQuote = await getQuoteForDate(assetId, date);
    if (existingQuote) {
        return existingQuote;
    }

    // 2. Se não existe, busca os componentes necessários
    const componentValues: Record<string, number> = {};
    for (const componentId of config.components) {
        // Recursivamente chama a função para obter o valor do componente (que também pode ser calculado)
        const componentQuote = await getQuoteForDate(componentId, date);
        componentValues[componentId] = getPriceFromQuote(componentQuote);
    }
    
    // 3. Calcula o novo valor
    const calculatedValue = config.calculator(componentValues);
    if (isNaN(calculatedValue) || calculatedValue === 0) {
        console.warn(`Cálculo para ${assetId} em ${formattedDate} resultou em 0 ou NaN. Não será salvo.`);
        return null; // Não salva se o valor for 0 ou NaN.
    }

    // 4. Salva o novo valor no Firestore
    const newQuoteData = {
        data: formattedDate,
        timestamp: Timestamp.fromDate(startOfDate),
        ultimo: calculatedValue,
        valor: calculatedValue,
        variacao_pct: 0, // Variação é calculada em outro lugar
        ...componentValues, // Salva os valores dos componentes para rastreabilidade
    };

    const docRef = await db.collection(assetId).add(newQuoteData);
    
    return { id: docRef.id, ...newQuoteData } as FirestoreQuote;
}


/**
 * Busca a cotação mais recente de um ativo, ordenando por timestamp.
 * @param assetId O ID da coleção do ativo.
 * @returns A cotação mais recente ou nulo.
 */
export async function getLatestQuote(assetId: string): Promise<FirestoreQuote | null> {
    const { db } = await getFirebaseAdmin();
    const snapshot = await db.collection(assetId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as FirestoreQuote;
}

/**
 * Busca os preços de todos os ativos para uma data específica (visão de fechamento).
 * Calcula a variação com base no dia anterior.
 * @param date A data para a qual os preços são desejados.
 * @returns Um array com os dados de preço de todos os ativos.
 */
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
                getQuoteForDate(config.id, date),
                getQuoteForDate(config.id, previousDate)
            ]);
            
            const latestPrice = getPriceFromQuote(latestDoc);
            const previousPrice = previousDoc ? getPriceFromQuote(previousDoc) : latestPrice;
        
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

        setCache(cacheKey, results, CACHE_TTL_SECONDS * 12 * 24); // Cache de 1 dia para dados históricos
        return results;

    } catch (error) {
        console.error("Erro ao buscar preços por data:", error);
        throw new Error("Falha ao obter as cotações para a data especificada.");
    }
}

/**
 * Busca os preços mais recentes de todos os ativos (visão "tempo real").
 * Calcula a variação com base no penúltimo registro de cada ativo.
 * @returns Um array com os dados de preço de todos os ativos.
 */
export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const cachedData = getCache<CommododyPriceData[]>(CACHE_KEY_PRICES);
    if (cachedData) return cachedData;

    try {
        const configs = await getCommodityConfigs();
        const { db } = await getFirebaseAdmin();
        
        const assetPromises = configs.map(async (config) => {
            const snapshot = await db.collection(config.id).orderBy('timestamp', 'desc').limit(2).get();

            if (snapshot.empty) {
                return { ...config, price: 0, change: 0, absoluteChange: 0, lastUpdated: 'N/A' };
            }

            const latestDocData = snapshot.docs[0].data();
            const previousDocData = snapshot.docs.length > 1 ? snapshot.docs[1].data() : null;

            const latestPrice = getPriceFromQuote(latestDocData);
            const previousPrice = previousDocData ? getPriceFromQuote(previousDocData) : latestPrice;

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
        console.error("Erro ao buscar preços 'em tempo real':", error);
        throw new Error("Falha ao obter as cotações mais recentes.");
    }
}

/**
 * Busca o histórico de cotações de um ativo nos últimos N dias.
 * @param assetId O ID da coleção do ativo.
 * @param days O número de dias no passado para buscar.
 * @returns Um array com o histórico de cotações.
 */
export async function getCotacoesHistorico(assetId: string, days: number): Promise<FirestoreQuote[]> {
  try {
    const { db } = await getFirebaseAdmin();
    const startDate = subDays(new Date(), days);
    
    const snapshot = await db.collection(assetId)
      .where('timestamp', '>=', Timestamp.fromDate(startDate))
      .orderBy('timestamp', 'desc')
      .get();

    if (snapshot.empty) return [];
    
    const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
            id: doc.id,
            ...docData,
            timestamp: serializeFirestoreTimestamp(docData.timestamp),
            ultimo: getPriceFromQuote(docData),
        } as FirestoreQuote;
    });

    return data;

  } catch (error) {
    console.error(`Erro ao buscar histórico de ${days} dias para ${assetId}:`, error);
    throw new Error(`Falha ao obter o histórico para ${assetId}.`);
  }
}

/**
 * Busca o histórico de cotações de um ativo dentro de um intervalo de datas específico.
 * @param assetId O ID da coleção do ativo.
 * @param dateRange Um objeto com as propriedades 'from' e 'to'.
 * @returns Um array com o histórico de cotações no período.
 */
export async function getCotacoesHistoricoPorRange(assetId: string, dateRange: DateRange): Promise<FirestoreQuote[]> {
    if (!dateRange.from || !dateRange.to) {
        console.warn('getCotacoesHistoricoPorRange chamada sem um intervalo de datas válido.');
        return [];
    }

    try {
        const { db } = await getFirebaseAdmin();
        const startDate = startOfDay(dateRange.from);
        const endDate = endOfDay(dateRange.to);

        const snapshot = await db.collection(assetId)
            .where('timestamp', '>=', Timestamp.fromDate(startDate))
            .where('timestamp', '<=', Timestamp.fromDate(endDate))
            .orderBy('timestamp', 'desc')
            .get();

        if (snapshot.empty) return [];

        const data = snapshot.docs.map(doc => {
            const docData = doc.data();
            return {
                id: doc.id,
                ...docData,
                timestamp: serializeFirestoreTimestamp(docData.timestamp),
                ultimo: getPriceFromQuote(docData),
            } as FirestoreQuote;
        });

        return data;

    } catch (error) {
        console.error(`Erro ao buscar histórico por período para ${assetId}:`, error);
        throw new Error(`Falha ao obter o histórico por período para ${assetId}.`);
    }
}
