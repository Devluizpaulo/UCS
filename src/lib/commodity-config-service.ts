import type { CommodityConfig } from './types';

/**
 * Mapeamento central dos ativos (commodities) que compõem o índice.
 * 
 * A chave do mapa (ex: 'soja') é usada como:
 * 1. ID único para o ativo.
 * 2. Nome da coleção no Firestore onde os dados históricos são armazenados.
 */
export const COMMODITIES_CONFIG: Record<string, Omit<CommodityConfig, 'id'>> = {
  'usd': {
    name: 'Dólar Comercial',
    currency: 'BRL',
    category: 'exchange',
    description: 'Cotação do Dólar Americano (USD) em Reais (BRL).',
    unit: 'BRL por USD',
  },
  'eur': {
    name: 'Euro',
    currency: 'BRL',
    category: 'exchange',
    description: 'Cotação do Euro (EUR) em Reais (BRL).',
    unit: 'BRL por EUR',
  },
  'soja': {
    name: 'Soja',
    currency: 'USD',
    category: 'vus',
    description: 'Preço da saca de 60kg de Soja.',
    unit: 'USD por saca',
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
  'carbono': {
    name: 'Crédito de Carbono',
    currency: 'EUR',
    category: 'crs',
    description: 'Preço do crédito de carbono em Euros.',
    unit: 'EUR por tonelada',
  },
  'madeira': {
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
