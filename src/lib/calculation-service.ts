

'use server';

import type { FirestoreQuote } from './types';

// --- DEFINIÇÕES DE TIPOS ---

type ComponentId = 'boi_gordo' | 'milho' | 'soja' | 'madeira' | 'carbono';
type ComponentValues = Record<ComponentId, number>;
type CalculationStrategy = (values: ComponentValues) => number;

// --- ESTRATÉGIAS DE CÁLCULO ---

/**
 * Lógica de cálculo para o ativo 'CH²O' (agua).
 */
const calculateCh2oPrice: CalculationStrategy = (componentValues) => {
  const weights: Record<ComponentId, number> = {
    boi_gordo: 0.35,
    milho: 0.30,
    soja: 0.35,
    madeira: 1,
    carbono: 1,
  };
  return (
    (componentValues.boi_gordo * weights.boi_gordo) +
    (componentValues.milho * weights.milho) +
    (componentValues.soja * weights.soja) +
    (componentValues.madeira * weights.madeira) +
    (componentValues.carbono * weights.carbono)
  );
};

/**
 * Lógica de cálculo para o ativo 'Custo da Água'.
 */
const calculateCustoAguaPrice: CalculationStrategy = (componentValues) => {
  const CARBON_FACTOR = 0.07; // 7%
  const weights: Record<ComponentId, number> = {
    boi_gordo: 0.35,
    milho: 0.30,
    soja: 0.35,
    madeira: 1,
    carbono: 1,
  };
  const weightedSum =
    (componentValues.boi_gordo * weights.boi_gordo) +
    (componentValues.milho * weights.milho) +
    (componentValues.soja * weights.soja) +
    (componentValues.madeira * weights.madeira) +
    (componentValues.carbono * weights.carbono);

  return weightedSum * CARBON_FACTOR;
};

// --- CONFIGURAÇÃO DOS ATIVOS CALCULADOS ---

interface CalculationConfig {
  components: readonly ComponentId[];
  valueField: keyof FirestoreQuote;
  calculator: CalculationStrategy;
}

/**
 * Mapeia cada ID de ativo calculado à sua configuração de cálculo.
 */
export const CALCULATION_CONFIGS: Record<string, CalculationConfig> = {
  agua: {
    components: ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'],
    valueField: 'ultimo',
    calculator: calculateCh2oPrice,
  },
  custo_agua: {
    components: ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'],
    valueField: 'rent_media',
    calculator: calculateCustoAguaPrice,
  },
};

/**
 * Verifica se um ID de ativo corresponde a um ativo calculável.
 * @param assetId O ID do ativo.
 * @returns boolean
 */
export function isCalculableAsset(assetId: string): assetId is keyof typeof CALCULATION_CONFIGS {
    return assetId in CALCULATION_CONFIGS;
}
