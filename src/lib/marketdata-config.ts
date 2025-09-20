
import type { CommodityMap } from "./types";

/**
 * Maps asset IDs (which are now simplified) to the actual Firestore collection
 * name where their price history is stored. This is the source of truth for mapping.
 */
export const ASSET_COLLECTION_MAP: Record<string, string> = {
  'usd': 'usd',
  'eur': 'eur',
  'boi_gordo': 'boi_gordo',
  'soja': 'soja',
  'milho': 'milho',
  'madeira': 'madeira',
  'carbono': 'carbono',
};

// This map defines the INITIAL set of commodities to be seeded into the database.
// After the first run, the master list is managed in Firestore via the Settings page.
// The keys here (e.g., 'usd') will become the document IDs in Firestore.
export const COMMODITY_TICKER_MAP: CommodityMap = {
  'usd': { 
    name: 'Dólar Americano',
    ticker: 'BRL=X', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio USD para BRL.',
    unit: 'BRL',
    source: 'n8n',
  },
  'eur': { 
    name: 'Euro',
    ticker: 'EURBRL=X', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio EUR para BRL.',
    unit: 'BRL',
    source: 'n8n',
  },
  'boi_gordo': { 
    name: 'Boi Gordo',
    ticker: 'BGI=F', 
    currency: 'BRL',
    category: 'vus',
    description: 'Contratos futuros de Boi Gordo.',
    unit: '@',
    source: 'n8n',
  },
  'soja': { 
    name: 'Soja',
    ticker: 'ZS=F',
    currency: 'USD',
    category: 'vus',
    description: 'Contratos futuros de Soja.',
    unit: 'USd/bu', // US Cents per Bushel
    source: 'n8n',
  },
  'milho': { 
    name: 'Milho',
    ticker: 'ZC=F',
    currency: 'USD',
    category: 'vus',
    description: 'Contratos futuros de Milho.',
    unit: 'USd/bu', // US Cents per Bushel
    source: 'n8n',
  },
  'madeira': { 
    name: 'Madeira',
    ticker: 'LBS=F',
    currency: 'USD',
    category: 'vmad',
    description: 'Contratos futuros de Madeira (Lumber).',
    unit: 'USD/1,000 board feet',
    source: 'n8n',
  },
  'carbono': { 
    name: 'Crédito de Carbono',
    ticker: 'KRBN', // Using KRBN ETF as a proxy for Carbon Credits
    currency: 'USD',
    category: 'crs',
    description: 'KraneShares Global Carbon Strategy ETF como proxy para créditos de carbono.',
    unit: 'USD',
    source: 'n8n',
  },
};
