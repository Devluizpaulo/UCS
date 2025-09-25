

import type { FirestoreQuote } from './types';

// --- DEFINIÇÕES DE TIPOS ---

type ComponentId = 'boi_gordo' | 'milho' | 'soja' | 'madeira' | 'carbono' | 'ucs' | 'pdm';
type ComponentValues = Record<string, number>;
type CalculationStrategy = (values: ComponentValues) => number;

// --- ESTRATÉGIAS DE CÁLCULO ---

const calculateUcsPrice: CalculationStrategy = (componentValues) => {
    const weights: Record<string, number> = {
        boi_gordo: 0.10, // Exemplo de peso
        milho: 0.60,     // Exemplo de peso
        soja: 0.10,      // Exemplo de peso
    };
    const dolar = componentValues['usd'] || 1; // Fallback para 1 para evitar divisão por zero

    // Converte componentes de USD para BRL se necessário
    const boiBRL = (componentValues['boi_gordo'] ?? 0); // Já em BRL
    const milhoBRL = (componentValues['milho'] ?? 0); // Já em BRL
    const sojaBRL = (componentValues['soja'] ?? 0) * dolar; // Soja é em USD

    return (
        (boiBRL * weights.boi_gordo) +
        (milhoBRL * weights.milho) +
        (sojaBRL * weights.soja)
    );
};


/**
 * Lógica de cálculo para o ativo 'agua' (CH²O).
 * Usa o valor 'ultimo' dos componentes.
 */
const calculateCh2oPrice: CalculationStrategy = (componentValues) => {
  const weights: Record<string, number> = {
    boi_gordo: 0.35,
    milho: 0.30,
    soja: 0.35,
    madeira: 1,
    carbono: 1,
  };

  return (
    (componentValues['boi_gordo'] ?? 0) * weights.boi_gordo +
    (componentValues['milho'] ?? 0) * weights.milho +
    (componentValues['soja'] ?? 0) * weights.soja +
    (componentValues['madeira'] ?? 0) * weights.madeira +
    (componentValues['carbono'] ?? 0) * weights.carbono
  );
};

/**
 * Lógica de cálculo para o ativo 'custo_agua'.
 * Soma os componentes e aplica um fator de 7% sobre o resultado.
 */
const calculateCustoAguaPrice: CalculationStrategy = (componentValues) => {
  const CARBON_FACTOR = 0.07; // 7%
  const weights: Record<string, number> = {
    boi_gordo: 0.35,
    milho: 0.30,
    soja: 0.35,
    madeira: 1,
    carbono: 1,
  };

  const weightedSum =
    (componentValues['boi_gordo'] ?? 0) * weights.boi_gordo +
    (componentValues['milho'] ?? 0) * weights.milho +
    (componentValues['soja'] ?? 0) * weights.soja +
    (componentValues['madeira'] ?? 0) * weights.madeira +
    (componentValues['carbono'] ?? 0) * weights.carbono;
    
  return weightedSum * CARBON_FACTOR;
};

/**
 * Lógica de cálculo para o índice UCS ASE.
 * Média simples dos componentes UCS e PDM.
 */
const calculateUcsAsePrice: CalculationStrategy = (componentValues) => {
    const ucsValue = componentValues['ucs'] ?? 0;
    const pdmValue = componentValues['pdm'] ?? 0;

    // Evita divisão por zero se nenhum dos componentes tiver valor
    if (ucsValue === 0 && pdmValue === 0) {
        return 0;
    }
    // Média simples, mas poderia ser ponderada no futuro
    return (ucsValue + pdmValue) / 2; 
};


// --- CONFIGURAÇÃO DOS ATIVOS CALCULADOS ---

interface CalculationConfig {
  components: readonly string[]; // Alterado para string[] para flexibilidade
  valueField: keyof FirestoreQuote;
  calculator: CalculationStrategy;
}

/**
 * Mapeia cada ID de ativo calculado à sua configuração de cálculo.
 */
export const CALCULATION_CONFIGS: Record<string, CalculationConfig> = {
  ucs: {
    components: ['boi_gordo', 'milho', 'soja', 'usd'],
    valueField: 'ultimo',
    calculator: calculateUcsPrice,
  },
  ucs_ase: {
    components: ['ucs', 'pdm'],
    valueField: 'ultimo',
    calculator: calculateUcsAsePrice,
  },
  agua: {
    components: ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'],
    valueField: 'ultimo',
    calculator: calculateCh2oPrice,
  },
  custo_agua: {
    components: ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'],
    valueField: 'rent_media', // Alterado para usar rent_media
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
