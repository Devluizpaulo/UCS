/**
 * Serviço de Dependências para Recálculo Automático
 * 
 * Este serviço mapeia as dependências entre ativos baseado no fluxo N8N
 * e gerencia o recálculo automático quando ativos base são editados.
 */

import { getFirebaseAdmin } from './firebase-admin-config';
import { format } from 'date-fns';
import type { CommodityPriceData } from './types';

// --- TYPES ---
export interface AssetDependency {
  id: string;
  name: string;
  dependsOn: string[];
  calculationType: 'base' | 'calculated' | 'index' | 'credit' | 'main-index';
  formula?: string;
  n8nCollection?: string;
  description?: string;
}

export interface RecalculationStep {
  id: string;
  name: string;
  description: string;
  dependsOn: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  duration?: number;
  order: number;
}

// --- ASSET DEPENDENCIES MAPPING ---

/**
 * MAPA COMPLETO DE DEPENDÊNCIAS DO SISTEMA UCS
 * Organizado por categorias e com dependências claras
 */
export const ASSET_DEPENDENCIES: Record<string, AssetDependency> = {
  // === MOEDAS E CÂMBIO (ATIVOS BASE) ===
  'usd': {
    id: 'usd',
    name: 'Dólar Americano',
    dependsOn: [],
    calculationType: 'base',
    n8nCollection: 'usd',
    description: 'Moeda base para conversões internacionais'
  },
  'eur': {
    id: 'eur',
    name: 'Euro',
    dependsOn: [],
    calculationType: 'base',
    n8nCollection: 'eur',
    description: 'Moeda base para conversões europeias'
  },

  // === COMMODITIES AGRÍCOLAS (ATIVOS BASE) ===
  'milho': {
    id: 'milho',
    name: 'Milho',
    dependsOn: [],
    calculationType: 'base',
    formula: 'rent_media = (preco/60*1000) * 7.20',
    n8nCollection: 'milho',
    description: 'Commodity agrícola independente'
  },
  'soja': {
    id: 'soja',
    name: 'Soja',
    dependsOn: ['usd'],
    calculationType: 'base',
    formula: 'rent_media = (preco/60*1000) * cotacao_dolar * 3.3',
    n8nCollection: 'soja',
    description: 'Commodity agrícola dependente do dólar'
  },
  'boi_gordo': {
    id: 'boi_gordo',
    name: 'Boi Gordo',
    dependsOn: [],
    calculationType: 'base',
    formula: 'rent_media = preco * 18',
    n8nCollection: 'boi_gordo',
    description: 'Commodity pecuária independente'
  },

  // === COMMODITIES MATERIAIS (ATIVOS BASE) ===
  'madeira': {
    id: 'madeira',
    name: 'Madeira',
    dependsOn: ['usd'],
    calculationType: 'base',
    formula: 'rent_media = madeira_tora_brl * 1196.54547720813 * 0.10',
    n8nCollection: 'madeira',
    description: 'Commodity material dependente do dólar'
  },
  'carbono': {
    id: 'carbono',
    name: 'Carbono',
    dependsOn: ['eur'],
    calculationType: 'base',
    formula: 'rent_media = preco * cotacao_euro * 2.59',
    n8nCollection: 'carbono',
    description: 'Commodity ambiental dependente do euro'
  },

  // === ÍNDICES DE SUSTENTABILIDADE (CALCULADOS) ===
  'ch2o_agua': {
    id: 'ch2o_agua',
    name: 'CH2O Água',
    dependsOn: ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'],
    calculationType: 'calculated',
    formula: '(Boi×35%) + (Milho×30%) + (Soja×35%) + Madeira + Carbono',
    n8nCollection: 'ch2o_agua',
    description: 'Índice de uso da água baseado em commodities'
  },
  'custo_agua': {
    id: 'custo_agua',
    name: 'Custo Água',
    dependsOn: ['ch2o_agua'],
    calculationType: 'calculated',
    formula: 'ch2o_agua * 0.07',
    n8nCollection: 'custo_agua',
    description: 'Custo do uso da água (7% de CH2O)'
  },
  'pdm': {
    id: 'pdm',
    name: 'PDM',
    dependsOn: ['ch2o_agua'],
    calculationType: 'calculated',
    formula: 'ch2o_agua * 0.15',
    n8nCollection: 'pdm',
    description: 'Potencial Desflorestador Monetizado'
  },

  // === ÍNDICES CALCULADOS (DEPENDENTES) ===
  'ucs': {
    id: 'ucs',
    name: 'UCS',
    dependsOn: ['ch2o_agua', 'custo_agua', 'pdm'],
    calculationType: 'calculated',
    formula: 'ch2o_agua + custo_agua + pdm',
    n8nCollection: 'ucs',
    description: 'Universal Carbon Sustainability'
  },
  'vus': {
    id: 'vus',
    name: 'VUS',
    dependsOn: ['milho', 'soja', 'boi_gordo'],
    calculationType: 'calculated',
    formula: '(Milho×40%) + (Soja×35%) + (Boi×25%)',
    n8nCollection: 'vus',
    description: 'Valor Universal Sustentável (commodities agrícolas)'
  },
  'vmad': {
    id: 'vmad',
    name: 'VMAD',
    dependsOn: ['madeira'],
    calculationType: 'calculated',
    formula: 'madeira * 6000',
    n8nCollection: 'vmad',
    description: 'Valor da Madeira'
  },
  'valor_uso_solo': {
    id: 'valor_uso_solo',
    name: 'Valor Uso Solo',
    dependsOn: ['vus', 'vmad'],
    calculationType: 'calculated',
    formula: 'vus + vmad',
    n8nCollection: 'valor_uso_solo',
    description: 'Valor total do uso do solo'
  },

  // === CRÉDITOS DE SUSTENTABILIDADE ===
  'carbono_crs': {
    id: 'carbono_crs',
    name: 'Carbono CRS',
    dependsOn: ['carbono'],
    calculationType: 'credit',
    formula: 'carbono * 400',
    n8nCollection: 'carbono_crs',
    description: 'Crédito de Carbono para Sustentabilidade'
  },
  'Agua_CRS': {
    id: 'Agua_CRS',
    name: 'Água CRS',
    dependsOn: ['ch2o_agua'],
    calculationType: 'credit',
    formula: 'ch2o_agua * 1000',
    n8nCollection: 'Agua_CRS',
    description: 'Crédito de Água para Sustentabilidade'
  },

  // === ÍNDICE PRINCIPAL ===
  'ucs_ase': {
    id: 'ucs_ase',
    name: 'Índice UCS ASE',
    dependsOn: ['ucs', 'usd', 'eur'],
    calculationType: 'main-index',
    formula: 'ucs * cotacao_usd * 0.5 + ucs * cotacao_eur * 0.5',
    n8nCollection: 'ucs_ase',
    description: 'Índice principal de Unidade de Crédito de Sustentabilidade'
  }
};

