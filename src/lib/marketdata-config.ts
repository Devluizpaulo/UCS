
import type { CommodityMap, MarketDataConfig } from "./types";


// This file is intentionally not marked with 'use server' as it exports constant objects.

// MarketData API Configuration
export const MARKETDATA_CONFIG: MarketDataConfig = {
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

// This map defines the INITIAL set of commodities to be seeded into the database
// on the very first run. After that, the master list is managed in Firestore
// via the Settings page. The keys here (e.g., 'USD-BRL-Cambio') will become the
// document IDs in Firestore. The tickers have been updated for Yahoo Finance.
export const COMMODITY_TICKER_MAP: CommodityMap = {
  'USD-BRL-Cambio': { 
    name: 'USD/BRL - Dólar Americano Real Brasileiro',
    ticker: 'BRL=X', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio USD para BRL.',
    unit: 'BRL',
    source: 'Yahoo Finance',
  },
  'EUR-BRL-Cambio': { 
    name: 'EUR/BRL - Euro Real Brasileiro',
    ticker: 'EURBRL=X', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio EUR para BRL.',
    unit: 'BRL',
    source: 'Yahoo Finance',
  },
  'Boi-Gordo-Futuros': { 
    name: 'Boi Gordo Futuros (B3)',
    ticker: 'BGI=F', 
    currency: 'BRL',
    category: 'vus',
    description: 'Contratos futuros de Boi Gordo.',
    unit: '@',
    source: 'Yahoo Finance',
  },
  'Soja-Futuros': { 
    name: 'Soja Futuros (CBOT)',
    ticker: 'ZS=F',
    currency: 'USD',
    category: 'vus',
    description: 'Contratos futuros de Soja.',
    unit: 'USd/bu', // US Cents per Bushel
    source: 'Yahoo Finance',
  },
  'Milho-Futuros': { 
    name: 'Milho Futuros (CBOT)',
    ticker: 'ZC=F',
    currency: 'USD',
    category: 'vus',
    description: 'Contratos futuros de Milho.',
    unit: 'USd/bu', // US Cents per Bushel
    source: 'Yahoo Finance',
  },
  'Madeira-Serrada-Futuros': { 
    name: 'Madeira Serrada Futuros (CME)',
    ticker: 'LBS=F',
    currency: 'USD',
    category: 'vmad',
    description: 'Contratos futuros de Madeira (Lumber).',
    unit: 'USD/1,000 board feet',
    source: 'Yahoo Finance',
  },
  'Credito-Carbono-Futuros': { 
    name: 'Crédito Carbono Futuros (ICE)',
    ticker: 'KRBN', // Using KRBN ETF as a proxy for Carbon Credits
    currency: 'USD',
    category: 'crs',
    description: 'KraneShares Global Carbon Strategy ETF como proxy para créditos de carbono.',
    unit: 'USD',
    source: 'Yahoo Finance',
  },
};
