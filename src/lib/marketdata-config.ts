

import type { CommodityMap } from "./types";


// This file is intentionally not marked with 'use server' as it exports constant objects.

// Mapeamento dos nomes dos ativos para suas respectivas coleções no Firestore
export const ASSET_COLLECTION_MAP: Record<string, string> = {
  'USD/BRL - Dólar Americano Real Brasileiro': 'usd',
  'EUR/BRL - Euro Real Brasileiro': 'eur',
  'Boi Gordo Futuros': 'boi_gordo',
  'Soja Futuros': 'soja',
  'Milho Futuros': 'milho',
  'Madeira Serrada Futuros': 'madeira',
  'Crédito Carbono Futuros': 'carbono',
};

// This map defines the INITIAL set of commodities to be seeded into the database
// on the very first run. After that, the master list is managed in Firestore
// via the Settings page. The keys here (e.g., 'USD-BRL-Cambio') will become the
// document IDs in Firestore. The tickers have been updated for Yahoo Finance compatibility
// but the 'source' should reflect where the data is coming from (n8n).
export const COMMODITY_TICKER_MAP: CommodityMap = {
  'USD-BRL-Cambio': { 
    name: 'USD/BRL - Dólar Americano Real Brasileiro',
    ticker: 'BRL=X', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio USD para BRL.',
    unit: 'BRL',
    source: 'n8n',
  },
  'EUR-BRL-Cambio': { 
    name: 'EUR/BRL - Euro Real Brasileiro',
    ticker: 'EURBRL=X', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio EUR para BRL.',
    unit: 'BRL',
    source: 'n8n',
  },
  'Boi-Gordo-Futuros': { 
    name: 'Boi Gordo Futuros',
    ticker: 'BGI=F', 
    currency: 'BRL',
    category: 'vus',
    description: 'Contratos futuros de Boi Gordo.',
    unit: '@',
    source: 'n8n',
  },
  'Soja-Futuros': { 
    name: 'Soja Futuros',
    ticker: 'ZS=F',
    currency: 'USD',
    category: 'vus',
    description: 'Contratos futuros de Soja.',
    unit: 'USd/bu', // US Cents per Bushel
    source: 'n8n',
  },
  'Milho-Futuros': { 
    name: 'Milho Futuros',
    ticker: 'ZC=F',
    currency: 'USD',
    category: 'vus',
    description: 'Contratos futuros de Milho.',
    unit: 'USd/bu', // US Cents per Bushel
    source: 'n8n',
  },
  'Madeira-Serrada-Futuros': { 
    name: 'Madeira Serrada Futuros',
    ticker: 'LBS=F',
    currency: 'USD',
    category: 'vmad',
    description: 'Contratos futuros de Madeira (Lumber).',
    unit: 'USD/1,000 board feet',
    source: 'n8n',
  },
  'Credito-Carbono-Futuros': { 
    name: 'Crédito Carbono Futuros',
    ticker: 'KRBN', // Using KRBN ETF as a proxy for Carbon Credits
    currency: 'USD',
    category: 'crs',
    description: 'KraneShares Global Carbon Strategy ETF como proxy para créditos de carbono.',
    unit: 'USD',
    source: 'n8n',
  },
};
