
'use server';

import { getCommodityPrices } from './data-service';
import type { CommodityPriceData, ConvertedPrice, CurrencyRate } from './types';
import { getCache, setCache } from './cache-service';

const CACHE_KEY = 'exchangeRates';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Obtém as taxas de câmbio atuais do sistema
 * Utiliza os dados de USD/BRL e EUR/BRL já disponíveis e armazena em cache.
 */
export async function getExchangeRates(): Promise<CurrencyRate[]> {
  const cachedRates = await getCache<CurrencyRate[]>(CACHE_KEY, CACHE_TTL);
  if (cachedRates) {
    return cachedRates;
  }

  try {
    const commodityPrices = await getCommodityPrices();
    const rates: CurrencyRate[] = [];
    const now = new Date();

    // Encontra USD/BRL
    const usdBrl = commodityPrices.find(c => c.name === 'USD/BRL - Dólar Americano Real Brasileiro');
    if (usdBrl && usdBrl.price > 0) {
      rates.push({ from: 'USD', to: 'BRL', rate: usdBrl.price, lastUpdated: now });
      rates.push({ from: 'BRL', to: 'USD', rate: 1 / usdBrl.price, lastUpdated: now });
    }

    // Encontra EUR/BRL
    const eurBrl = commodityPrices.find(c => c.name === 'EUR/BRL - Euro Real Brasileiro');
    if (eurBrl && eurBrl.price > 0) {
      rates.push({ from: 'EUR', to: 'BRL', rate: eurBrl.price, lastUpdated: now });
      rates.push({ from: 'BRL', to: 'EUR', rate: 1 / eurBrl.price, lastUpdated: now });
    }

    // Calcula EUR/USD se ambas as taxas estão disponíveis
    if (usdBrl && eurBrl && usdBrl.price > 0 && eurBrl.price > 0) {
      const eurUsdRate = eurBrl.price / usdBrl.price;
      rates.push({ from: 'EUR', to: 'USD', rate: eurUsdRate, lastUpdated: now });
      rates.push({ from: 'USD', to: 'EUR', rate: 1 / eurUsdRate, lastUpdated: now });
    }

    await setCache(CACHE_KEY, rates);
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
 * Limpa o cache de taxas de câmbio (útil para forçar atualização)
 */
export async function clearExchangeRateCache(): Promise<void> {
  await clearCache(CACHE_KEY);
}
