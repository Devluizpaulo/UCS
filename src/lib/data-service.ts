

'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin-config';
import type { CommodityConfig, CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getCache, setCache, clearCache as clearMemoryCache } from '@/lib/cache-service';
import { Timestamp } from 'firebase-admin/firestore';
import { subDays, format, startOfDay, endOfDay, isValid, parseISO } from 'date-fns';
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

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// --- UTILITY FUNCTIONS ---

/**
 * Valida se um assetId é válido
 */
function validateAssetId(assetId: string): ValidationResult {
  const errors: string[] = [];
  
  if (!assetId || typeof assetId !== 'string') {
    errors.push('AssetId é obrigatório e deve ser uma string');
  } else if (assetId.trim().length === 0) {
    errors.push('AssetId não pode ser vazio');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(assetId)) {
    errors.push('AssetId deve conter apenas letras, números, hífens e underscores');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida se uma data é válida
 */
function validateDate(date: Date): ValidationResult {
  const errors: string[] = [];
  
  if (!date || !(date instanceof Date)) {
    errors.push('Data é obrigatória e deve ser uma instância de Date');
  } else if (isNaN(date.getTime())) {
    errors.push('Data deve ser válida');
  } else if (date > new Date()) {
    errors.push('Data não pode ser no futuro');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Converte strings formatadas brasileiras para números
 */
function parseBrazilianNumber(value: any): number {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  
  if (typeof value === 'string') {
    try {
      // Remove pontos de milhar, substitui vírgula por ponto
      const cleanValue = value.replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(cleanValue);
      return isNaN(parsed) ? 0 : parsed;
    } catch (error) {
      return 0;
    }
  }
  
  return 0;
}

/**
 * Normaliza dados de qualquer ativo que podem ter formatação brasileira
 */
function normalizeAssetData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  try {
    const normalized = { ...data };
    const numericFields = [
      'valor', 'ultimo', 'abertura', 'maxima', 'minima', 'fechamento_anterior',
      'valor_brl', 'valor_eur', 'valor_usd', 'resultado_final_brl', 'resultado_final_usd', 'resultado_final_eur',
      'ton', 'vol', 'volume', 'variacao_pct', 'rent_media', 'variacao_abs'
    ];
    
    for (const field of numericFields) {
      if (normalized[field] !== undefined && normalized[field] !== null) {
        normalized[field] = parseBrazilianNumber(normalized[field]);
      }
    }
    
    if (normalized.componentes && typeof normalized.componentes === 'object') {
      const normalizedComponents: { [key: string]: number } = {};
      for (const [key, value] of Object.entries(normalized.componentes)) {
        normalizedComponents[key] = parseBrazilianNumber(value);
      }
      normalized.componentes = normalizedComponents;
    }
    
    if (normalized.valores_originais && typeof normalized.valores_originais === 'object') {
      const normalizedOriginals: { [key: string]: any } = {};
      for (const [key, value] of Object.entries(normalized.valores_originais)) {
        // Tenta converter para número se parecer um número, senão mantém como está
        if (typeof value === 'string' && /^[0-9.,-]+$/.test(value)) {
           normalizedOriginals[key] = parseBrazilianNumber(value);
        } else {
           normalizedOriginals[key] = value;
        }
      }
      normalized.valores_originais = normalizedOriginals;
    }
    
    if (normalized.conversoes && typeof normalized.conversoes === 'object') {
      const normalizedConversions: { [key: string]: any } = {};
      for (const [key, value] of Object.entries(normalized.conversoes)) {
        normalizedConversions[key] = value;
      }
      normalized.conversoes = normalizedConversions;
    }
    
    // Prioriza `ultimo_brl` para ativos como soja e carbono
    if (data.id === 'soja' || data.id === 'carbono') {
        if (normalized.ultimo_brl !== undefined && normalized.ultimo_brl > 0) {
            normalized.valor = normalized.ultimo_brl;
        }
    }
    
    return normalized;
  } catch (error) {
    return data;
  }
}


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

  try {
    const normalizedData = normalizeAssetData(quoteData);

    const priceFields = [
      { field: 'valor_brl', source: 'valor_brl (ucs_ase)' },
      { field: 'ultimo_brl', source: 'ultimo_brl (forex)' },
      { field: 'resultado_final_brl', source: 'resultado_final_brl (ucs_ase)' },
      { field: 'valor', source: 'valor (padrão)' },
      { field: 'ultimo', source: 'ultimo (padrão)' },
      { field: 'componentes.resultado_final_brl', source: 'componentes.resultado_final_brl (ucs_ase)' },
    ];

    for (const { field, source } of priceFields) {
      let value: any;
      
      if (field.includes('.')) {
        const parts = field.split('.');
        value = normalizedData;
        for (const part of parts) {
          if (value && typeof value === 'object') {
            value = value[part];
          } else {
            value = undefined;
            break;
          }
        }
      } else {
        value = normalizedData[field];
      }
      
      if (typeof value === 'number' && !isNaN(value) && value > 0) {
        return { price: value, source };
      }
    }
    
    return { price: 0, source: 'none' };
  } catch (error) {
    return { price: 0, source: 'error' };
  }
}


/**
 * Detecta a frequência das cotações baseado na data de transição
 */
export async function detectQuoteFrequency(quotes: FirestoreQuote[]): Promise<{
  frequency: 'monthly' | 'daily' | 'mixed';
  transitionDate: Date | null;
  monthlyCount: number;
  dailyCount: number;
}> {
  if (!quotes || quotes.length === 0) {
    return { frequency: 'monthly', transitionDate: null, monthlyCount: 0, dailyCount: 0 };
  }

  const transitionDate = new Date('2025-10-02');
  const monthlyQuotes: FirestoreQuote[] = [];
  const dailyQuotes: FirestoreQuote[] = [];

  quotes.forEach(quote => {
    if (!quote.timestamp) return;
    
    try {
      const quoteDate = new Date(quote.timestamp as any);
      if (quoteDate < transitionDate) {
        monthlyQuotes.push(quote);
      } else {
        dailyQuotes.push(quote);
      }
    } catch (error) {
      console.warn('Erro ao processar timestamp da cotação:', error);
    }
  });

  const monthlyCount = monthlyQuotes.length;
  const dailyCount = dailyQuotes.length;

  let frequency: 'monthly' | 'daily' | 'mixed';
  if (monthlyCount > 0 && dailyCount > 0) {
    frequency = 'mixed';
  } else if (dailyCount > 0) {
    frequency = 'daily';
  } else {
    frequency = 'monthly';
  }

  return {
    frequency,
    transitionDate: monthlyCount > 0 && dailyCount > 0 ? transitionDate : null,
    monthlyCount,
    dailyCount
  };
}

/**
 * Calcula métricas de performance considerando a frequência das cotações
 */
export async function calculateFrequencyAwareMetrics(quotes: FirestoreQuote[], assetId: string): Promise<{
  metrics: any;
  frequency: 'monthly' | 'daily' | 'mixed';
  transitionDate: Date | null;
  monthlyCount: number;
  dailyCount: number;
}> {
  const frequencyInfo = await detectQuoteFrequency(quotes);
  
  const sortedQuotes = [...quotes].sort((a, b) => {
    const dateA = new Date(a.timestamp as any);
    const dateB = new Date(b.timestamp as any);
    return dateA.getTime() - dateB.getTime();
  });

  if (sortedQuotes.length < 2) {
    return {
      metrics: null,
      ...frequencyInfo
    };
  }
  
  const prices = sortedQuotes
    .map(quote => extractPriceFromQuote(quote).price)
    .filter((price): price is number => price !== undefined && price > 0);
    
  if (prices.length < 2) {
    return {
      metrics: null,
      ...frequencyInfo
    };
  }
  
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  
  const totalReturn = ((lastPrice - firstPrice) / firstPrice) * 100;
  
  const periodicReturns = [];
  for (let i = 1; i < prices.length; i++) {
    const periodicReturn = ((prices[i] - prices[i-1]) / prices[i-1]);
    periodicReturns.push(periodicReturn);
  }
  
  const avgReturn = periodicReturns.reduce((sum, ret) => sum + ret, 0) / periodicReturns.length;
  const variance = periodicReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / periodicReturns.length;
  const stdDev = Math.sqrt(variance);

  // Annualize volatility based on frequency
  let volatility: number;
  let annualizedReturn: number;
  
  if (frequencyInfo.frequency === 'monthly') {
    volatility = stdDev * Math.sqrt(12);
    annualizedReturn = avgReturn * 12;
  } else { // daily or mixed, treat as daily for conservative volatility
    volatility = stdDev * Math.sqrt(252);
    annualizedReturn = avgReturn * 252;
  }
  
  let maxDrawdown = 0;
  let peak = prices[0];
  
  for (const price of prices) {
    if (price > peak) {
      peak = price;
    }
    const drawdown = ((peak - price) / peak);
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  // Assuming a simplified annual risk-free rate of 2%
  const riskFreeRate = 0.02;
  const sharpeRatio = volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;
  
  const metrics = {
    totalReturn,
    volatility: volatility * 100, // as percentage
    maxDrawdown: maxDrawdown * 100, // as percentage
    sharpeRatio,
    high: maxPrice,
    low: minPrice,
    currentPrice: lastPrice,
    firstPrice,
    totalDays: quotes.length,
    avgPeriodicReturn: avgReturn * 100,
    frequency: frequencyInfo.frequency
  };
  
  return {
    metrics,
    ...frequencyInfo
  };
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
        let dateToFormat: Date;
        if (timestamp instanceof Timestamp) {
            dateToFormat = timestamp.toDate();
        } else if (typeof timestamp === 'number') {
            dateToFormat = new Date(timestamp);
        } else if (typeof timestamp === 'string') {
            dateToFormat = parseISO(timestamp);
        } else if (timestamp && typeof timestamp.toDate === 'function') {
            dateToFormat = timestamp.toDate();
        } else {
            throw new Error('Invalid timestamp format');
        }
        
        if (isValid(dateToFormat)) {
            return format(dateToFormat, "HH:mm:ss");
        }
    } catch (error) {
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
      const fallbackConfigs: CommodityConfig[] = [
        { id: 'PDM', name: 'PDM', category: 'index', description: 'Potencial Desflorestador Monetizado', currency: 'BRL', unit: 'Pontos' },
        { id: 'milho', name: 'Milho', category: 'agricultural', description: 'Commodity agrícola', currency: 'BRL', unit: 'R$/ton' },
        { id: 'boi_gordo', name: 'Boi Gordo', category: 'agricultural', description: 'Commodity pecuária', currency: 'BRL', unit: 'R$/arroba' },
        { id: 'madeira', name: 'Madeira', category: 'material', description: 'Commodity material', currency: 'BRL', unit: 'R$/m³' },
        { id: 'carbono', name: 'Carbono', category: 'sustainability', description: 'Commodity ambiental', currency: 'EUR', unit: '€/tCO₂' },
        { id: 'soja', name: 'Soja', category: 'agricultural', description: 'Commodity agrícola', currency: 'BRL', unit: 'R$/ton' }
      ];
      setCache(CACHE_KEYS.COMMODITIES_CONFIG, fallbackConfigs, CACHE_TTL.CONFIG);
      return fallbackConfigs;
    }
    
    const configData = doc.data() as Record<string, Omit<CommodityConfig, 'id'>>;
    const configsArray: CommodityConfig[] = Object.entries(configData).map(([id, config]) => ({
      id,
      ...config,
    }));
    
    setCache(CACHE_KEYS.COMMODITIES_CONFIG, configsArray, CACHE_TTL.CONFIG);
    return configsArray;
    
  } catch (error) {
    const fallbackConfigs: CommodityConfig[] = [
      { id: 'PDM', name: 'PDM', category: 'index', description: 'Potencial Desflorestador Monetizado', currency: 'BRL', unit: 'Pontos' },
      { id: 'milho', name: 'Milho', category: 'agricultural', description: 'Commodity agrícola', currency: 'BRL', unit: 'R$/ton' },
      { id: 'boi_gordo', name: 'Boi Gordo', category: 'agricultural', description: 'Commodity pecuária', currency: 'BRL', unit: 'R$/arroba' },
      { id: 'madeira', name: 'Madeira', category: 'material', description: 'Commodity material', currency: 'BRL', unit: 'R$/m³' },
      { id: 'carbono', name: 'Carbono', category: 'sustainability', description: 'Commodity ambiental', currency: 'EUR', unit: '€/tCO₂' },
      { id: 'soja', name: 'Soja', category: 'agricultural', description: 'Commodity agrícola', currency: 'BRL', unit: 'R$/ton' }
    ];
    return fallbackConfigs;
  }
}

// --- DATA FETCHING SERVICES ---

/**
 * Verifica especificamente os dados necessários para a página de composition
 */
export async function checkCompositionData(targetDate: Date): Promise<{
  valor_uso_solo: any | null;
  PDM: any | null;
  ucs_ase: any | null;
  availableCollections: string[];
  recommendations: string[];
}> {
  const { db } = await getFirebaseAdmin();
  const formattedDate = format(targetDate, 'dd/MM/yyyy');
  
  const result: {
    valor_uso_solo: any | null;
    PDM: any | null;
    ucs_ase: any | null;
    availableCollections: string[];
    recommendations: string[];
  } = {
    valor_uso_solo: null,
    PDM: null,
    ucs_ase: null,
    availableCollections: [],
    recommendations: []
  };
  
  try {
    const collectionsSnapshot = await db.listCollections();
    const allCollections = collectionsSnapshot.map(col => col.id);
    result.availableCollections = allCollections;
    
    const requiredCollections = ['valor_uso_solo', 'PDM', 'ucs_ase'];
    
    for (const collectionId of requiredCollections) {
      if (!allCollections.includes(collectionId)) {
        result.recommendations.push(`Criar coleção ${collectionId}`);
        continue;
      }
      
      try {
        const snapshot = await db.collection(collectionId)
          .where('data', '==', formattedDate)
          .limit(1)
          .get();
        
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const rawData = doc.data();
          const serializedData = serializeFirestoreTimestamp(rawData);
          result[collectionId as keyof typeof result] = {
            id: doc.id,
            data: serializedData.data,
            valor: serializedData.valor,
            componentes: serializedData.componentes,
            hasRequiredFields: !!(serializedData.valor && serializedData.componentes)
          };
        } else {
          const historicalSnapshot = await db.collection(collectionId)
            .orderBy('data', 'desc')
            .limit(5)
            .get();
          
          if (!historicalSnapshot.empty) {
            const latestDoc = historicalSnapshot.docs[0];
            const rawData = latestDoc.data();
            const serializedData = serializeFirestoreTimestamp(rawData);
            result[collectionId as keyof typeof result] = {
              id: latestDoc.id,
              data: serializedData.data,
              valor: serializedData.valor,
              componentes: serializedData.componentes,
              hasRequiredFields: !!(serializedData.valor && serializedData.componentes),
              isHistorical: true
            };
            result.recommendations.push(`Importar dados para ${collectionId} na data ${formattedDate}`);
          } else {
            result.recommendations.push(`Importar dados para ${collectionId}`);
          }
        }
      } catch (error) {
        result.recommendations.push(`Corrigir estrutura de dados em ${collectionId}`);
      }
    }
    
    const hasAnyData = result.valor_uso_solo || result.PDM || result.ucs_ase;
    if (!hasAnyData) {
      result.recommendations.push('Nenhum dado encontrado. Verificar processo de importação.');
    }
    
    return result;
    
  } catch (error) {
    result.recommendations.push('Erro ao verificar dados. Verificar conexão com Firestore.');
    return result;
  }
}

