

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
 * Ex: "1.312.50" -> 1312.50, "172.983.64" -> 172983.64
 */
function parseBrazilianNumber(value: any): number {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  
  if (typeof value === 'string') {
    try {
      // Remove pontos (separadores de milhares) e converte vírgula em ponto decimal
      const cleanValue = value.replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(cleanValue);
      return isNaN(parsed) ? 0 : parsed;
    } catch (error) {
      console.warn(`[parseBrazilianNumber] Erro ao parsear valor: "${value}"`, error);
      return 0;
    }
  }
  
  return 0;
}

/**
 * Normaliza dados de qualquer ativo que podem ter formatação brasileira
 * Lida com diferenças entre modelos Python e N8N
 */
function normalizeAssetData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  try {
    const normalized = { ...data };
    
    // Campos numéricos principais que podem estar formatados
    const mainNumericFields = [
      'valor', 'ultimo', 'abertura', 'maxima', 'minima', 'fechamento_anterior',
      'valor_brl', 'valor_eur', 'valor_usd', 'resultado_final_brl', 'resultado_final_usd', 'resultado_final_eur',
      'ton', 'vol', 'volume', 'variacao_pct', 'rent_media', 'variacao_abs'
    ];
    
    // Normalizar campos numéricos principais
    for (const field of mainNumericFields) {
      if (normalized[field] !== undefined && normalized[field] !== null) {
        const originalValue = normalized[field];
        normalized[field] = parseBrazilianNumber(originalValue);
        
        // Log se houve transformação significativa
        if (typeof originalValue === 'string' && normalized[field] !== 0) {
          console.debug(`[normalizeAssetData] Normalizado ${field}: "${originalValue}" -> ${normalized[field]}`);
        }
      }
    }
    
    // Normalizar componentes (PDM, UCS, etc.)
    if (normalized.componentes && typeof normalized.componentes === 'object') {
      const normalizedComponents: { [key: string]: number } = {};
      for (const [key, value] of Object.entries(normalized.componentes)) {
        const originalValue = value;
        const normalizedValue = parseBrazilianNumber(value);
        normalizedComponents[key] = normalizedValue;
        
        // Log se houve transformação
        if (typeof originalValue === 'string' && normalizedValue !== 0) {
          console.debug(`[normalizeAssetData] Componente ${key}: "${originalValue}" -> ${normalizedValue}`);
        }
      }
      normalized.componentes = normalizedComponents;
    }
    
    // Normalizar valores originais
    if (normalized.valores_originais && typeof normalized.valores_originais === 'object') {
      const normalizedOriginals: { [key: string]: any } = {}; // Permitir strings e números
      for (const [key, value] of Object.entries(normalized.valores_originais)) {
        // Tentar normalizar apenas se for um número provável em string
        if (typeof value === 'string' && /[\d.,]/.test(value)) {
           normalizedOriginals[key] = parseBrazilianNumber(value);
        } else {
           normalizedOriginals[key] = value;
        }
      }
      normalized.valores_originais = normalizedOriginals;
    }
    
    // Normalizar conversões (UCS ASE)
    if (normalized.conversoes && typeof normalized.conversoes === 'object') {
      const normalizedConversions: { [key: string]: any } = {};
      for (const [key, value] of Object.entries(normalized.conversoes)) {
        normalizedConversions[key] = value; // Manter como string, pois contém a fórmula
      }
      normalized.conversoes = normalizedConversions;
    }
    
    // Normalizar moedas (pode ser array ou object)
    if (normalized.moedas) {
      if (Array.isArray(normalized.moedas)) {
        // Manter como array se já for array
        normalized.moedas = normalized.moedas;
      } else if (typeof normalized.moedas === 'object') {
        // Converter object para array se necessário
        normalized.moedas = Object.values(normalized.moedas);
      }
    }
    
    // Normalizar campos específicos do UCS ASE
    const ucsAseFields = ['valor_brl', 'valor_eur', 'valor_usd', 'resultado_final_brl', 'resultado_final_eur', 'resultado_final_usd'];
    for (const field of ucsAseFields) {
      if (normalized[field] !== undefined && normalized[field] !== null) {
        const originalValue = normalized[field];
        normalized[field] = parseBrazilianNumber(originalValue);
        
        // Log se houve transformação significativa
        if (typeof originalValue === 'string' && normalized[field] !== 0) {
          console.debug(`[normalizeAssetData] UCS ASE ${field}: "${originalValue}" -> ${normalized[field]}`);
        }
      }
    }
    
    return normalized;
  } catch (error) {
    console.error(`[normalizeAssetData] Erro ao normalizar dados:`, error);
    return data; // Retorna dados originais em caso de erro
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
 * Agora lida com dados formatados brasileiros (strings com pontos/vírgulas)
 */
function extractPriceFromQuote(quoteData: any): PriceExtractionResult {
  if (!quoteData) {
    return { price: 0, source: 'none' };
  }

  try {
    // Normalizar dados primeiro para lidar com formatação brasileira
    const normalizedData = normalizeAssetData(quoteData);

    // Ordem de prioridade para extração do preço
    // Para UCS ASE, priorizar valor_brl, valor_eur, valor_usd
    const priceFields = [
      { field: 'valor_brl', source: 'valor_brl (ucs_ase)' },
      { field: 'resultado_final_brl', source: 'resultado_final_brl (ucs_ase)' },
      { field: 'valor', source: 'valor (padrão)' },
      { field: 'ultimo', source: 'ultimo (padrão)' },
      { field: 'componentes.resultado_final_brl', source: 'componentes.resultado_final_brl (ucs_ase)' },
    ];

    for (const { field, source } of priceFields) {
      let value: any;
      
      // Lidar com campos aninhados (ex: componentes.valor_brl)
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
        console.debug(`[extractPriceFromQuote] Preço encontrado em ${field}: ${value}`);
        return { price: value, source };
      }
    }
    
    // Log quando não encontra preço válido
    console.warn(`[extractPriceFromQuote] Nenhum preço válido encontrado para cotação:`, {
      hasValor: !!normalizedData.valor,
      hasUltimo: !!normalizedData.ultimo,
      hasValorBrl: !!normalizedData.valor_brl,
      hasResultadoFinal: !!normalizedData.resultado_final_brl,
      hasComponentes: !!normalizedData.componentes
    });

    return { price: 0, source: 'none' };
  } catch (error) {
    console.error(`[extractPriceFromQuote] Erro ao extrair preço:`, error);
    return { price: 0, source: 'error' };
  }
}


