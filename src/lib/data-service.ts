'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin-config';
import type { CommodityConfig, CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getCache, setCache, clearCache as clearMemoryCache } from '@/lib/cache-service';
import { Timestamp } from 'firebase-admin/firestore';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';
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

  // Log específico para VMAD para debug
  if (quoteData.id === 'vmad' || quoteData.id === 'Vmad') {
    console.log(`[extractPriceFromQuote] VMAD - Dados recebidos:`, {
      id: quoteData.id,
      valor: quoteData.valor,
      ultimo: quoteData.ultimo,
      resultado_final_brl: quoteData.resultado_final_brl,
      valor_brl: quoteData.valor_brl,
      campos: Object.keys(quoteData)
    });
  }

  // Ordem de prioridade para extração do preço
  const priceFields = [
    { field: 'valor', source: 'valor' },
    { field: 'resultado_final_brl', source: 'resultado_final_brl' },
    { field: 'ultimo', source: 'ultimo' },
    { field: 'valor_brl', source: 'valor_brl' },
  ];

  for (const { field, source } of priceFields) {
    if (typeof quoteData[field] === 'number' && quoteData[field] !== 0) {
      if (quoteData.id === 'vmad' || quoteData.id === 'Vmad') {
        console.log(`[extractPriceFromQuote] VMAD - Usando campo ${field}:`, quoteData[field]);
      }
      return { price: quoteData[field], source };
    }
  }

  if (quoteData.id === 'vmad' || quoteData.id === 'Vmad') {
    console.log(`[extractPriceFromQuote] VMAD - Nenhum campo válido encontrado, retornando 0`);
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
    const tsAsString = typeof timestamp === 'string' 
      ? timestamp 
      : serializeFirestoreTimestamp(timestamp).toString();
    
    const dateToFormat = new Date(tsAsString.replace(' ', 'T').replace(/\//g, '-'));
    
    if (!isNaN(dateToFormat.getTime())) {
      return format(dateToFormat, "HH:mm:ss");
    }
  } catch (error) {
    console.warn('Erro ao formatar timestamp:', error);
  }
  
  return 'N/A';
}

// --- CONFIGURATION MANAGEMENT ---

/**
 * CONFIGURAÇÃO COMPLETA E LIMPA DOS ATIVOS
 * Organizada por categorias e com informações consistentes
 */
const ASSETS_CONFIG: Record<string, Omit<CommodityConfig, 'id'>> = {
  // === MOEDAS E CÂMBIO ===
  'usd': {
    name: 'Dólar Americano',
    currency: 'BRL',
    category: 'exchange',
    description: 'Cotação do Dólar Americano (USD) em Reais (BRL)',
    unit: 'BRL',
    sourceUrl: 'https://br.investing.com/currencies/usd-brl-historical-data'
  },
  'eur': {
    name: 'Euro',
    currency: 'BRL',
    category: 'exchange',
    description: 'Cotação do Euro (EUR) em Reais (BRL)',
    unit: 'BRL',
    sourceUrl: 'https://br.investing.com/currencies/eur-brl-historical-data'
  },

  // === COMMODITIES AGRÍCOLAS ===
  'milho': {
    name: 'Milho',
    currency: 'BRL',
    category: 'agricultural',
    description: 'Milho Futuros (convertido para BRL)',
    unit: 'saca',
    sourceUrl: 'https://br.investing.com/commodities/us-corn-historical-data?cid=964522'
  },
  'soja': {
    name: 'Soja',
    currency: 'BRL',
    category: 'agricultural',
    description: 'Soja Futuros (convertido para BRL)',
    unit: 'saca',
    sourceUrl: 'https://br.investing.com/commodities/us-soybeans-historical-data?cid=964523'
  },
  'boi_gordo': {
    name: 'Boi Gordo',
    currency: 'BRL',
    category: 'agricultural',
    description: 'Preço da arroba (15kg) de Boi Gordo',
    unit: '@',
    sourceUrl: 'https://br.investing.com/commodities/live-cattle-historical-data?cid=964528'
  },

  // === COMMODITIES MATERIAIS ===
  'madeira': {
    name: 'Madeira',
    currency: 'BRL',
    category: 'material',
    description: 'Madeira Serrada (convertido para BRL)',
    unit: 'm³',
    sourceUrl: 'https://br.investing.com/commodities/lumber-historical-data'
  },
  'carbono': {
    name: 'Carbono',
    currency: 'BRL',
    category: 'material',
    description: 'Crédito de Carbono (convertido para BRL)',
    unit: 'Tonelada',
    sourceUrl: 'https://br.investing.com/commodities/carbon-emissions-historical-data'
  },

  // === ÍNDICES DE SUSTENTABILIDADE ===
  'ch2o_agua': {
    name: 'CH2O Água',
    currency: 'BRL',
    category: 'sustainability',
    description: 'Índice de uso da água baseado em commodities',
    unit: 'Pontos'
  },
  'custo_agua': {
    name: 'Custo Água',
    currency: 'BRL',
    category: 'sustainability',
    description: 'Custo do uso da água (7% de CH2O)',
    unit: 'BRL'
  },
  'pdm': {
    name: 'PDM',
    currency: 'BRL',
    category: 'sustainability',
    description: 'Potencial Desflorestador Monetizado',
    unit: 'BRL por PDM'
  },

  // === ÍNDICES CALCULADOS ===
  'ucs': {
    name: 'UCS',
    currency: 'BRL',
    category: 'calculated',
    description: 'Universal Carbon Sustainability',
    unit: 'Pontos'
  },
  'vus': {
    name: 'VUS',
    currency: 'BRL',
    category: 'calculated',
    description: 'Valor Universal Sustentável (commodities agrícolas)',
    unit: 'Pontos'
  },
  'vmad': {
    name: 'VMAD',
    currency: 'BRL',
    category: 'calculated',
    description: 'Valor da Madeira',
    unit: 'Pontos'
  },
  'valor_uso_solo': {
    name: 'Valor Uso Solo',
    currency: 'BRL',
    category: 'calculated',
    description: 'Valor total do uso do solo',
    unit: 'Pontos'
  },

  // === CRÉDITOS DE SUSTENTABILIDADE ===
  'carbono_crs': {
    name: 'Carbono CRS',
    currency: 'BRL',
    category: 'credit',
    description: 'Crédito de Carbono para Sustentabilidade',
    unit: 'Pontos'
  },
  'Agua_CRS': {
    name: 'Água CRS',
    currency: 'BRL',
    category: 'credit',
    description: 'Crédito de Água para Sustentabilidade',
    unit: 'Pontos'
  },

  // === ÍNDICE PRINCIPAL ===
  'ucs_ase': {
    name: 'Índice UCS ASE',
    currency: 'BRL',
    category: 'main-index',
    description: 'Índice principal de Unidade de Crédito de Sustentabilidade',
    unit: 'Pontos'
  }
};

/**
 * Salva configuração de commodity
 */
export async function saveCommodityConfig(id: string, config: Omit<CommodityConfig, 'id'>): Promise<void> {
  try {
    const { db } = await getFirebaseAdmin();
    const settingsDocRef = db.collection(COLLECTIONS.SETTINGS).doc(COLLECTIONS.COMMODITIES_DOC);
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(settingsDocRef);
      if (!doc.exists) {
        const initialData = { ...ASSETS_CONFIG, [id]: config };
        transaction.set(settingsDocRef, initialData);
      } else {
        transaction.update(settingsDocRef, { [id]: config });
      }
    });

    // Limpa cache de configurações
    setCache(CACHE_KEYS.COMMODITIES_CONFIG, null, 0);
  } catch (error) {
    console.error('Erro ao salvar configuração de commodity:', error);
    throw new Error('Falha ao salvar configuração do ativo.');
  }
}

