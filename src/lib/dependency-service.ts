/**
 * Serviço de Dependências para Recálculo Automático
 * 
 * Este serviço mapeia as dependências entre ativos baseado no fluxo N8N
 * e gerencia o recálculo automático quando ativos base são editados.
 */

import { getFirebaseAdmin } from './firebase-admin-config';
import { format } from 'date-fns';
import type { CommodityPriceData } from './types';

// Mapa de dependências baseado no fluxo N8N
export interface AssetDependency {
  id: string;
  name: string;
  dependsOn: string[];
  calculationType: 'base' | 'calculated' | 'index' | 'sub-index';
  formula?: string;
  n8nCollection?: string;
}

// Mapa completo de dependências do sistema UCS
export const ASSET_DEPENDENCIES: Record<string, AssetDependency> = {
  // === ATIVOS BASE (Cotados externamente) ===
  usd: {
    id: 'usd',
    name: 'Dólar Comercial',
    dependsOn: [],
    calculationType: 'base',
    n8nCollection: 'usd'
  },
  eur: {
    id: 'eur',
    name: 'Euro',
    dependsOn: [],
    calculationType: 'base',
    n8nCollection: 'eur'
  },
  soja: {
    id: 'soja',
    name: 'Soja Futuros',
    dependsOn: ['usd'], // Precisa do dólar para conversão
    calculationType: 'base',
    formula: 'rent_media = (preco/60*1000) * cotacao_dolar * 3.3',
    n8nCollection: 'soja'
  },
  milho: {
    id: 'milho',
    name: 'Milho Futuros',
    dependsOn: [],
    calculationType: 'base',
    formula: 'rent_media = (preco/60*1000) * 7.20',
    n8nCollection: 'milho'
  },
  boi_gordo: {
    id: 'boi_gordo',
    name: 'Boi Gordo',
    dependsOn: [],
    calculationType: 'base',
    formula: 'rent_media = preco * 18',
    n8nCollection: 'boi_gordo'
  },
  carbono: {
    id: 'carbono',
    name: 'Crédito de Carbono',
    dependsOn: ['eur'], // Precisa do euro para conversão
    calculationType: 'base',
    formula: 'rent_media = preco * cotacao_euro * 2.59',
    n8nCollection: 'carbono'
  },
  madeira: {
    id: 'madeira',
    name: 'Madeira Serrada',
    dependsOn: ['usd'], // Precisa do dólar para conversão
    calculationType: 'base',
    formula: 'rent_media = madeira_tora_brl * 1196.54547720813 * 0.10',
    n8nCollection: 'madeira'
  },

  // === ÍNDICES CALCULADOS (Dependem das rentabilidades médias) ===
  ch2o_agua: {
    id: 'ch2o_agua',
    name: 'CH2O Água',
    dependsOn: ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'],
    calculationType: 'calculated',
    formula: '(Boi×35%) + (Milho×30%) + (Soja×35%) + Madeira + Carbono',
    n8nCollection: 'ch2o_agua'
  },
  custo_agua: {
    id: 'custo_agua',
    name: 'Custo_Água',
    dependsOn: ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'],
    calculationType: 'calculated',
    formula: 'CH2O × 7%',
    n8nCollection: 'custo_agua'
  },
  pdm: {
    id: 'pdm',
    name: 'PDM',
    dependsOn: ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono', 'custo_agua'],
    calculationType: 'index',
    formula: 'CH2O + Custo_Água',
    n8nCollection: 'pdm'
  },
  ucs: {
    id: 'ucs',
    name: 'UCS',
    dependsOn: ['pdm'],
    calculationType: 'index',
    formula: '(PDM ÷ 900) ÷ 2',
    n8nCollection: 'ucs'
  },
  ucs_ase: {
    id: 'ucs_ase',
    name: 'UCS ASE',
    dependsOn: ['ucs', 'usd', 'eur'],
    calculationType: 'index',
    formula: 'UCS × 2 (em BRL, USD, EUR)',
    n8nCollection: 'ucs_ase'
  },
  vus: {
    id: 'vus',
    name: 'VUS',
    dependsOn: ['boi_gordo', 'milho', 'soja'],
    calculationType: 'sub-index',
    formula: '((Boi×25×35%) + (Milho×25×30%) + (Soja×25×35%)) × (1-4.8%)',
    n8nCollection: 'vus'
  },
  carbono_crs: {
    id: 'carbono_crs',
    name: 'Carbono_CRS',
    dependsOn: ['carbono'],
    calculationType: 'sub-index',
    formula: 'rent_media_carbono × 25',
    n8nCollection: 'carbono_crs'
  },
  Agua_CRS: {
    id: 'Agua_CRS',
    name: 'Agua_CRS',
    dependsOn: ['ch2o_agua'],
    calculationType: 'sub-index',
    formula: 'valor_CH2O',
    n8nCollection: 'Agua_CRS'
  },
  vmad: {
    id: 'vmad',
    name: 'Vmad',
    dependsOn: ['madeira'],
    calculationType: 'sub-index',
    formula: 'rent_media_madeira × 5',
    n8nCollection: 'vmad'
  },
  valor_uso_solo: {
    id: 'valor_uso_solo',
    name: 'Valor_Uso_Solo',
    dependsOn: ['vus', 'vmad', 'carbono_crs', 'Agua_CRS'],
    calculationType: 'index',
    formula: 'VUS + Vmad + Carbono_CRS + Agua_CRS',
    n8nCollection: 'valor_uso_solo'
  }
};

