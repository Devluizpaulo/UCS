
// This file is intentionally not marked with 'use server' as it exports constant objects.

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
};

type ScrapeConfig = {
  url: string;
  selector: string;
}

// Commodity ticker mapping with enhanced metadata
export const COMMODITY_TICKER_MAP: { 
  [key: string]: { 
    ticker: string; 
    currency: 'BRL' | 'USD' | 'EUR';
    category: 'exchange' | 'agriculture' | 'forestry' | 'carbon';
    description: string;
    unit: 'BRL' | '@' | 'cents/bushel' | 'USD/MBF' | 'EUR/tCO₂';
    scrapeConfig?: ScrapeConfig;
  } 
} = {
  'USD/BRL Histórico': { 
    ticker: 'BRL=X', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio USD para BRL',
    unit: 'BRL',
    scrapeConfig: {
      url: 'https://finance.yahoo.com/quote/BRL=X/',
      selector: 'fin-streamer[data-field="regularMarketPrice"][data-symbol="BRL=X"]'
    }
  },
  'EUR/BRL Histórico': { 
    ticker: 'EURBRL=X', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio EUR para BRL',
    unit: 'BRL',
     scrapeConfig: {
      url: 'https://finance.yahoo.com/quote/EURBRL=X/',
      selector: 'fin-streamer[data-field="regularMarketPrice"][data-symbol="EURBRL=X"]'
    }
  },
  'Boi Gordo Futuros - Ago 25 (BGIc1)': { 
    ticker: 'BGIc1.SA', 
    currency: 'BRL',
    category: 'agriculture',
    description: 'Contratos futuros de Boi Gordo para Agosto de 2025',
    unit: '@',
    scrapeConfig: {
      url: 'https://finance.yahoo.com/quote/BGIc1.SA/',
      selector: 'fin-streamer[data-field="regularMarketPrice"][data-symbol="BGIc1.SA"]'
    }
  },
  'Soja Futuros': { 
    ticker: 'ZS=F', 
    currency: 'USD',
    category: 'agriculture',
    description: 'Contratos futuros de Soja',
    unit: 'cents/bushel',
     scrapeConfig: {
      url: 'https://finance.yahoo.com/quote/ZS=F/',
      selector: 'fin-streamer[data-field="regularMarketPrice"][data-symbol="ZS=F"]'
    }
  },
  'Milho Futuros': { 
    ticker: 'ZC=F', 
    currency: 'USD',
    category: 'agriculture',
    description: 'Contratos futuros de Milho',
    unit: 'cents/bushel',
     scrapeConfig: {
      url: 'https://finance.yahoo.com/quote/ZC=F/',
      selector: 'fin-streamer[data-field="regularMarketPrice"][data-symbol="ZC=F"]'
    }
  },
  'Madeira Futuros': { 
    ticker: 'LBS=F', 
    currency: 'USD',
    category: 'forestry',
    description: 'Contratos futuros de Madeira (Lumber)',
    unit: 'USD/MBF',
     scrapeConfig: {
      url: 'https://finance.yahoo.com/quote/LBS=F/',
      selector: 'fin-streamer[data-field="regularMarketPrice"][data-symbol="LBS=F"]'
    }
  },
  'Carbono Futuros': { 
    ticker: 'KE=F', 
    currency: 'EUR',
    category: 'carbon',
    description: 'Contratos futuros de Carbono (ICE)',
    unit: 'EUR/tCO₂',
     scrapeConfig: {
      url: 'https://finance.yahoo.com/quote/KE=F/',
      selector: 'fin-streamer[data-field="regularMarketPrice"][data-symbol="KE=F"]'
    }
  },
};