/**
 * Busca dados de composition com componentes válidos
 */
export async function getCompositionHistoricalData(limit: number = 50): Promise<FirestoreQuote[]> {
  const { db } = await getFirebaseAdmin();
  
  try {
    const collections = ['valor_uso_solo', 'pdm', 'ucs_ase'];
    const allData: FirestoreQuote[] = [];
    
    for (const collection of collections) {
      
      const snapshot = await db.collection(collection)
        .orderBy('data', 'desc')
        .limit(limit)
        .get();
      
      if (!snapshot.empty) {
        for (const doc of snapshot.docs) {
          const rawData = doc.data();
          const serializedData = serializeFirestoreTimestamp(rawData);
          
          if (serializedData.valores_originais && serializedData.porcentagens && serializedData.valor) {
            allData.push({ id: doc.id, ...serializedData } as FirestoreQuote);
          }
        }
      }
    }
    
    allData.sort((a, b) => {
      const dateA = new Date(a.data.split('/').reverse().join('-'));
      const dateB = new Date(b.data.split('/').reverse().join('-'));
      return dateB.getTime() - dateA.getTime();
    });
    
    return allData.slice(0, limit);
    
  } catch (error) {
    return [];
  }
}

export async function getCompositionDataWithComponents(targetDate: Date): Promise<FirestoreQuote | null> {
  const { db } = await getFirebaseAdmin();
  
  try {
    
    const collections = ['valor_uso_solo', 'pdm', 'ucs_ase'];
    
    for (const collection of collections) {
      
      let result = await getQuoteByDate(collection, targetDate);
      
      if (result && result.valores_originais && result.porcentagens) {
        return result;
      }
      
      const snapshot = await db.collection(collection)
        .orderBy('data', 'desc')
        .limit(50) // Buscar os 50 mais recentes
        .get();
      
      if (!snapshot.empty) {
        for (const doc of snapshot.docs) {
          const rawData = doc.data();
          const serializedData = serializeFirestoreTimestamp(rawData);
          
          if (serializedData.valores_originais && serializedData.porcentagens && serializedData.valor) {
            return { id: doc.id, ...serializedData } as FirestoreQuote;
          }
        }
      }
    }
    
    return null;
    
  } catch (error) {
    return null;
  }
}