// --- UTILITY FUNCTIONS ---

/**
 * Calcula quais ativos serão afetados por mudanças em ativos específicos
 */
export function calculateAffectedAssets(editedAssetIds: string[]): string[] {
  const affected = new Set<string>();
  const toProcess = [...editedAssetIds];

  while (toProcess.length > 0) {
    const currentAsset = toProcess.shift();
    if (!currentAsset || affected.has(currentAsset)) continue;

    affected.add(currentAsset);

    // Encontra todos os ativos que dependem do atual
    Object.values(ASSET_DEPENDENCIES).forEach(asset => {
      if (asset.dependsOn.includes(currentAsset) && !affected.has(asset.id)) {
        toProcess.push(asset.id);
      }
    });
  }

  return Array.from(affected).filter(id => !editedAssetIds.includes(id));
}

/**
 * Gera ordem de cálculo baseada nas dependências
 */
export function getCalculationOrder(assetIds: string[]): string[] {
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(assetId: string) {
    if (visited.has(assetId)) return;
    visited.add(assetId);

    const asset = ASSET_DEPENDENCIES[assetId];
    if (asset) {
      // Visita dependências primeiro
      asset.dependsOn.forEach(depId => {
        if (assetIds.includes(depId)) {
          visit(depId);
        }
      });
    }

    result.push(assetId);
  }

  assetIds.forEach(visit);
  return result;
}

/**
 * Gera passos de recálculo baseados nas dependências
 */
