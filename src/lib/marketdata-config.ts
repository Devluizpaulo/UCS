

import type { CommodityMap } from "./types";


// This file is intentionally not marked with 'use server' as it exports constant objects.

// Mapeamento dos nomes dos ativos para suas respectivas coleções no Firestore
// Os nomes das coleções DEVEM corresponder ao ID do ativo normalizado (lowercase, _ para espaços, sem caracteres especiais)
// DEPRECATED: This map is no longer the source of truth and will be removed.
// The collection name is now derived from the asset's ticker.
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
  'usd_brl___dolar_americano_real_brasileiro': { 
    name: 'USD/BRL - Dólar Americano Real Brasileiro',
    ticker: 'BRL=X', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio USD para BRL.',
    unit: 'BRL',
    source: 'n8n',
  },
  'eur_brl___euro_real_brasileiro': { 
    name: 'EUR/BRL - Euro Real Brasileiro',
    ticker: 'EURBRL=X', 
    currency: 'BRL',
    category: 'exchange',
    description: 'Taxa de câmbio EUR para BRL.',
    unit: 'BRL',
    source: 'n8n',
  },
  'boi_gordo_futuros': { 
    name: 'Boi Gordo Futuros',
    ticker: 'BGI=F', 
    currency: 'BRL',
    category: 'vus',
    description: 'Contratos futuros de Boi Gordo.',
    unit: '@',
    source: 'n8n',
  },
  'soja_futuros': { 
    name: 'Soja Futuros',
    ticker: 'ZS=F',
    currency: 'USD',
    category: 'vus',
    description: 'Contratos futuros de Soja.',
    unit: 'USd/bu', // US Cents per Bushel
    source: 'n8n',
  },
  'milho_futuros': { 
    name: 'Milho Futuros',
    ticker: 'ZC=F',
    currency: 'USD',
    category: 'vus',
    description: 'Contratos futuros de Milho.',
    unit: 'USd/bu', // US Cents per Bushel
    source: 'n8n',
  },
  'madeira_serrada_futuros': { 
    name: 'Madeira Serrada Futuros',
    ticker: 'LBS=F',
    currency: 'USD',
    category: 'vmad',
    description: 'Contratos futuros de Madeira (Lumber).',
    unit: 'USD/1,000 board feet',
    source: 'n8n',
  },
  'credito_carbono_futuros': { 
    name: 'Crédito Carbono Futuros',
    ticker: 'KRBN', // Using KRBN ETF as a proxy for Carbon Credits
    currency: 'USD',
    category: 'crs',
    description: 'KraneShares Global Carbon Strategy ETF como proxy para créditos de carbono.',
    unit: 'USD',
    source: 'n8n',
  },
};
