
'use server';

import type { CommodityPriceData, ConvertedPrice, CurrencyRate } from './types';
import { getCache, setCache } from './cache-service';
import { db } from './firebase-admin-config';

const CACHE_KEY = 'exchangeRates_v2';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Fetches the latest price for a specific currency asset (e.g., 'usd', 'eur').
 * @param collectionName The name of the Firestore collection for the currency.
 * @returns The latest price or 0 if not found.
 */
async function getLatestCurrencyPrice(collectionName: string): Promise<number> {
    try {
        const snapshot = await db.collection(collectionName).orderBy('timestamp', 'desc').limit(1).get();
        if (snapshot.empty) return 0;
        return snapshot.docs[0].data().ultimo || 0;
    } catch (error) {
        console.error(`[CurrencyService] Failed to fetch latest price from ${collectionName}:`, error);
        return 0;
    }
}

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
    const [usdBrlPrice, eurBrlPrice] = await Promise.all([
        getLatestCurrencyPrice('usd'),
        getLatestCurrencyPrice('eur')
    ]);

    const rates: CurrencyRate[] = [];
    const now = new Date();

    if (usdBrlPrice > 0) {
      rates.push({ from: 'USD', to: 'BRL', rate: usdBrlPrice, lastUpdated: now });
      rates.push({ from: 'BRL', to: 'USD', rate: 1 / usdBrlPrice, lastUpdated: now });
    }

    if (eurBrlPrice > 0) {
      rates.push({ from: 'EUR', to: 'BRL', rate: eurBrlPrice, lastUpdated: now });
      rates.push({ from: 'BRL', to: 'EUR', rate: 1 / eurBrlPrice, lastUpdated: now });
    }

    if (usdBrlPrice > 0 && eurBrlPrice > 0) {
      const eurUsdRate = eurBrlPrice / usdBrlPrice;
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
 * Limpa o cache de taxas de câmbio (útil para forçar atualização)
 */
export async function clearExchangeRateCache(): Promise<void> {
  const { clearCache } = await import('./cache-service');
  await clearCache(CACHE_KEY);
}