export function generateRecalculationSteps(
  editedAssetIds: string[], 
  targetDate: Date
): RecalculationStep[] {
  const affectedAssets = calculateAffectedAssets(editedAssetIds);
  const allAssets = [...editedAssetIds, ...affectedAssets];
  const calculationOrder = getCalculationOrder(allAssets);

  return calculationOrder.map((assetId, index) => {
    const asset = ASSET_DEPENDENCIES[assetId];
    return {
      id: `calc_${assetId}`,
      name: asset?.name || assetId,
      description: asset?.description || `Recálculo de ${assetId}`,
      dependsOn: asset?.dependsOn || [],
      status: 'pending',
      order: index + 1
    };
  });
}

/**
 * Estima tempo de recálculo baseado no número de ativos
 */
export function estimateRecalculationTime(assetIds: string[]): number {
  const affectedAssets = calculateAffectedAssets(assetIds);
  const totalAssets = assetIds.length + affectedAssets.length;
  
  // Estimativa: 500ms por ativo + overhead
  return totalAssets * 500 + 2000;
}

/**
 * Valida se um ativo pode ser editado
 */
export function canEditAsset(assetId: string): boolean {
  const asset = ASSET_DEPENDENCIES[assetId];
  return asset?.calculationType === 'base';
}

/**
 * Obtém informações de dependência de um ativo
 */
export function getAssetDependency(assetId: string): AssetDependency | null {
  return ASSET_DEPENDENCIES[assetId] || null;
}

/**
 * Lista todos os ativos de uma categoria específica
 */
export function getAssetsByCategory(category: string): AssetDependency[] {
  return Object.values(ASSET_DEPENDENCIES).filter(asset => 
    asset.calculationType === category
  );
}

/**
 * Obtém ativos base (editáveis)
 */
export function getBaseAssets(): AssetDependency[] {
  return getAssetsByCategory('base');
}

/**
 * Obtém ativos calculados (não editáveis)
 */
export function getCalculatedAssets(): AssetDependency[] {
  return Object.values(ASSET_DEPENDENCIES).filter(asset => 
    asset.calculationType !== 'base'
  );
}

/**
 * Verifica se há dependências circulares
 */
export function detectCircularDependencies(): string[] {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const circularDeps: string[] = [];

  function dfs(assetId: string, path: string[]): void {
    if (recursionStack.has(assetId)) {
      const cycleStart = path.indexOf(assetId);
      circularDeps.push(...path.slice(cycleStart));
      return;
    }

    if (visited.has(assetId)) return;

    visited.add(assetId);
    recursionStack.add(assetId);

    const asset = ASSET_DEPENDENCIES[assetId];
    if (asset) {
      asset.dependsOn.forEach(depId => {
        dfs(depId, [...path, assetId]);
      });
    }

    recursionStack.delete(assetId);
  }

  Object.keys(ASSET_DEPENDENCIES).forEach(assetId => {
    if (!visited.has(assetId)) {
      dfs(assetId, []);
    }
  });

  return [...new Set(circularDeps)];
}

/**
 * Obtém estatísticas das dependências
 */
export function getDependencyStats(): {
  totalAssets: number;
  baseAssets: number;
  calculatedAssets: number;
  creditAssets: number;
  mainIndexAssets: number;
  maxDepth: number;
  circularDependencies: string[];
} {
  const allAssets = Object.values(ASSET_DEPENDENCIES);
  const baseAssets = allAssets.filter(a => a.calculationType === 'base').length;
  const calculatedAssets = allAssets.filter(a => a.calculationType === 'calculated').length;
  const creditAssets = allAssets.filter(a => a.calculationType === 'credit').length;
  const mainIndexAssets = allAssets.filter(a => a.calculationType === 'main-index').length;
  
  const circularDeps = detectCircularDependencies();
  
  // Calcula profundidade máxima
  let maxDepth = 0;
  function calculateDepth(assetId: string, visited = new Set<string>()): number {
    if (visited.has(assetId)) return 0;
    visited.add(assetId);
    
    const asset = ASSET_DEPENDENCIES[assetId];
    if (!asset || asset.dependsOn.length === 0) return 1;
    
    const depths = asset.dependsOn.map(depId => calculateDepth(depId, new Set(visited)));
    return 1 + Math.max(...depths, 0);
  }
  
  Object.keys(ASSET_DEPENDENCIES).forEach(assetId => {
    maxDepth = Math.max(maxDepth, calculateDepth(assetId));
  });

  return {
    totalAssets: allAssets.length,
    baseAssets,
    calculatedAssets,
    creditAssets,
    mainIndexAssets,
    maxDepth,
    circularDependencies: circularDeps
  };
}