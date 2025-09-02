
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
  'USD/BRL Histórico': { 
    name: 'USD/BRL Histórico',
    ticker: 'USDBRL', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio USD para BRL',
    unit: 'BRL',
    source: 'MarketData',
  },
  'EUR/BRL Histórico': { 
    name: 'EUR/BRL Histórico',
    ticker: 'EURBRL', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio EUR para BRL',
    unit: 'BRL',
    source: 'MarketData',
  },
  'Boi Gordo Futuros - Ago 25 (BGIc1)': { 
    name: 'Boi Gordo Futuros - Ago 25 (BGIc1)',
    ticker: 'BGI=F', 
    currency: 'BRL',
    category: 'agriculture',
    description: 'Contratos futuros de Boi Gordo para Agosto de 2025',
    unit: '@',
    source: 'B3',
  },
  'Soja Futuros - Nov 25 (SJCc1)': { 
    name: 'Soja Futuros - Nov 25 (SJCc1)',
    ticker: 'SJCc1', 
    currency: 'USD',
    category: 'agriculture',
    description: 'Contratos futuros de Soja para Novembro de 2025',
    unit: 'USD/Saca 60kg',
    source: 'B3',
  },
  'Milho Futuros - Set 25 (CCMc1)': { 
    name: 'Milho Futuros - Set 25 (CCMc1)',
    ticker: 'CCMc1', 
    currency: 'BRL',
    category: 'agriculture',
    description: 'Contratos futuros de Milho para Setembro de 2025',
    unit: 'BRL/Saca 60kg',
    source: 'B3',
  },
  'Madeira Serrada Futuros - Set 25 (LXRc1)': { 
    name: 'Madeira Serrada Futuros - Set 25 (LXRc1)',
    ticker: 'LXRc1',
    currency: 'USD',
    category: 'forestry',
    description: 'Contratos futuros de Madeira (Lumber)',
    unit: 'USD/MBF',
    source: 'CME',
  },
  'Carbono Futuros': { 
    name: 'Carbono Futuros',
    ticker: 'MFI=F',
    currency: 'EUR',
    category: 'carbon',
    description: 'Contratos futuros de Carbono (ICE)',
    unit: 'EUR/tCO₂',
    source: 'ICE',
  },
};