/**
 * Atualiza configuração completa dos ativos
 */
export async function updateCalculatedAssetsConfig(): Promise<void> {
  try {
    const { db } = await getFirebaseAdmin();
    const docRef = db.collection(COLLECTIONS.SETTINGS).doc(COLLECTIONS.COMMODITIES_DOC);
    
    await docRef.set(ASSETS_CONFIG);
    setCache(CACHE_KEYS.COMMODITIES_CONFIG, null, 0);
    
    console.log('✅ Configuração completa dos ativos atualizada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao atualizar configuração dos ativos:', error);
    throw new Error('Falha ao atualizar configuração dos ativos.');
  }
}

/**
 * Obtém configurações de commodities com cache
 */
export async function getCommodityConfigs(): Promise<CommodityConfig[]> {
  // Verifica cache primeiro
  const cachedConfigs = getCache<CommodityConfig[]>(CACHE_KEYS.COMMODITIES_CONFIG);
  if (cachedConfigs) {
    return cachedConfigs;
  }
  
  try {
    const { db } = await getFirebaseAdmin();
    const docRef = db.collection(COLLECTIONS.SETTINGS).doc(COLLECTIONS.COMMODITIES_DOC);
    const doc = await docRef.get();

    let configData: Record<string, Omit<CommodityConfig, 'id'>>;

    if (!doc.exists || !doc.data()) {
      // Cria documento com configuração inicial se não existir
      configData = ASSETS_CONFIG;
      try {
        await docRef.set(configData);
        console.log('✅ Documento de configuração inicial criado');
      } catch (error) {
        console.error('❌ Falha ao criar documento de configuração inicial:', error);
      }
    } else {
      const data = doc.data();
      configData = data ? (data as Record<string, Omit<CommodityConfig, 'id'>>) : ASSETS_CONFIG;
    }
    
    // Converte para array e aplica configurações específicas
    const configsArray = Object.entries(configData).map(([id, config]) => ({
      id,
      ...config,
    }));
    
    // Aplica configurações específicas para alguns ativos
    const pdmAsset = configsArray.find(c => c.id === 'pdm');
    if (pdmAsset) {
      pdmAsset.description = "Potencial Desflorestador Monetizado";
    }

    const ucsAseAsset = configsArray.find(c => c.id === 'ucs_ase');
    if (ucsAseAsset) {
      ucsAseAsset.description = "Índice principal de Unidade de Crédito de Sustentabilidade";
    }

    // Cache por 10 minutos
    setCache(CACHE_KEYS.COMMODITIES_CONFIG, configsArray, CACHE_TTL.CONFIG);
    return configsArray;
    
  } catch (error) {
    console.error('Erro ao obter configurações de commodities:', error);
    throw new Error('Falha ao obter configurações dos ativos.');
  }
}