/**
 * Calcula todos os ativos que serão afetados por uma mudança
 */
export function calculateAffectedAssets(changedAssetIds: string[]): string[] {
  const affected = new Set<string>();
  
  // Função recursiva para encontrar dependentes
  function findDependents(assetId: string) {
    Object.values(ASSET_DEPENDENCIES).forEach(asset => {
      if (asset.dependsOn.includes(assetId) && !affected.has(asset.id)) {
        affected.add(asset.id);
        findDependents(asset.id); // Recursão para dependentes dos dependentes
      }
    });
  }
  
  // Encontra todos os dependentes para cada ativo alterado
  changedAssetIds.forEach(assetId => {
    findDependents(assetId);
  });
  
  return Array.from(affected);
}

/**
 * Ordena os ativos por ordem de dependência (topological sort)
 */
export function getCalculationOrder(assetIds: string[]): string[] {
  const visited = new Set<string>();
  const result: string[] = [];
  
  function visit(assetId: string) {
    if (visited.has(assetId)) return;
    
    visited.add(assetId);
    
    // Visita dependências primeiro
    const asset = ASSET_DEPENDENCIES[assetId];
    if (asset) {
      asset.dependsOn.forEach(depId => {
        if (assetIds.includes(depId)) {
          visit(depId);
        }
      });
    }
    
    result.push(assetId);
  }
  
  assetIds.forEach(assetId => visit(assetId));
  return result;
}

/**
 * Gera etapas de recálculo com informações detalhadas
 */
export interface RecalculationStep {
  id: string;
  name: string;
  type: 'validation' | 'base_calculation' | 'index_calculation' | 'n8n_trigger' | 'cache_update';
  description: string;
  dependsOn: string[];
  formula?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  duration?: number;
  n8nWebhook?: string;
}