/**
 * Cria dados de teste para a página de composition
 */
export async function createTestCompositionData(targetDate: Date): Promise<{ success: boolean; error?: string }> {
  const { db } = await getFirebaseAdmin();
  const formattedDate = format(targetDate, 'dd/MM/yyyy');
  
  try {
    
    const testData = {
      data: formattedDate,
      valor: 308762.15,
      componentes: {
        vus: 76495.74,
        vmad: 189610.56,
        carbono_crs: 1461.19,
        agua_crs: 41194.67
      },
      variacao_pct: 2.5,
      variacao_abs: 25,
      timestamp: new Date(),
      fonte: 'Dados de Teste',
      status: 'sucesso'
    };
    
    await db.collection('valor_uso_solo').add(testData);
    
    const pdmTestData = {
      data: formattedDate,
      valor: 1200,
      componentes: {
        boi_gordo_35: 420,
        milho_30: 360,
        soja_35: 420,
        madeira_100: 300,
        carbono_100: 100,
        custo_agua_100: 100
      },
      variacao_pct: 1.8,
      variacao_abs: 21.6,
      timestamp: new Date(),
      fonte: 'Dados de Teste PDM',
      status: 'sucesso'
    };
    
    await db.collection('PDM').add(pdmTestData);
    
    return { success: true };
    
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

/**
 * Função de debug para verificar dados disponíveis no Firestore
 */
export async function debugFirestoreData(): Promise<{
  collections: string[];
  sampleData: Record<string, any[]>;
  dateRange: Record<string, { earliest: string; latest: string; count: number }>;
}> {
  const { db } = await getFirebaseAdmin();
  
  try {
    
    const collectionsSnapshot = await db.listCollections();
    const collections = collectionsSnapshot.map(col => col.id);
    
    const sampleData: Record<string, any[]> = {};
    const dateRange: Record<string, { earliest: string; latest: string; count: number }> = {};
    
    for (const collectionId of collections) {
      try {
        const snapshot = await db.collection(collectionId).limit(5).get();
        const docs = snapshot.docs.map(doc => {
          const rawData = doc.data();
          const serializedData = serializeFirestoreTimestamp(rawData);
          return {
            id: doc.id,
            ...serializedData
          };
        });
        
        sampleData[collectionId] = docs;
        
        const dateSnapshot = await db.collection(collectionId)
          .orderBy('data', 'asc')
          .limit(1)
          .get();
        
        const latestSnapshot = await db.collection(collectionId)
          .orderBy('data', 'desc')
          .limit(1)
          .get();
        
        const countSnapshot = await db.collection(collectionId).get();
        
        dateRange[collectionId] = {
          earliest: dateSnapshot.empty ? 'N/A' : dateSnapshot.docs[0].data().data || 'N/A',
          latest: latestSnapshot.empty ? 'N/A' : latestSnapshot.docs[0].data().data || 'N/A',
          count: countSnapshot.size
        };
        
      } catch (error) {
        sampleData[collectionId] = [];
        dateRange[collectionId] = { earliest: 'Error', latest: 'Error', count: 0 };
      }
    }
    
    return {
      collections,
      sampleData,
      dateRange
    };
    
  } catch (error) {
    return {
      collections: [],
      sampleData: {},
      dateRange: {}
    };
  }
}

/**
 * Obtém cotação de um ativo para uma data específica
 */
export async function getQuoteByDate(assetId: string, date: Date): Promise<FirestoreQuote | null> {
  const assetValidation = validateAssetId(assetId);
  if (!assetValidation.isValid) {
    return null;
  }
  
  const dateValidation = validateDate(date);
  if (!dateValidation.isValid) {
    return null;
  }
  
  const { db } = await getFirebaseAdmin();
  const formattedDate = format(date, 'dd/MM/yyyy');
  
  try {
    
    const snapshot = await db.collection(assetId)
      .where('data', '==', formattedDate)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const rawData = doc.data();
      const normalizedData = normalizeAssetData(rawData);
      const result = serializeFirestoreTimestamp({ id: doc.id, ...normalizedData }) as FirestoreQuote;
      return result;
    }
    
    // Fallback: se não encontrar na data exata, busca a mais recente ANTERIOR à data
    const historicalSnapshot = await db.collection(assetId)
      .where('data', '<', formattedDate) // Busca datas estritamente menores
      .orderBy('data', 'desc')
      .limit(1)
      .get();
      
    if (!historicalSnapshot.empty) {
        const doc = historicalSnapshot.docs[0];
        const rawData = doc.data();
        const normalizedData = normalizeAssetData(rawData);
        const result = serializeFirestoreTimestamp({ id: doc.id, ...normalizedData }) as FirestoreQuote;
        return result;
    }

    return null;
  } catch (error) {
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
      
      if (config.id === 'ucs_ase' && latestDoc) {
        return {
          ...config,
          price: latestDoc.valor_brl || latestPrice,
          valor_usd: latestDoc.valor_usd,
          valor_eur: latestDoc.valor_eur,
          valores_originais: latestDoc.valores_originais,
          change,
          absoluteChange,
          lastUpdated: latestDoc?.data || displayDate,
        };
      }
      
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
      
      if (config.id === 'ucs_ase' && latestDoc) {
        return {
          ...config,
          price: latestDoc.valor_brl || latestPrice,
          valor_usd: latestDoc.valor_usd,
          valor_eur: latestDoc.valor_eur,
          valores_originais: latestDoc.valores_originais,
          change,
          absoluteChange,
          lastUpdated: lastUpdated,
        };
      }

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
    throw new Error("Falha ao obter as cotações mais recentes.");
  }
}

/**
 * Obtém histórico de cotações para um ativo
 */
export async function getCotacoesHistorico(assetId: string, days: number): Promise<FirestoreQuote[]> {
  const assetValidation = validateAssetId(assetId);
  if (!assetValidation.isValid) {
    return [];
  }
  
  if (typeof days !== 'number' || days <= 0 || days > 3650) {
    return [];
  }
  
  const { db } = await getFirebaseAdmin();
  try {
    
    const snapshot = await db.collection(assetId)
      .orderBy('timestamp', 'desc')
      .limit(days)
      .get();

    if (snapshot.empty) {
      return [];
    }
    
    const results = snapshot.docs.map(doc => {
      const rawData = doc.data();
      const normalizedData = normalizeAssetData(rawData);
      return serializeFirestoreTimestamp({ id: doc.id, ...normalizedData });
    }) as FirestoreQuote[];

    return results;

  } catch (error) {
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

    return snapshot.docs.map(doc => {
      const rawData = doc.data();
      const normalizedData = normalizeAssetData(rawData);
      return serializeFirestoreTimestamp({ id: doc.id, ...normalizedData });
    }) as FirestoreQuote[];

  } catch (error) {
    return [];
  }
}

// --- CACHE MANAGEMENT ---

/**
 * Limpa cache e revalida páginas
 */
export async function clearCacheAndRefresh(): Promise<void> {
  try {
    clearMemoryCache();
    revalidatePath('/dashboard');
    revalidatePath('/analysis/trends');
    revalidatePath('/analysis/composition');
  } catch (error) {
  }
}

// --- DEBUG SERVICES ---

/**
 * Analisa dados do UCS ASE para identificar inconsistências
 */
export async function analyzeUCSASEData(): Promise<any> {
  try {
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentData = await getCotacoesHistorico('ucs_ase', 10);
    
    const analysis = {
      totalRecords: recentData.length,
      dataVariations: [] as any[],
      typeInconsistencies: [] as any[],
      structureDifferences: [] as any[]
    };
    
    recentData.forEach((record, index) => {
      const variations: any = {
        index,
        timestamp: record.timestamp,
        data: record.data,
        hasBulkImport: 'bulk_import' in record,
        hasConversions: 'conversoes' in record,
        moedasType: Array.isArray(record.moedas) ? 'array' : typeof record.moedas,
        valorBrlType: typeof record.valor_brl,
        valorEurType: typeof record.valor_eur,
        valorUsdType: typeof record.valor_usd
      };
      
      analysis.dataVariations.push(variations);
      
      if (typeof record.valor_eur === 'string') {
        analysis.typeInconsistencies.push({
          field: 'valor_eur',
          value: record.valor_eur,
          type: 'string',
          index
        });
      }
      
      if (!Array.isArray(record.moedas) && record.moedas) {
        analysis.structureDifferences.push({
          field: 'moedas',
          type: 'object',
          value: record.moedas,
          index
        });
      }
    });
    
    return analysis;
    
  } catch (error: any) {
    return { error: error?.message || 'Erro desconhecido' };
  }
}

/**
 * Função de debug para testar busca de dados
 */
export async function debugDataFetching(): Promise<any> {
  try {
    
    const testAssets = ['PDM', 'milho', 'boi_gordo', 'madeira', 'carbono', 'soja'];
    const today = new Date();
    const results: any = {};
    
    for (const assetId of testAssets) {
      
      const currentQuote = await getQuoteByDate(assetId, today);
      results[assetId] = {
        currentQuote: currentQuote ? 'Found' : 'Not Found',
        hasData: !!currentQuote,
        hasComponentes: !!(currentQuote?.componentes),
        hasValor: !!(currentQuote?.valor),
        timestamp: currentQuote?.timestamp || null
      };
      
      const history = await getCotacoesHistorico(assetId, 30);
      results[assetId].historyCount = history.length;
      results[assetId].hasHistory = history.length > 0;
      
      if (currentQuote) {
      } else {
      }
    }
    
    return results;
    
  } catch (error: any) {
    return { error: error?.message || 'Erro desconhecido' };
  }
}

// --- WEBHOOK SERVICES ---

/**
 * Reprocessa dados de uma data específica via webhook
 */
export async function reprocessDate(date: Date): Promise<{ success: boolean; message: string }> {
  const webhookUrl = process.env.N8N_REPROCESS_WEBHOOK_URL;
  
  if (!webhookUrl) {
    const errorMessage = "A URL do webhook de reprocessamento não está configurada no servidor.";
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
    return { 
      success: false, 
      message: error.message || "Ocorreu um erro desconhecido ao tentar reprocessar a data." 
    };
  }
}

    