/**
 * Detecta a frequência das cotações baseado na data de transição
 * Até 01/10/2025: cotações mensais (todo dia 01)
 * A partir de 02/10/2025: cotações diárias (segunda a sexta)
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
  
  if (quotes.length < 2) {
    return {
      metrics: null,
      ...frequencyInfo
    };
  }
  
  const prices = quotes
    .map(quote => {
      if (assetId === 'ucs_ase') {
        // Para UCS ASE, usar valor_brl como principal, com fallbacks
        const value = quote.valor_brl ?? quote.resultado_final_brl ?? quote.valor_eur ?? quote.valor_usd;
        return typeof value === 'number' ? value : undefined;
      }
      const value = quote.valor ?? quote.ultimo;
      return typeof value === 'number' ? value : undefined;
    })
    .filter((price): price is number => price !== undefined);
    
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
  
  // Calcular retorno total
  const totalReturn = ((lastPrice - firstPrice) / firstPrice) * 100;
  
  // Calcular retornos periódicos baseado na frequência
  const periodicReturns = [];
  for (let i = 1; i < prices.length; i++) {
    const periodicReturn = ((prices[i] - prices[i-1]) / prices[i-1]) * 100;
    periodicReturns.push(periodicReturn);
  }
  
  const avgReturn = periodicReturns.reduce((sum, ret) => sum + ret, 0) / periodicReturns.length;
  const variance = periodicReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / periodicReturns.length;
  
  // Ajustar volatilidade baseado na frequência
  let volatility: number;
  if (frequencyInfo.frequency === 'monthly') {
    // Para dados mensais, converter para volatilidade anual
    volatility = Math.sqrt(variance) * Math.sqrt(12);
  } else if (frequencyInfo.frequency === 'daily') {
    // Para dados diários, converter para volatilidade anual
    volatility = Math.sqrt(variance) * Math.sqrt(252);
  } else {
    // Para dados mistos, usar volatilidade ponderada
    const monthlyVol = Math.sqrt(variance) * Math.sqrt(12);
    const dailyVol = Math.sqrt(variance) * Math.sqrt(252);
    volatility = (monthlyVol + dailyVol) / 2;
  }
  
  // Calcular máximo drawdown
  let maxDrawdown = 0;
  let peak = prices[0];
  
  for (const price of prices) {
    if (price > peak) {
      peak = price;
    }
    const drawdown = ((peak - price) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  // Calcular Sharpe Ratio ajustado pela frequência
  const riskFreeRate = frequencyInfo.frequency === 'monthly' ? 0.5 : 0.1; // Taxa livre de risco ajustada
  const excessReturn = avgReturn - riskFreeRate;
  const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;
  
  const metrics = {
    totalReturn,
    volatility,
    maxDrawdown,
    sharpeRatio,
    high: maxPrice,
    low: minPrice,
    currentPrice: lastPrice,
    firstPrice,
    totalDays: quotes.length,
    avgPeriodicReturn: avgReturn,
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
        // Silently fail but log for debugging
        // console.warn('Erro ao formatar timestamp:', error, 'Valor original:', timestamp);
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
    console.log('✅ [getCommodityConfigs] Configurações encontradas no cache:', cachedConfigs.length);
    return cachedConfigs;
  }
  
  const { db } = await getFirebaseAdmin();
  const docRef = db.collection(COLLECTIONS.SETTINGS).doc(COLLECTIONS.COMMODITIES_DOC);
  
  try {
    console.log('🔍 [getCommodityConfigs] Buscando configurações no Firestore...');
    const doc = await docRef.get();
    if (!doc.exists) {
      console.warn("⚠️ [getCommodityConfigs] Documento de configuração não encontrado. Usando fallback.");
      
      // Fallback com configurações básicas
      const fallbackConfigs: CommodityConfig[] = [
        { id: 'PDM', name: 'PDM', category: 'index', description: 'Potencial Desflorestador Monetizado', currency: 'BRL', unit: 'Pontos' },
        { id: 'milho', name: 'Milho', category: 'agricultural', description: 'Commodity agrícola', currency: 'BRL', unit: 'R$/ton' },
        { id: 'boi_gordo', name: 'Boi Gordo', category: 'agricultural', description: 'Commodity pecuária', currency: 'BRL', unit: 'R$/arroba' },
        { id: 'madeira', name: 'Madeira', category: 'material', description: 'Commodity material', currency: 'BRL', unit: 'R$/m³' },
        { id: 'carbono', name: 'Carbono', category: 'sustainability', description: 'Commodity ambiental', currency: 'EUR', unit: '€/tCO₂' },
        { id: 'soja', name: 'Soja', category: 'agricultural', description: 'Commodity agrícola', currency: 'BRL', unit: 'R$/ton' }
      ];
      
      console.log('📋 [getCommodityConfigs] Usando configurações fallback:', fallbackConfigs.length);
      setCache(CACHE_KEYS.COMMODITIES_CONFIG, fallbackConfigs, CACHE_TTL.CONFIG);
      return fallbackConfigs;
    }
    
    const configData = doc.data() as Record<string, Omit<CommodityConfig, 'id'>>;
    const configsArray: CommodityConfig[] = Object.entries(configData).map(([id, config]) => ({
      id,
      ...config,
    }));
    
    console.log('✅ [getCommodityConfigs] Configurações carregadas do Firestore:', configsArray.length);
    setCache(CACHE_KEYS.COMMODITIES_CONFIG, configsArray, CACHE_TTL.CONFIG);
    return configsArray;
    
  } catch (error) {
    console.error("❌ [getCommodityConfigs] Erro ao buscar configurações:", error);
    
    // Fallback em caso de erro
    const fallbackConfigs: CommodityConfig[] = [
      { id: 'PDM', name: 'PDM', category: 'index', description: 'Potencial Desflorestador Monetizado', currency: 'BRL', unit: 'Pontos' },
      { id: 'milho', name: 'Milho', category: 'agricultural', description: 'Commodity agrícola', currency: 'BRL', unit: 'R$/ton' },
      { id: 'boi_gordo', name: 'Boi Gordo', category: 'agricultural', description: 'Commodity pecuária', currency: 'BRL', unit: 'R$/arroba' },
      { id: 'madeira', name: 'Madeira', category: 'material', description: 'Commodity material', currency: 'BRL', unit: 'R$/m³' },
      { id: 'carbono', name: 'Carbono', category: 'sustainability', description: 'Commodity ambiental', currency: 'EUR', unit: '€/tCO₂' },
      { id: 'soja', name: 'Soja', category: 'agricultural', description: 'Commodity agrícola', currency: 'BRL', unit: 'R$/ton' }
    ];
    
    console.log('📋 [getCommodityConfigs] Usando configurações fallback após erro:', fallbackConfigs.length);
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
  
  console.log(`🔍 [checkCompositionData] Verificando dados para composition em ${formattedDate}`);
  
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
    // Listar todas as coleções disponíveis
    const collectionsSnapshot = await db.listCollections();
    const allCollections = collectionsSnapshot.map(col => col.id);
    result.availableCollections = allCollections;
    
    console.log(`📊 [checkCompositionData] Coleções disponíveis:`, allCollections);
    
    // Verificar cada coleção necessária
    const requiredCollections = ['valor_uso_solo', 'PDM', 'ucs_ase'];
    
    for (const collectionId of requiredCollections) {
      if (!allCollections.includes(collectionId)) {
        console.log(`❌ [checkCompositionData] Coleção ${collectionId} não existe`);
        result.recommendations.push(`Criar coleção ${collectionId}`);
        continue;
      }
      
      try {
        // Buscar dados para a data específica
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
          console.log(`✅ [checkCompositionData] ${collectionId}: dados encontrados para ${formattedDate}`);
        } else {
          // Buscar dados mais recentes
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
            console.log(`⚠️ [checkCompositionData] ${collectionId}: usando dados históricos de ${serializedData.data}`);
            result.recommendations.push(`Importar dados para ${collectionId} na data ${formattedDate}`);
          } else {
            console.log(`❌ [checkCompositionData] ${collectionId}: nenhum dado encontrado`);
            result.recommendations.push(`Importar dados para ${collectionId}`);
          }
        }
      } catch (error) {
        console.error(`❌ [checkCompositionData] Erro ao verificar ${collectionId}:`, error);
        result.recommendations.push(`Corrigir estrutura de dados em ${collectionId}`);
      }
    }
    
    // Verificar se há dados suficientes
    const hasAnyData = result.valor_uso_solo || result.PDM || result.ucs_ase;
    if (!hasAnyData) {
      result.recommendations.push('Nenhum dado encontrado. Verificar processo de importação.');
    }
    
    console.log(`📋 [checkCompositionData] Recomendações:`, result.recommendations);
    
    return result;
    
  } catch (error) {
    console.error('❌ [checkCompositionData] Erro geral:', error);
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
    console.log(`🔍 [getCompositionHistoricalData] Fetching historical data with limit ${limit}`);
    
    const collections = ['valor_uso_solo', 'pdm', 'ucs_ase'];
    const allData: FirestoreQuote[] = [];
    
    for (const collection of collections) {
      console.log(`🔍 [getCompositionHistoricalData] Fetching from collection: ${collection}`);
      
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
    
    // Ordenar por data (mais recente primeiro)
    allData.sort((a, b) => {
      const dateA = new Date(a.data.split('/').reverse().join('-'));
      const dateB = new Date(b.data.split('/').reverse().join('-'));
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log(`✅ [getCompositionHistoricalData] Found ${allData.length} historical records`);
    return allData.slice(0, limit);
    
  } catch (error) {
    console.error('❌ [getCompositionHistoricalData] Error:', error);
    return [];
  }
}

export async function getCompositionDataWithComponents(targetDate: Date): Promise<FirestoreQuote | null> {
  const { db } = await getFirebaseAdmin();
  
  try {
    console.log(`🔍 [getCompositionDataWithComponents] Searching for data with valores_originais starting from ${targetDate.toISOString().split('T')[0]}`);
    
    // Tentar buscar dados em ordem de prioridade
    const collections = ['valor_uso_solo', 'pdm', 'ucs_ase'];
    
    for (const collection of collections) {
      console.log(`🔍 [getCompositionDataWithComponents] Trying collection: ${collection}`);
      
      // Buscar dados para a data específica primeiro
      let result = await getQuoteByDate(collection, targetDate);
      
      if (result && result.valores_originais && result.porcentagens) {
        console.log(`✅ [getCompositionDataWithComponents] Found data with valores_originais in ${collection} for ${targetDate.toISOString().split('T')[0]}`);
        return result;
      }
      
      // Se não encontrou com componentes, buscar dados mais antigos
      console.log(`⚠️ [getCompositionDataWithComponents] No valores_originais found for ${targetDate.toISOString().split('T')[0]}, searching older data`);
      
      // Buscar dados mais antigos com componentes
      const snapshot = await db.collection(collection)
        .orderBy('data', 'desc')
        .limit(50) // Buscar os 50 mais recentes
        .get();
      
      if (!snapshot.empty) {
        for (const doc of snapshot.docs) {
          const rawData = doc.data();
          const serializedData = serializeFirestoreTimestamp(rawData);
          
          if (serializedData.valores_originais && serializedData.porcentagens && serializedData.valor) {
            console.log(`✅ [getCompositionDataWithComponents] Found older data with valores_originais in ${collection}:`, {
              data: serializedData.data,
              hasValoresOriginais: !!serializedData.valores_originais,
              hasPorcentagens: !!serializedData.porcentagens,
              hasValor: !!serializedData.valor
            });
            return { id: doc.id, ...serializedData } as FirestoreQuote;
          }
        }
      }
    }
    
    console.log(`❌ [getCompositionDataWithComponents] No data with valores_originais found in any collection`);
    return null;
    
  } catch (error) {
    console.error('❌ [getCompositionDataWithComponents] Error:', error);
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
    console.log(`🔧 [createTestCompositionData] Criando dados de teste para ${formattedDate}`);
    
    // Dados de teste para valor_uso_solo com componentes válidos
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
    
    // Criar documento na coleção valor_uso_solo
    await db.collection('valor_uso_solo').add(testData);
    
    // Dados de teste para PDM (com componentes diferentes)
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
    
    // Criar documento na coleção PDM
    await db.collection('PDM').add(pdmTestData);
    
    console.log(`✅ [createTestCompositionData] Dados de teste criados com sucesso`);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ [createTestCompositionData] Erro ao criar dados de teste:', error);
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
    console.log('🔍 [debugFirestoreData] Iniciando debug do Firestore...');
    
    // Listar todas as coleções
    const collectionsSnapshot = await db.listCollections();
    const collections = collectionsSnapshot.map(col => col.id);
    
    console.log(`📊 [debugFirestoreData] Coleções encontradas:`, collections);
    
    const sampleData: Record<string, any[]> = {};
    const dateRange: Record<string, { earliest: string; latest: string; count: number }> = {};
    
    // Para cada coleção, buscar dados de exemplo
    for (const collectionId of collections) {
      try {
        const snapshot = await db.collection(collectionId).limit(5).get();
        const docs = snapshot.docs.map(doc => {
          const rawData = doc.data();
          // Serializar dados para evitar problemas com objetos complexos
          const serializedData = serializeFirestoreTimestamp(rawData);
          return {
            id: doc.id,
            ...serializedData
          };
        });
        
        sampleData[collectionId] = docs;
        
        // Buscar range de datas
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
        
        console.log(`📈 [debugFirestoreData] ${collectionId}:`, {
          count: countSnapshot.size,
          earliest: dateRange[collectionId].earliest,
          latest: dateRange[collectionId].latest,
          sampleFields: docs.length > 0 ? Object.keys(docs[0]) : []
        });
        
      } catch (error) {
        console.warn(`⚠️ [debugFirestoreData] Erro ao processar coleção ${collectionId}:`, error);
        sampleData[collectionId] = [];
        dateRange[collectionId] = { earliest: 'Error', latest: 'Error', count: 0 };
      }
    }
    
    console.log('✅ [debugFirestoreData] Debug concluído');
    
    return {
      collections,
      sampleData,
      dateRange
    };
    
  } catch (error) {
    console.error('❌ [debugFirestoreData] Erro no debug:', error);
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
  // Validação de entrada
  const assetValidation = validateAssetId(assetId);
  if (!assetValidation.isValid) {
    console.error(`❌ [getQuoteByDate] AssetId inválido: ${assetValidation.errors.join(', ')}`);
    return null;
  }
  
  const dateValidation = validateDate(date);
  if (!dateValidation.isValid) {
    console.error(`❌ [getQuoteByDate] Data inválida: ${dateValidation.errors.join(', ')}`);
    return null;
  }
  
  const { db } = await getFirebaseAdmin();
  const formattedDate = format(date, 'dd/MM/yyyy');
  
  try {
    console.log(`🔍 [getQuoteByDate] Buscando cotação para ${assetId} em ${formattedDate}`);
    
    // Primeira tentativa: buscar por data exata
    const snapshot = await db.collection(assetId)
      .where('data', '==', formattedDate)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const rawData = doc.data();
      const normalizedData = normalizeAssetData(rawData);
      const result = serializeFirestoreTimestamp({ id: doc.id, ...normalizedData }) as FirestoreQuote;
      console.log(`✅ [getQuoteByDate] Cotação encontrada por data exata para ${assetId}`);
      return result;
    }
    
    console.log(`⚠️ [getQuoteByDate] Nenhuma cotação encontrada por data exata para ${assetId}, tentando histórico`);
    
    // Segunda tentativa: buscar histórico mais recente usando campo 'data'
    const historicalSnapshot = await db.collection(assetId)
      .orderBy('data', 'desc')
      .limit(10)
      .get();
      
    if (!historicalSnapshot.empty) {
        // Encontrar a cotação mais recente antes da data solicitada
        for (const doc of historicalSnapshot.docs) {
          const rawData = doc.data();
          if (rawData.data) {
            try {
              // Converter data DD/MM/YYYY para Date para comparação
              const [day, month, year] = rawData.data.split('/');
              const quoteDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              
              if (quoteDate <= date) {
                const normalizedData = normalizeAssetData(rawData);
                const result = serializeFirestoreTimestamp({ id: doc.id, ...normalizedData }) as FirestoreQuote;
                console.log(`✅ [getQuoteByDate] Cotação histórica encontrada para ${assetId} em ${rawData.data}`);
                return result;
              }
            } catch (error) {
              console.warn(`⚠️ [getQuoteByDate] Erro ao processar data ${rawData.data}:`, error);
              continue;
            }
          }
        }
    }

    console.log(`❌ [getQuoteByDate] Nenhuma cotação encontrada para ${assetId} em ${formattedDate}`);
    return null;
  } catch (error) {
    console.error(`❌ [getQuoteByDate] Erro ao buscar cotação para ${assetId} em ${formattedDate}:`, error);
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
      
      // Para o UCS ASE, incluir os valores já convertidos
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
      
      // Para o UCS ASE, incluir os valores já convertidos
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
    console.error("Erro ao buscar preços em tempo real:", error);
    throw new Error("Falha ao obter as cotações mais recentes.");
  }
}

/**
 * Obtém histórico de cotações para um ativo
 */