export function generateRecalculationSteps(
  editedAssets: string[], 
  targetDate: Date
): RecalculationStep[] {
  const affectedAssets = calculateAffectedAssets(editedAssets);
  const allAssets = [...editedAssets, ...affectedAssets];
  const orderedAssets = getCalculationOrder(allAssets);
  
  const steps: RecalculationStep[] = [];
  
  // Etapa 1: Validação inicial
  steps.push({
    id: 'validation',
    name: 'Validação de Dados',
    type: 'validation',
    description: `Validando ${editedAssets.length} ativo(s) editado(s)`,
    dependsOn: [],
    status: 'pending'
  });
  
  // Etapa 2: Atualização dos ativos base
  editedAssets.forEach(assetId => {
    const asset = ASSET_DEPENDENCIES[assetId];
    if (asset) {
      steps.push({
        id: `update_${assetId}`,
        name: `Atualizar ${asset.name}`,
        type: 'base_calculation',
        description: `Salvando novo valor e recalculando rentabilidade média`,
        dependsOn: ['validation'],
        formula: asset.formula,
        status: 'pending'
      });
    }
  });
  
  // Etapa 3: Recálculo dos índices dependentes
  const calculatedAssets = orderedAssets.filter(id => 
    !editedAssets.includes(id) && 
    ASSET_DEPENDENCIES[id]?.calculationType !== 'base'
  );
  
  calculatedAssets.forEach(assetId => {
    const asset = ASSET_DEPENDENCIES[assetId];
    if (asset) {
      steps.push({
        id: `calc_${assetId}`,
        name: `Recalcular ${asset.name}`,
        type: 'index_calculation',
        description: `Aplicando fórmula: ${asset.formula || 'Cálculo automático'}`,
        dependsOn: asset.dependsOn.map(dep => 
          editedAssets.includes(dep) ? `update_${dep}` : `calc_${dep}`
        ).filter(dep => steps.some(s => s.id === dep)),
        formula: asset.formula,
        status: 'pending'
      });
    }
  });
  
  // Etapa 4: Sincronização com N8N (se necessário)
  if (process.env.N8N_WEBHOOK_URL) {
    steps.push({
      id: 'n8n_sync',
      name: 'Sincronizar com N8N',
      type: 'n8n_trigger',
      description: 'Disparando recálculo automático no fluxo N8N',
      dependsOn: calculatedAssets.map(id => `calc_${id}`),
      n8nWebhook: `${process.env.N8N_WEBHOOK_URL}/reprocessar-ucs`,
      status: 'pending'
    });
  }
  
  // Etapa 5: Atualização do cache
  steps.push({
    id: 'cache_update',
    name: 'Atualizar Cache',
    type: 'cache_update',
    description: 'Atualizando cache e invalidando dados antigos',
    dependsOn: process.env.N8N_WEBHOOK_URL ? ['n8n_sync'] : calculatedAssets.map(id => `calc_${id}`),
    status: 'pending'
  });
  
  return steps;
}


/**
 * Verifica se um ativo pode ser editado manualmente
 */
export function canEditAsset(assetId: string): boolean {
  const asset = ASSET_DEPENDENCIES[assetId];
  return asset?.calculationType === 'base';
}

/**
 * Obtém informações sobre as dependências de um ativo
 */
export function getAssetDependencyInfo(assetId: string): {
  asset: AssetDependency | null;
  directDependents: AssetDependency[];
  allDependents: AssetDependency[];
} {
  const asset = ASSET_DEPENDENCIES[assetId] || null;
  
  const directDependents = Object.values(ASSET_DEPENDENCIES)
    .filter(dep => dep.dependsOn.includes(assetId));
  
  const allDependents = calculateAffectedAssets([assetId])
    .map(id => ASSET_DEPENDENCIES[id])
    .filter(Boolean);
  
  return {
    asset,
    directDependents,
    allDependents
  };
}

/**
 * Estima o tempo de recálculo baseado na complexidade
 */
export function estimateRecalculationTime(assetIds: string[]): number {
  const affectedAssets = calculateAffectedAssets(assetIds);
  const totalAssets = assetIds.length + affectedAssets.length;
  
  // Estimativa baseada na complexidade:
  // - Ativos base: 1s cada
  // - Índices simples: 2s cada  
  // - Índices complexos: 3s cada
  // - Sincronização N8N: 5s
  
  let estimatedTime = 0;
  
  [...assetIds, ...affectedAssets].forEach(assetId => {
    const asset = ASSET_DEPENDENCIES[assetId];
    if (!asset) return;
    
    switch (asset.calculationType) {
      case 'base':
        estimatedTime += 1000; // 1s
        break;
      case 'calculated':
      case 'sub-index':
        estimatedTime += 2000; // 2s
        break;
      case 'index':
        estimatedTime += 3000; // 3s
        break;
    }
  });
  
  // Adiciona tempo para N8N se configurado
  if (process.env.N8N_WEBHOOK_URL) {
    estimatedTime += 5000; // 5s
  }
  
  return estimatedTime;
}