// --- DATA FETCHING SERVICES ---

/**
 * Obtém cotação de um ativo para uma data específica
 */
export async function getQuoteByDate(assetId: string, date: Date): Promise<FirestoreQuote | null> {
  try {
    const { db } = await getFirebaseAdmin();
    const formattedDate = format(date, 'dd/MM/yyyy');
    
    // Log específico para VMAD
    if (assetId === 'vmad' || assetId === 'Vmad') {
      console.log(`[getQuoteByDate] Buscando VMAD para data ${formattedDate}`);
    }
    
    // Busca por data exata primeiro
    const snapshot = await db.collection(assetId)
      .where('data', '==', formattedDate)
      .limit(1)
      .get();

    if (assetId === 'vmad' || assetId === 'Vmad') {
      console.log(`[getQuoteByDate] VMAD - Documentos encontrados para data exata:`, snapshot.size);
    }

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      if (assetId === 'vmad' || assetId === 'Vmad') {
        console.log(`[getQuoteByDate] VMAD - Documento encontrado:`, {
          id: doc.id,
          valor: data.valor,
          ultimo: data.ultimo,
          resultado_final_brl: data.resultado_final_brl,
          resultado_final: data.resultado_final,
          campos: Object.keys(data)
        });
      }
      return serializeFirestoreTimestamp({ id: doc.id, ...data }) as FirestoreQuote;
    }

    // Se não encontrou, busca o mais recente antes da data
    const historicalSnapshot = await db.collection(assetId)
      .where('timestamp', '<', Timestamp.fromDate(date))
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    
    if (assetId === 'vmad' || assetId === 'Vmad') {
      console.log(`[getQuoteByDate] VMAD - Documentos históricos encontrados:`, historicalSnapshot.size);
    }
    
    if (!historicalSnapshot.empty) {
      const doc = historicalSnapshot.docs[0];
      const data = doc.data();
      if (assetId === 'vmad' || assetId === 'Vmad') {
        console.log(`[getQuoteByDate] VMAD - Documento histórico encontrado:`, {
          id: doc.id,
          valor: data.valor,
          ultimo: data.ultimo,
          resultado_final_brl: data.resultado_final_brl,
          resultado_final: data.resultado_final,
          campos: Object.keys(data)
        });
      }
      return serializeFirestoreTimestamp({ id: doc.id, ...data }) as FirestoreQuote;
    }
    
    if (assetId === 'vmad' || assetId === 'Vmad') {
      console.log(`[getQuoteByDate] VMAD - Nenhum documento encontrado`);
    }
    
    return null;
  } catch (error) {
    console.error(`Erro ao buscar cotação para ${assetId} em ${format(date, 'dd/MM/yyyy')}:`, error);
    return null;
  }
}

/**
 * Calcula mudança percentual entre dois preços
 */
function calculatePriceChange(currentPrice: number, previousPrice: number): { change: number; absoluteChange: number } {
  const absoluteChange = currentPrice - previousPrice;
  const change = previousPrice !== 0 ? (absoluteChange / previousPrice) * 100 : 0;
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
        lastUpdated: displayDate
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
        : latestDoc?.data || 'N/A';

      return {
        ...config,
        price: latestPrice,
        change,
        absoluteChange,
        lastUpdated
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
  try {
    const { db } = await getFirebaseAdmin();
    
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
    throw new Error(`Falha ao obter o histórico para ${assetId}.`);
  }
}

/**
 * Obtém histórico de cotações por período
 */
export async function getCotacoesHistoricoPorRange(
  assetId: string, 
  dateRange: { from: Date, to: Date }
): Promise<FirestoreQuote[]> {
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

    return snapshot.docs.map(doc => 
      serializeFirestoreTimestamp({ id: doc.id, ...doc.data() })
    ) as FirestoreQuote[];

  } catch (error) {
    console.error(`Erro ao buscar histórico por período para ${assetId}:`, error);
    throw new Error(`Falha ao obter o histórico por período para ${assetId}.`);
  }
}

// --- CACHE MANAGEMENT ---

/**
 * Limpa cache e revalida páginas
 */
export async function clearCacheAndRefresh(): Promise<void> {
  clearMemoryCache();
  revalidatePath('/admin/audit', 'page');
  revalidatePath('/dashboard', 'page');
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
    
    // Limpa cache e revalida páginas
    clearMemoryCache();
    revalidatePath('/dashboard');
    revalidatePath('/admin/status');

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