export async function getCotacoesHistorico(assetId: string, days: number): Promise<FirestoreQuote[]> {
  // Validação de entrada
  const assetValidation = validateAssetId(assetId);
  if (!assetValidation.isValid) {
    console.error(`❌ [getCotacoesHistorico] AssetId inválido: ${assetValidation.errors.join(', ')}`);
    return [];
  }
  
  if (typeof days !== 'number' || days <= 0 || days > 3650) {
    console.error(`❌ [getCotacoesHistorico] Número de dias inválido: ${days}. Deve ser entre 1 e 3650`);
    return [];
  }
  
  const { db } = await getFirebaseAdmin();
  try {
    console.log(`🔍 [getCotacoesHistorico] Searching for ${assetId}, ${days} days`);
    
    const snapshot = await db.collection(assetId)
      .orderBy('timestamp', 'desc')
      .limit(days)
      .get();

    console.log(`📊 [getCotacoesHistorico] Found ${snapshot.size} documents for ${assetId}`);

    if (snapshot.empty) {
      console.log(`⚠️ [getCotacoesHistorico] No documents found for ${assetId}`);
      return [];
    }
    
    const results = snapshot.docs.map(doc => {
      const rawData = doc.data();
      const normalizedData = normalizeAssetData(rawData);
      return serializeFirestoreTimestamp({ id: doc.id, ...normalizedData });
    }) as FirestoreQuote[];

    console.log(`✅ [getCotacoesHistorico] Returning ${results.length} normalized records for ${assetId}`);
    return results;

  } catch (error) {
    console.error(`❌ [getCotacoesHistorico] Error fetching ${days} days for ${assetId}:`, error);
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
    console.error(`Erro ao buscar histórico por período para ${assetId}:`, error);
    return [];
  }
}

