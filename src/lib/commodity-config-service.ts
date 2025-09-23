

import type { CommodityConfig } from './types';

/**
 * ===================================================================================
 * PAINEL DE CONTROLE DE ATIVOS (COMMODITIES)
 * ===================================================================================
 * 
 * Este arquivo é o centro de controle para todos os ativos que o sistema utiliza.
 * Cada entrada neste mapa define um ativo, suas propriedades e, mais importante,
 * a coleção do Firestore de onde seus dados são buscados.
 *
 * COMO FUNCIONA:
 * - A **CHAVE** de cada entrada (ex: 'soja', 'boi_gordo') é o **NOME DA COLEÇÃO** 
 *   no banco de dados Firestore que armazena os dados históricos daquele ativo.
 * - O objeto associado à chave contém os metadados do ativo, como seu nome de 
 *   exibição, moeda, categoria, etc.
 *
 * PARA ADICIONAR UM NOVO ATIVO:
 * 1. Crie uma nova coleção no Firestore com o nome desejado (ex: 'algodao').
 * 2. Adicione uma nova entrada neste mapa com a chave correspondente ('algodao').
 * 3. Preencha os detalhes do ativo (nome, moeda, categoria, etc.).
 *
 * O sistema irá automaticamente buscar e exibir o novo ativo no painel.
 * ===================================================================================
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
   'agua': {
    name: 'CH²O',
    currency: 'BRL',
    category: 'crs',
    description: 'Índice de Custo Hídrico para Produção de Alimentos.',
    unit: 'BRL por m³',
    isCalculated: true,
  },
   'custo_agua': {
    name: 'Custo da Água',
    currency: 'BRL',
    category: 'crs',
    description: 'Custo da Água para Produção de Alimentos.',
    unit: 'BRL por m³',
    isCalculated: true,
  },
  'madeira': {
    name: 'Madeira Serrada',
    currency: 'USD',
    category: 'vmad',
    description: 'Preço por metro cúbico de madeira serrada.',
    unit: 'USD por m³',
  },
};
