'// This file is intentionally not marked with 'use server' as it exports constant objects.

// Yahoo Finance API Configuration
export const YAHOO_FINANCE_CONFIG = {
  // Rate limiting
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 100,
    RETRY_DELAY_BASE: 1000, // Base delay in ms for exponential backoff
    MAX_RETRIES: 3,
  },
  
  // Cache TTL (Time To Live) in milliseconds
  CACHE_TTL: {
    QUOTE: 30 * 1000, // 30 seconds for real-time quotes
    HISTORICAL_1D: 5 * 60 * 1000, // 5 minutes for daily data
    HISTORICAL_1WK: 30 * 60 * 1000, // 30 minutes for weekly data
    HISTORICAL_1MO: 60 * 60 * 1000, // 1 hour for monthly data
  },
  
  // API timeouts
  TIMEOUTS: {
    QUOTE: 10000, // 10 seconds
    HISTORICAL: 15000, // 15 seconds
  },
  
  // Fallback values
  FALLBACK: {
    EXCHANGE_RATES: {
      'BRL=X': 5.5, // USD to BRL fallback rate
      'EURBRL=X': 6.0, // EUR to BRL fallback rate
    },
    COMMODITY_PRICES: {
      'BGI=F': 250.0, // Boi Gordo fallback price
      'ZS=F': 1400.0, // Soja fallback price (cents/bushel)
      'ZC=F': 600.0, // Milho fallback price (cents/bushel)
      'LBS=F': 500.0, // Madeira fallback price (USD/MBF)
      'KE=F': 72.0, // Carbono fallback price in EUR
    },
  },
};

// Commodity ticker mapping with enhanced metadata
export const COMMODITY_TICKER_MAP: { 
  [key: string]: { 
    ticker: string; 
    currency: 'BRL' | 'USD' | 'EUR';
    category: 'exchange' | 'agriculture' | 'forestry' | 'carbon';
    description: string;
    fallbackPrice?: number;
    unit: 'BRL' | '@' | 'cents/bushel' | 'USD/MBF' | 'EUR/tCO₂';
  } 
} = {
  'USD/BRL Histórico': { 
    ticker: 'BRL=X', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio USD para BRL',
    fallbackPrice: YAHOO_FINANCE_CONFIG.FALLBACK.EXCHANGE_RATES['BRL=X'],
    unit: 'BRL',
  },
  'EUR/BRL Histórico': { 
    ticker: 'EURBRL=X', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio EUR para BRL',
    fallbackPrice: YAHOO_FINANCE_CONFIG.FALLBACK.EXCHANGE_RATES['EURBRL=X'],
    unit: 'BRL',
  },
  'Boi Gordo Futuros': { 
    ticker: 'BGI=F', 
    currency: 'BRL',
    category: 'agriculture',
    description: 'Contratos futuros de Boi Gordo',
    fallbackPrice: YAHOO_FINANCE_CONFIG.FALLBACK.COMMODITY_PRICES['BGI=F'],
    unit: '@',
  },
  'Soja Futuros': { 
    ticker: 'ZS=F', 
    currency: 'USD',
    category: 'agriculture',
    description: 'Contratos futuros de Soja',
    fallbackPrice: YAHOO_FINANCE_CONFIG.FALLBACK.COMMODITY_PRICES['ZS=F'],
    unit: 'cents/bushel',
  },
  'Milho Futuros': { 
    ticker: 'ZC=F', 
    currency: 'USD',
    category: 'agriculture',
    description: 'Contratos futuros de Milho',
    fallbackPrice: YAHOO_FINANCE_CONFIG.FALLBACK.COMMODITY_PRICES['ZC=F'],
    unit: 'cents/bushel',
  },
  'Madeira Futuros': { 
    ticker: 'LBS=F', 
    currency: 'USD',
    category: 'forestry',
    description: 'Contratos futuros de Madeira (Lumber)',
    fallbackPrice: YAHOO_FINANCE_CONFIG.FALLBACK.COMMODITY_PRICES['LBS=F'],
    unit: 'USD/MBF',
  },
  'Carbono Futuros': { 
    ticker: 'KE=F', 
    currency: 'EUR',
    category: 'carbon',
    description: 'Contratos futuros de Carbono (ICE)',
    fallbackPrice: YAHOO_FINANCE_CONFIG.FALLBACK.COMMODITY_PRICES['KE=F'],
    unit: 'EUR/tCO₂',
  },
};