// --- CACHE MANAGEMENT ---

/**
 * Limpa cache e revalida páginas
 */
export async function clearCacheAndRefresh(): Promise<void> {
  try {
    console.log('🔄 [clearCacheAndRefresh] Limpando cache e revalidando páginas');
    clearMemoryCache();
    revalidatePath('/dashboard');
    revalidatePath('/analysis/trends');
    revalidatePath('/analysis/composition');
    console.log('✅ [clearCacheAndRefresh] Cache limpo e páginas revalidadas');
  } catch (error) {
    console.error('❌ [clearCacheAndRefresh] Erro ao limpar cache:', error);
  }
}

// --- DEBUG SERVICES ---

/**
 * Analisa dados do UCS ASE para identificar inconsistências
 */
export async function analyzeUCSASEData(): Promise<any> {
  try {
    console.log('🔍 [analyzeUCSASEData] Analisando dados do UCS ASE...');
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Buscar dados recentes
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
      
      // Verificar inconsistências de tipo
      if (typeof record.valor_eur === 'string') {
        analysis.typeInconsistencies.push({
          field: 'valor_eur',
          value: record.valor_eur,
          type: 'string',
          index
        });
      }
      
      // Verificar diferenças estruturais
      if (!Array.isArray(record.moedas) && record.moedas) {
        analysis.structureDifferences.push({
          field: 'moedas',
          type: 'object',
          value: record.moedas,
          index
        });
      }
    });
    
    console.log('📊 [analyzeUCSASEData] Análise concluída:', analysis);
    return analysis;
    
  } catch (error: any) {
    console.error('❌ [analyzeUCSASEData] Erro na análise:', error);
    return { error: error?.message || 'Erro desconhecido' };
  }
}

