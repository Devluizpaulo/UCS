import type { CommodityConfig } from './types';

/**
 * Mapeamento central dos ativos (commodities) que compõem o índice.
 * 
 * A chave do mapa (ex: 'dolar_comercial') é usada como:
 * 1. ID único para o ativo.
 * 2. Nome da coleção no Firestore onde os dados históricos são armazenados.
 */
export const COMMODITIES_CONFIG: Record<string, Omit<CommodityConfig, 'id'>> = {
  'dolar_comercial': {
    name: 'Dólar Comercial',
    currency: 'BRL',
    category: 'exchange',
    description: 'Cotação do Dólar Americano (USD) em Reais (BRL).',
    unit: 'BRL por USD',
  },
  'euro': {
    name: 'Euro',
    currency: 'BRL',
    category: 'exchange',
    description: 'Cotação do Euro (EUR) em Reais (BRL).',
    unit: 'BRL por EUR',
  },
  'soja': {
    name: 'Soja',
    currency: 'BRL',
    category: 'vus',
    description: 'Preço da saca de 60kg de Soja.',
    unit: 'BRL por saca',
  },
  'milho': {
    name: 'Milho',
    currency: 'BRL',
    category: 'vus',
    description: 'Preço da saca de 60kg de Milho.',
    unit: 'BRL por saca',
  },
  'boi_gordo': {
    name: 'Boi Gordo',
    currency: 'BRL',
    category: 'vus',
    description: 'Preço da arroba (15kg) de Boi Gordo.',
    unit: 'BRL por @',
  },
  'credito_carbono': {
    name: 'Crédito de Carbono',
    currency: 'USD',
    category: 'crs',
    description: 'Preço do crédito de carbono (CBL).',
    unit: 'USD por tonelada',
  },
  'madeira_serrada': {
    name: 'Madeira Serrada',
    currency: 'USD',
    category: 'vmad',
    description: 'Preço por metro cúbico de madeira serrada.',
    unit: 'USD por m³',
  }
};

/**
 * Retorna a lista completa de configurações de ativos, adicionando o ID a cada objeto.
 */
export async function getCommodityConfigs(): Promise<CommodityConfig[]> {
  return Object.entries(COMMODITIES_CONFIG).map(([id, config]) => ({
    id,
    ...config,
  }));
}
