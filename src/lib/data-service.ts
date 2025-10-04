
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin-config';
import type { CommodityConfig, CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getCache, setCache, clearCache as clearMemoryCache } from '@/lib/cache-service';
import { Timestamp } from 'firebase-admin/firestore';
import { subDays, format, startOfDay, endOfDay, isValid } from 'date-fns';
import { revalidatePath } from 'next/cache';

// --- CONSTANTS ---
const CACHE_KEYS = {
  COMMODITIES_CONFIG: 'commodities_config',
  PRICES_REALTIME: 'commodity_prices_realtime',
  PRICES_BY_DATE: 'commodity_prices_by_date',
} as const;

const CACHE_TTL = {
  CONFIG: 600, // 10 minutos
  REALTIME: 120, // 2 minutos
  HISTORICAL: 86400, // 24 horas
} as const;

const COLLECTIONS = {
  SETTINGS: 'settings',
  COMMODITIES_DOC: 'commodities',
} as const;

// --- TYPES ---
interface CacheConfig {
  key: string;
  ttl: number;
}

interface PriceExtractionResult {
  price: number;
  source: string;
}

// --- UTILITY FUNCTIONS ---

/**
 * Serializa timestamps do Firestore para formato compatível
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

/**
 * Extrai o preço de uma cotação seguindo uma ordem de prioridade clara
 */
function extractPriceFromQuote(quoteData: any): PriceExtractionResult {
  if (!quoteData) {
    return { price: 0, source: 'none' };
  }

  // Ordem de prioridade para extração do preço
  const priceFields = [
    { field: 'valor_brl', source: 'valor_brl' }, // Prioridade para UCS ASE
    { field: 'valor', source: 'valor' },
    { field: 'resultado_final_brl', source: 'resultado_final_brl' }, // Outro campo comum em calculados
    { field: 'ultimo', source: 'ultimo' },
  ];

  for (const { field, source } of priceFields) {
    if (typeof quoteData[field] === 'number' && !isNaN(quoteData[field])) {
      return { price: quoteData[field], source };
    }
  }
  
  // Fallback para o campo `resultado_final` (sem _brl)
   if (typeof quoteData['resultado_final'] === 'number' && !isNaN(quoteData['resultado_final'])) {
      return { price: quoteData['resultado_final'], source: 'resultado_final_fallback' };
  }

  return { price: 0, source: 'none' };
}


/**
 * Gera chave de cache para dados por data
 */
function generateDateCacheKey(baseKey: string, date: Date): string {
  return `${baseKey}_${date.toISOString().split('T')[0]}`;
}

/**
 * Formata timestamp para exibição
 */
function formatTimestamp(timestamp: any): string {
    if (!timestamp) return 'N/A';
    
    try {
        const tsAsMillis = serializeFirestoreTimestamp(timestamp);
        const dateToFormat = new Date(tsAsMillis);
        
        if (isValid(dateToFormat)) {
            return format(dateToFormat, "HH:mm:ss");
        }
    } catch (error) {
        console.warn('Erro ao formatar timestamp:', error, 'Valor original:', timestamp);
    }
    
    // Fallback se a conversão falhar
    if(typeof timestamp === 'string' && isValid(new Date(timestamp))) {
      return format(new Date(timestamp), "HH:mm:ss");
    }
    
    return 'Inválido';
}

// --- CONFIGURATION MANAGEMENT ---

/**
 * Busca a configuração de commodities.
 */
export async function getCommodityConfigs(): Promise<CommodityConfig[]> {
  const cachedConfigs = getCache<CommodityConfig[]>(CACHE_KEYS.COMMODITIES_CONFIG);
  if (cachedConfigs) {
    return cachedConfigs;
  }
  
  const { db } = await getFirebaseAdmin();
  const docRef = db.collection(COLLECTIONS.SETTINGS).doc(COLLECTIONS.COMMODITIES_DOC);
  
  try {
    const doc = await docRef.get();
    if (!doc.exists) {
      console.warn("Documento de configuração de commodities não encontrado. Usando fallback.");
      return [];
    }
    
    const configData = doc.data() as Record<string, Omit<CommodityConfig, 'id'>>;
    const configsArray = Object.entries(configData).map(([id, config]) => ({
      id,
      ...config,
    }));
    
    setCache(CACHE_KEYS.COMMODITIES_CONFIG, configsArray, CACHE_TTL.CONFIG);
    return configsArray;
    
  } catch (error) {
    console.error("Erro ao buscar configurações de commodities:", error);
    throw new Error("Falha ao obter as configurações dos ativos.");
  }
}

// --- DATA FETCHING SERVICES ---

/**
 * Obtém cotação de um ativo para uma data específica
 */
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
      return serializeFirestoreTimestamp({ id: doc.id, ...doc.data() }) as FirestoreQuote;
    }
    
    const historicalSnapshot = await db.collection(assetId)
      .where('timestamp', '<', Timestamp.fromDate(date))
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
      
    if (!historicalSnapshot.empty) {
        const doc = historicalSnapshot.docs[0];
        return serializeFirestoreTimestamp({ id: doc.id, ...doc.data() }) as FirestoreQuote;
    }

    return null;
  } catch (error) {
    console.error(`Erro ao buscar cotação para ${assetId} em ${formattedDate}:`, error);
    return null;
  }
}

