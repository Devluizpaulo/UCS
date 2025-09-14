'use client';

import { useState, useEffect, useCallback } from 'react';
import { convertPrice, convertAllPricesToCurrency, getExchangeRates, clearExchangeRateCache } from '@/lib/currency-service';
import type { CurrencyRate, ConvertedPrice, CommodityPriceData } from '@/lib/types';

type CommodityWithConversion = CommodityPriceData & { convertedPrice?: ConvertedPrice };

export function useCurrencyConversion() {
  const [exchangeRates, setExchangeRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega as taxas de câmbio
  const loadExchangeRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rates = await getExchangeRates();
      setExchangeRates(rates);
    } catch (err) {
      setError('Erro ao carregar taxas de câmbio');
      console.error('Erro ao carregar taxas de câmbio:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Converte um preço específico
  const convertSinglePrice = useCallback(async (
    price: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<ConvertedPrice | null> => {
    try {
      setLoading(true);
      setError(null);
      return await convertPrice(price, fromCurrency, toCurrency);
    } catch (err) {
      setError('Erro ao converter preço');
      console.error('Erro ao converter preço:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Converte todos os preços para uma moeda específica
  const convertAllPrices = useCallback(async (
    targetCurrency: 'BRL' | 'USD' | 'EUR'
  ): Promise<CommodityWithConversion[]> => {
    try {
      setLoading(true);
      setError(null);
      return await convertAllPricesToCurrency(targetCurrency);
    } catch (err) {
      setError('Erro ao converter todos os preços');
      console.error('Erro ao converter todos os preços:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza o cache de taxas de câmbio
  const refreshRates = useCallback(async () => {
    clearExchangeRateCache();
    await loadExchangeRates();
  }, [loadExchangeRates]);

  // Obtém uma taxa de câmbio específica
  const getRate = useCallback((fromCurrency: string, toCurrency: string): number | null => {
    const rate = exchangeRates.find(r => r.from === fromCurrency && r.to === toCurrency);
    return rate ? rate.rate : null;
  }, [exchangeRates]);

  // Verifica se uma conversão é possível
  const canConvert = useCallback((fromCurrency: string, toCurrency: string): boolean => {
    if (fromCurrency === toCurrency) return true;
    return exchangeRates.some(r => r.from === fromCurrency && r.to === toCurrency);
  }, [exchangeRates]);

  // Carrega as taxas na inicialização
  useEffect(() => {
    loadExchangeRates();
  }, [loadExchangeRates]);

  return {
    // Estados
    exchangeRates,
    loading,
    error,
    
    // Funções
    loadExchangeRates,
    convertSinglePrice,
    convertAllPrices,
    refreshRates,
    getRate,
    canConvert,
  };
}

// Hook para conversão em tempo real de um valor específico
export function useRealTimeConversion(
  price: number,
  fromCurrency: string,
  toCurrency: string
) {
  const [convertedPrice, setConvertedPrice] = useState<ConvertedPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convert = useCallback(async () => {
    if (!price || !fromCurrency || !toCurrency) {
      setConvertedPrice(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await convertPrice(price, fromCurrency, toCurrency);
      setConvertedPrice(result);
    } catch (err) {
      setError('Erro na conversão');
      console.error('Erro na conversão:', err);
    } finally {
      setLoading(false);
    }
  }, [price, fromCurrency, toCurrency]);

  useEffect(() => {
    convert();
  }, [convert]);

  return {
    convertedPrice,
    loading,
    error,
    refresh: convert
  };
}

// Utilitários para formatação
export const currencyUtils = {
  // Formata um valor monetário
  format: (value: number, currency: string): string => {
    const formatters: Record<string, Intl.NumberFormat> = {
      BRL: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
      USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
    };

    const formatter = formatters[currency as keyof typeof formatters];
    return formatter ? formatter.format(value) : `${value.toFixed(2)} ${currency}`;
  },

  // Obtém o símbolo da moeda
  getSymbol: (currency: string): string => {
    const symbols: Record<string, string> = {
      BRL: 'R$',
      USD: '$',
      EUR: '€'
    };
    return symbols[currency as keyof typeof symbols] || currency;
  },

  // Obtém o nome completo da moeda
  getName: (currency: string): string => {
    const names: Record<string, string> = {
      BRL: 'Real Brasileiro',
      USD: 'Dólar Americano',
      EUR: 'Euro'
    };
    return names[currency as keyof typeof names] || currency;
  }
};
