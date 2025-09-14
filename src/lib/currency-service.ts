'use server';

import { getCommodityPrices } from './data-service';
import type { CommodityPriceData, ConvertedPrice } from './types';

// Tipos para o sistema de conversão de moedas
export type CurrencyRate = {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
};

// Cache das taxas de câmbio para evitar múltiplas consultas
let exchangeRatesCache: Map<string, CurrencyRate> = new Map();
let cacheLastUpdate: Date | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtém as taxas de câmbio atuais do sistema
 * Utiliza os dados de USD/BRL e EUR/BRL já disponíveis
 */
export async function getExchangeRates(): Promise<CurrencyRate[]> {
  try {
    // Verifica se o cache ainda é válido
    if (cacheLastUpdate && 
        Date.now() - cacheLastUpdate.getTime() < CACHE_DURATION && 
        exchangeRatesCache.size > 0) {
      return Array.from(exchangeRatesCache.values());
    }

    const commodityPrices = await getCommodityPrices();
    const rates: CurrencyRate[] = [];
    const now = new Date();

    // Encontra USD/BRL
    const usdBrl = commodityPrices.find(c => c.name === 'USD/BRL - Dólar Americano Real Brasileiro');
    if (usdBrl && usdBrl.price > 0) {
      const rate: CurrencyRate = {
        from: 'USD',
        to: 'BRL',
        rate: usdBrl.price,
        lastUpdated: now
      };
      rates.push(rate);
      exchangeRatesCache.set('USD-BRL', rate);
      
      // Taxa inversa BRL/USD
      const inverseRate: CurrencyRate = {
        from: 'BRL',
        to: 'USD',
        rate: 1 / usdBrl.price,
        lastUpdated: now
      };
      rates.push(inverseRate);
      exchangeRatesCache.set('BRL-USD', inverseRate);
    }

    // Encontra EUR/BRL
    const eurBrl = commodityPrices.find(c => c.name === 'EUR/BRL - Euro Real Brasileiro');
    if (eurBrl && eurBrl.price > 0) {
      const rate: CurrencyRate = {
        from: 'EUR',
        to: 'BRL',
        rate: eurBrl.price,
        lastUpdated: now
      };
      rates.push(rate);
      exchangeRatesCache.set('EUR-BRL', rate);
      
      // Taxa inversa BRL/EUR
      const inverseRate: CurrencyRate = {
        from: 'BRL',
        to: 'EUR',
        rate: 1 / eurBrl.price,
        lastUpdated: now
      };
      rates.push(inverseRate);
      exchangeRatesCache.set('BRL-EUR', inverseRate);
    }

    // Calcula EUR/USD se ambas as taxas estão disponíveis
    if (usdBrl && eurBrl && usdBrl.price > 0 && eurBrl.price > 0) {
      const eurUsdRate = eurBrl.price / usdBrl.price;
      const rate: CurrencyRate = {
        from: 'EUR',
        to: 'USD',
        rate: eurUsdRate,
        lastUpdated: now
      };
      rates.push(rate);
      exchangeRatesCache.set('EUR-USD', rate);
      
      // Taxa inversa USD/EUR
      const inverseRate: CurrencyRate = {
        from: 'USD',
        to: 'EUR',
        rate: 1 / eurUsdRate,
        lastUpdated: now
      };
      rates.push(inverseRate);
      exchangeRatesCache.set('USD-EUR', inverseRate);
    }

    cacheLastUpdate = now;
    return rates;
  } catch (error) {
    console.error('[CurrencyService] Erro ao obter taxas de câmbio:', error);
    return [];
  }
}

/**
 * Converte um preço de uma moeda para outra
 */
export async function convertPrice(
  price: number,
  fromCurrency: string,
  toCurrency: string
): Promise<ConvertedPrice | null> {
  try {
    // Se as moedas são iguais, não precisa converter
    if (fromCurrency === toCurrency) {
      return {
        originalPrice: price,
        originalCurrency: fromCurrency,
        convertedPrice: price,
        targetCurrency: toCurrency,
        exchangeRate: 1,
        lastUpdated: new Date().toISOString()
      };
    }

    const rates = await getExchangeRates();
    const rate = rates.find(r => r.from === fromCurrency && r.to === toCurrency);

    if (!rate) {
      console.warn(`[CurrencyService] Taxa de câmbio não encontrada para ${fromCurrency} -> ${toCurrency}`);
      return null;
    }

    const convertedPrice = price * rate.rate;

    return {
      originalPrice: price,
      originalCurrency: fromCurrency,
      convertedPrice: convertedPrice,
      targetCurrency: toCurrency,
      exchangeRate: rate.rate,
      lastUpdated: rate.lastUpdated.toISOString()
    };
  } catch (error) {
    console.error('[CurrencyService] Erro ao converter preço:', error);
    return null;
  }
}

/**
 * Converte todos os preços de commodities para uma moeda específica
 */
export async function convertAllPricesToCurrency(
  targetCurrency: 'BRL' | 'USD' | 'EUR'
): Promise<(CommodityPriceData & { convertedPrice?: ConvertedPrice })[]> {
  try {
    const commodityPrices = await getCommodityPrices();
    const results = [];

    for (const commodity of commodityPrices) {
      let result: CommodityPriceData & { convertedPrice?: ConvertedPrice } = { ...commodity };
      
      // Se a moeda já é a desejada, não precisa converter
      if (commodity.currency === targetCurrency) {
        result.convertedPrice = {
          originalPrice: commodity.price,
          originalCurrency: commodity.currency,
          convertedPrice: commodity.price,
          targetCurrency: targetCurrency,
          exchangeRate: 1,
          lastUpdated: commodity.lastUpdated
        };
      } else {
        // Converte o preço
        const converted = await convertPrice(commodity.price, commodity.currency, targetCurrency);
        if (converted) {
          result.convertedPrice = converted;
        }
      }
      
      results.push(result);
    }

    return results;
  } catch (error) {
    console.error('[CurrencyService] Erro ao converter todos os preços:', error);
    return [];
  }
}

/**
 * Formata um valor monetário de acordo com a moeda
 */
export function formatCurrency(value: number, currency: string): string {
  const formatters: Record<string, Intl.NumberFormat> = {
    BRL: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
  };

  const formatter = formatters[currency as keyof typeof formatters];
  return formatter ? formatter.format(value) : `${value.toFixed(2)} ${currency}`;
}

/**
 * Limpa o cache de taxas de câmbio (útil para forçar atualização)
 */
export function clearExchangeRateCache(): void {
  exchangeRatesCache.clear();
  cacheLastUpdate = null;
}
