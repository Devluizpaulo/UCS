

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
// via the Settings page. The keys here (e.g., 'USD/BRL Histórico') will become the
// document IDs in Firestore.
export const COMMODITY_TICKER_MAP: CommodityMap = {
  'USD-BRL-Cambio': { 
    name: 'USD/BRL - Dólar Americano Real Brasileiro',
    ticker: 'USDBRL', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio USD para BRL em tempo real',
    unit: 'BRL',
    source: 'MarketData',
  },
  'EUR-BRL-Cambio': { 
    name: 'EUR/BRL - Euro Real Brasileiro',
    ticker: 'EURBRL', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio EUR para BRL em tempo real',
    unit: 'BRL',
    source: 'MarketData',
  },
  'Boi-Gordo-Futuros-Ago25': { 
    name: 'Boi Gordo Futuros - Ago 25',
    ticker: 'BGIc1', 
    currency: 'BRL',
    category: 'vus',
    description: 'Contratos futuros de Boi Gordo para Agosto de 2025.',
    unit: '@',
    source: 'B3',
  },
  'Soja-Futuros-Out25': { 
    name: 'Soja Futuros - Out 25',
    ticker: 'SJCc1', 
    currency: 'USD',
    category: 'vus',
    description: 'Contratos futuros de Soja para Outubro de 2025.',
    unit: 'USD/Saca 60kg',
    source: 'B3',
  },
  'Milho-Futuros-Set25': { 
    name: 'Milho Futuros - Set 25',
    ticker: 'CCMc1', 
    currency: 'BRL',
    category: 'vus',
    description: 'Contratos futuros de Milho para Setembro de 2025.',
    unit: 'BRL/Saca 60kg',
    source: 'B3',
  },
  'Madeira-Serrada-Futuros-Set25': { 
    name: 'Madeira Serrada Futuros - Set 25',
    ticker: 'LXRc1',
    currency: 'USD',
    category: 'vmad',
    description: 'Contratos futuros de Madeira (Lumber) para Setembro de 2025.',
    unit: 'USD/MBF',
    source: 'CME',
  },
  'Credito-Carbono-Futuros-Dez25': { 
    name: 'Crédito Carbono Futuros - Dez 25',
    ticker: 'CFI2Z5',
    currency: 'EUR',
    category: 'crs',
    description: 'Contratos futuros de Crédito de Carbono para Dezembro de 2025.',
    unit: 'EUR/tCO₂',
    source: 'ICE',
  },
};