/**
 * Calcula mudança percentual entre dois preços
 */
function calculatePriceChange(currentPrice: number, previousPrice: number): { change: number; absoluteChange: number } {
  if (previousPrice === 0) {
    return { change: currentPrice > 0 ? 100 : 0, absoluteChange: currentPrice };
  }
  const absoluteChange = currentPrice - previousPrice;
  const change = (absoluteChange / previousPrice) * 100;
  return { change, absoluteChange };
}

/**
 * Obtém preços de commodities para uma data específica
 */
export async function getCommodityPricesByDate(date: Date): Promise<CommodityPriceData[]> {
  const cacheKey = generateDateCacheKey(CACHE_KEYS.PRICES_BY_DATE, date);
  const cachedData = getCache<CommodityPriceData[]>(cacheKey);
  if (cachedData) return cachedData;

  try {
    const configs = await getCommodityConfigs();
    const previousDate = subDays(date, 1);
    const displayDate = format(date, 'dd/MM/yyyy');

    const assetPromises = configs.map(async (config) => {
      const [latestDoc, previousDoc] = await Promise.all([
        getQuoteByDate(config.id, date),
        getQuoteByDate(config.id, previousDate)
      ]);
      
      const { price: latestPrice } = extractPriceFromQuote(latestDoc);
      const { price: previousPrice } = extractPriceFromQuote(previousDoc);
      
      const { change, absoluteChange } = calculatePriceChange(latestPrice, previousPrice);
      
      return { 
        ...config, 
        price: latestPrice, 
        change, 
        absoluteChange, 
        lastUpdated: latestDoc?.data || displayDate
      };
    });

    const results = await Promise.all(assetPromises);
    setCache(cacheKey, results, CACHE_TTL.HISTORICAL);
    return results;

  } catch (error) {
    console.error("Erro ao buscar preços por data:", error);
    throw new Error("Falha ao obter as cotações para a data especificada.");
  }
}

/**
 * Obtém preços atuais de commodities
 */
export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
  const cachedData = getCache<CommodityPriceData[]>(CACHE_KEYS.PRICES_REALTIME);
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

      const { price: latestPrice } = extractPriceFromQuote(latestDoc);
      const { price: previousPrice } = extractPriceFromQuote(previousDoc);
      
      const { change, absoluteChange } = calculatePriceChange(latestPrice, previousPrice);

      const lastUpdated = latestDoc?.timestamp 
        ? formatTimestamp(latestDoc.timestamp)
        : 'N/A';

      return {
        ...config,
        price: latestPrice,
        change,
        absoluteChange,
        lastUpdated: lastUpdated,
      };
    });

    const results = await Promise.all(assetPromises);
    setCache(CACHE_KEYS.PRICES_REALTIME, results, CACHE_TTL.REALTIME);
    return results;

  } catch (error) {
    console.error("Erro ao buscar preços em tempo real:", error);
    throw new Error("Falha ao obter as cotações mais recentes.");
  }
}

/**
 * Obtém histórico de cotações para um ativo
 */
export async function getCotacoesHistorico(assetId: string, days: number): Promise<FirestoreQuote[]> {
  const { db } = await getFirebaseAdmin();
  try {
    const snapshot = await db.collection(assetId)
      .orderBy('timestamp', 'desc')
      .limit(days)
      .get();

    if (snapshot.empty) return [];
    
    return snapshot.docs.map(doc => 
      serializeFirestoreTimestamp({ id: doc.id, ...doc.data() })
    ) as FirestoreQuote[];

  } catch (error) {
    console.error(`Erro ao buscar histórico de ${days} dias para ${assetId}:`, error);
    return [];
  }
}

/**
 * Obtém histórico de cotações por período
 */
export async function getCotacoesHistoricoPorRange(
  assetId: string, 
  dateRange: { from: Date, to: Date }
): Promise<FirestoreQuote[]> {
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

    return snapshot.docs.map(doc => 
      serializeFirestoreTimestamp({ id: doc.id, ...doc.data() })
    ) as FirestoreQuote[];

  } catch (error) {
    console.error(`Erro ao buscar histórico por período para ${assetId}:`, error);
    return [];
  }
}

// --- CACHE MANAGEMENT ---

/**
 * Limpa cache e revalida páginas
 */
export async function clearCacheAndRefresh(): Promise<void> {
  clearMemoryCache();
  revalidatePath('/dashboard');
}

// --- WEBHOOK SERVICES ---

/**
 * Reprocessa dados de uma data específica via webhook
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
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: formattedDate }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`O webhook respondeu com o status ${response.status}: ${errorBody}`);
    }
    
    clearMemoryCache();
    revalidatePath('/dashboard');

    const successMessage = `Solicitação de reprocessamento para ${format(date, 'dd/MM/yyyy')} enviada com sucesso.`;
    return { success: true, message: successMessage };

  } catch (error: any) {
    console.error(`[reprocessDate] Falha ao acionar o webhook:`, error);
    return { 
      success: false, 
      message: error.message || "Ocorreu um erro desconhecido ao tentar reprocessar a data." 
    };
  }
}
