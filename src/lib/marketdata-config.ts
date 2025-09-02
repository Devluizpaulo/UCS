
// This file is intentionally not marked with 'use server' as it exports constant objects.

// MarketData API Configuration
export const MARKETDATA_CONFIG = {
  API_BASE_URL: "https://api.marketdata.app/v1",
  
  // Cache TTL (Time To Live) in milliseconds
  CACHE_TTL: {
    QUOTE: 30 * 1000, // 30 seconds for real-time quotes
    HISTORICAL: 5 * 60 * 1000, // 5 minutes for historical data
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

// Commodity ticker mapping with enhanced metadata for MarketData.app
// Note: Tickers might need adjustment based on the new API's format.
export const COMMODITY_TICKER_MAP: { 
  [key: string]: { 
    ticker: string; 
    currency: 'BRL' | 'USD' | 'EUR';
    category: 'exchange' | 'agriculture' | 'forestry' | 'carbon';
    description: string;
    unit: 'BRL' | '@' | 'cents/bushel' | 'USD/MBF' | 'EUR/tCO₂';
    source?: string;
    scrapeConfig?: ScrapeConfig;
  } 
} = {
  'USD/BRL Histórico': { 
    ticker: 'USDBRL', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio USD para BRL',
    unit: 'BRL',
    source: 'MarketData',
  },
  'EUR/BRL Histórico': { 
    ticker: 'EURBRL', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio EUR para BRL',
    unit: 'BRL',
    source: 'MarketData',
  },
  'Boi Gordo Futuros - Ago 25 (BGIc1)': { 
    ticker: 'BGI=F', 
    currency: 'BRL',
    category: 'agriculture',
    description: 'Contratos futuros de Boi Gordo para Agosto de 2025',
    unit: '@',
    source: 'B3',
  },
  'Soja Futuros': { 
    ticker: 'ZS=F', 
    currency: 'USD',
    category: 'agriculture',
    description: 'Contratos futuros de Soja',
    unit: 'cents/bushel',
    source: 'CME',
  },
  'Milho Futuros': { 
    ticker: 'ZC=F', 
    currency: 'USD',
    category: 'agriculture',
    description: 'Contratos futuros de Milho',
    unit: 'cents/bushel',
    source: 'CME',
  },
  'Madeira Futuros': { 
    ticker: 'LBS=F',
    currency: 'USD',
    category: 'forestry',
    description: 'Contratos futuros de Madeira (Lumber)',
    unit: 'USD/MBF',
    source: 'CME',
  },
  'Carbono Futuros': { 
    ticker: 'MFI=F',
    currency: 'EUR',
    category: 'carbon',
    description: 'Contratos futuros de Carbono (ICE)',
    unit: 'EUR/tCO₂',
    source: 'ICE',
  },
};

