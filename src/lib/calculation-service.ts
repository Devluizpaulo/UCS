

'use server';

import type { FirestoreQuote } from './types';

// --- DEFINIÇÕES DE TIPOS ---

type ComponentId = 'boi_gordo' | 'milho' | 'soja' | 'madeira' | 'carbono' | 'ucs' | 'pdm' | 'vmad' | 'vus' | 'crs' | 'cc' | 'ch2o';
type ComponentValues = Record<string, number>;
type CalculationStrategy = (values: ComponentValues) => number;


// --- ESTRATÉGIAS DE CÁLCULO ---

/**
 * vus = Σ (FP x Pmed x C) x Famed
 * FP = Fator de Ponderação
 * Pmed = Preço médio da commodity
 * C = Câmbio (se aplicável)
 * Famed = Fator de Arrendamento médio (4,8%)
 */
const calculateVusPrice: CalculationStrategy = (componentValues) => {
    const weights: Record<string, number> = {
        soja: 0.35,
        milho: 0.30,
        boi_gordo: 0.35,
    };
    const dolar = componentValues['usd'] ?? 1;
    const arrendamentoFactor = 0.048; // 4,8%

    const sojaBRL = (componentValues['soja'] ?? 0) * dolar;
    const milhoBRL = (componentValues['milho'] ?? 0);
    const boiBRL = (componentValues['boi_gordo'] ?? 0);

    const weightedSum =
        (sojaBRL * weights.soja) +
        (milhoBRL * weights.milho) +
        (boiBRL * weights.boi_gordo);
    
    return weightedSum * arrendamentoFactor;
};

/**
 * vmad = madeira * factor
 */
const calculateVmadPrice: CalculationStrategy = (componentValues) => {
    const factor = 1; // Fator de multiplicação, pode ser ajustado
    return (componentValues['madeira'] ?? 0) * factor;
};

/**
 * crs = cc + ch2o
 */
const calculateCrsPrice: CalculationStrategy = (componentValues) => {
    return (componentValues['cc'] ?? 0) + (componentValues['ch2o'] ?? 0);
};

/**
 * pdm = vmad + vus + crs
 */
const calculatePdmPrice: CalculationStrategy = (componentValues) => {
    return (componentValues['vmad'] ?? 0) + (componentValues['vus'] ?? 0) + (componentValues['crs'] ?? 0);
};


/**
 * Lógica de cálculo para o índice UCS.
 * UCS (CF) = 2 x IVP
 * IVP = (PDM / CE) / 2      (CE = Custo de Emissão, por ora = 1)
 * UCS = 2 * ((PDM / 1) / 2) = PDM
 */
const calculateUcsPrice: CalculationStrategy = (componentValues) => {
    const pdmValue = componentValues['pdm'] ?? 0;
    const custoEmissao = 1; // Custo de Emissão, pode ser dinâmico no futuro

    if (pdmValue === 0) return 0;
    
    const ivp = (pdmValue / custoEmissao) / 2;
    return 2 * ivp;
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
  components: readonly string[];
  valueField: keyof FirestoreQuote;
  calculator: CalculationStrategy;
}

export const CALCULATION_CONFIGS: Record<string, CalculationConfig> = {
  vus: {
    components: ['soja', 'milho', 'boi_gordo', 'usd'],
    valueField: 'ultimo',
    calculator: calculateVusPrice,
  },
  vmad: {
    components: ['madeira'],
    valueField: 'ultimo',
    calculator: calculateVmadPrice,
  },
  crs: {
    components: ['cc', 'ch2o'], // cc (carbono), ch2o (custo_agua)
    valueField: 'ultimo',
    calculator: calculateCrsPrice,
  },
  pdm: {
    components: ['vmad', 'vus', 'crs'],
    valueField: 'ultimo',
    calculator: calculatePdmPrice,
  },
  ucs: {
    components: ['pdm'],
    valueField: 'ultimo',
    calculator: calculateUcsPrice,
  },
  ucs_ase: {
    components: ['ucs', 'pdm'],
    valueField: 'ultimo',
    calculator: calculateUcsAsePrice,
  },
};

/**
 * Verifica se um ID de ativo corresponde a um ativo calculável.
 * @param assetId O ID do ativo.
 * @returns boolean
 */
export async function isCalculableAsset(assetId: string): Promise<boolean> {
    return Promise.resolve(assetId in CALCULATION_CONFIGS);
}
