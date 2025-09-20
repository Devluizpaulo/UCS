
import type { CommodityMap } from "./types";

// This map defines the INITIAL set of commodities to be seeded into the database.
// After the first run, the master list is managed in Firestore via the Settings page.
// The keys here (e.g., 'usd') will become the document IDs in Firestore and are assumed
// to be the names of the Firestore collections themselves.
export const COMMODITY_TICKER_MAP: CommodityMap = {
  'usd': { 
    name: 'Dólar Americano',
    ticker: 'USD/BRL', // Ticker is kept for display/metadata, but not for fetching logic
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio USD para BRL.',
    unit: 'BRL',
    source: 'n8n',
  },
  'eur': { 
    name: 'Euro',
    ticker: 'EUR/BRL',
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio EUR para BRL.',
    unit: 'BRL',
    source: 'n8n',
  },
  'boi_gordo': { 
    name: 'Boi Gordo',
    ticker: 'BGI',
    currency: 'BRL',
    category: 'vus',
    description: 'Contratos futuros de Boi Gordo.',
    unit: '@',
    source: 'n8n',
  },
  'soja': { 
    name: 'Soja',
    ticker: 'SJC',
    currency: 'USD',
    category: 'vus',
    description: 'Contratos futuros de Soja.',
    unit: 'USd/bu', // US Cents per Bushel
    source: 'n8n',
  },
  'milho': { 
    name: 'Milho',
    ticker: 'CCM',
    currency: 'USD',
    category: 'vus',
    description: 'Contratos futuros de Milho.',
    unit: 'USd/bu', // US Cents per Bushel
    source: 'n8n',
  },
  'madeira': { 
    name: 'Madeira',
    ticker: 'LBS',
    currency: 'USD',
    category: 'vmad',
    description: 'Contratos futuros de Madeira (Lumber).',
    unit: 'USD/1,000 board feet',
    source: 'n8n',
  },
  'carbono': { 
    name: 'Crédito de Carbono',
    ticker: 'CO2',
    currency: 'USD',
    category: 'crs',
    description: 'Proxy para o preço de créditos de carbono.',
    unit: 'USD',
    source: 'n8n',
  },
};