/**
 * Função de debug para testar busca de dados
 */
export async function debugDataFetching(): Promise<any> {
  try {
    console.log('🔍 [debugDataFetching] Iniciando teste de busca de dados');
    
    const testAssets = ['PDM', 'milho', 'boi_gordo', 'madeira', 'carbono', 'soja'];
    const today = new Date();
    const results: any = {};
    
    for (const assetId of testAssets) {
      console.log(`📊 [debugDataFetching] Testando ${assetId}...`);
      
      // Teste 1: Buscar cotação atual
      const currentQuote = await getQuoteByDate(assetId, today);
      results[assetId] = {
        currentQuote: currentQuote ? 'Found' : 'Not Found',
        hasData: !!currentQuote,
        hasComponentes: !!(currentQuote?.componentes),
        hasValor: !!(currentQuote?.valor),
        timestamp: currentQuote?.timestamp || null
      };
      
      // Teste 2: Buscar histórico
      const history = await getCotacoesHistorico(assetId, 30);
      results[assetId].historyCount = history.length;
      results[assetId].hasHistory = history.length > 0;
      
      if (currentQuote) {
        console.log(`✅ [debugDataFetching] ${assetId}: Cotação encontrada`);
        console.log(`📈 [debugDataFetching] ${assetId}: ${history.length} registros históricos`);
      } else {
        console.log(`❌ [debugDataFetching] ${assetId}: Nenhuma cotação encontrada`);
      }
    }
    
    console.log('📋 [debugDataFetching] Resultado final:', results);
    return results;
    
  } catch (error: any) {
    console.error('❌ [debugDataFetching] Erro no teste:', error);
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
