

import type { CommodityMap } from "./types";


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

// This map defines the INITIAL set of commodities to be seeded into the database
// on the very first run. After that, the master list is managed in Firestore
// via the Settings page. The keys here (e.g., 'USD/BRL Histórico') will become the
// document IDs in Firestore.
export const COMMODITY_TICKER_MAP: CommodityMap = {
  'USD-BRL-Historico': { 
    name: 'USD/BRL Histórico',
    ticker: 'USDBRL', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio USD para BRL',
    unit: 'BRL',
    source: 'MarketData',
  },
  'EUR-BRL-Historico': { 
    name: 'EUR/BRL Histórico',
    ticker: 'EURBRL', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio EUR para BRL',
    unit: 'BRL',
    source: 'MarketData',
  },
  'Boi-Gordo-Futuros': { 
    name: 'Boi Gordo Futuros',
    ticker: 'BGI=F', 
    currency: 'BRL',
    category: 'vus',
    description: 'Contratos futuros de Boi Gordo',
    unit: '@',
    source: 'B3',
  },
  'Soja-Futuros': { 
    name: 'Soja Futuros',
    ticker: 'SJC=F', 
    currency: 'USD',
    category: 'vus',
    description: 'Contratos futuros de Soja',
    unit: 'USD/Saca 60kg',
    source: 'B3',
  },
  'Milho-Futuros': { 
    name: 'Milho Futuros',
    ticker: 'CCM=F', 
    currency: 'BRL',
    category: 'vus',
    description: 'Contratos futuros de Milho',
    unit: 'BRL/Saca 60kg',
    source: 'B3',
  },
  'Madeira-Serrada-Futuros': { 
    name: 'Madeira Serrada Futuros',
    ticker: 'LBS=F',
    currency: 'USD',
    category: 'vmad',
    description: 'Contratos futuros de Madeira (Lumber)',
    unit: 'USD/MBF',
    source: 'CME',
  },
  'Credito-Carbono-Futuros': { 
    name: 'Crédito de Carbono Futuros',
    ticker: 'MFI=F',
    currency: 'EUR',
    category: 'crs',
    description: 'Contratos futuros de Crédito de Carbono (ICE)',
    unit: 'EUR/tCO₂',
    source: 'ICE',
  },
};
