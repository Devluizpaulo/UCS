
/**
 * Serviço de Dependências para Recálculo Automático
 * 
 * Este serviço mapeia as dependências entre ativos baseado no fluxo N8N
 * e gerencia o recálculo automático quando ativos base são editados.
 */

import { getFirebaseAdmin } from './firebase-admin-config';
import { format } from 'date-fns';
import type { CommodityPriceData } from './types';
import type { RecalculationStep } from '@/components/admin/recalculation-progress';

// --- TYPES ---
export interface AssetDependency {
  id: string;
  name: string;
  dependsOn: string[];
  calculationType: 'base' | 'calculated' | 'index' | 'credit' | 'main-index' | 'sub-index';
  formula?: string;
  n8nCollection?: string;
  description?: string;
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
    dependsOn: ['ch2o_agua', 'custo_agua'],
    calculationType: 'calculated',
    formula: 'ch2o_agua + custo_agua',
    n8nCollection: 'pdm',
    description: 'Potencial Desflorestador Monetizado'
  },

  // === ÍNDICES CALCULADOS (DEPENDENTES) ===
  'ucs': {
    id: 'ucs',
    name: 'UCS',
    dependsOn: ['pdm'],
    calculationType: 'calculated',
    formula: '(pdm / 900) / 2',
    n8nCollection: 'ucs',
    description: 'Universal Carbon Sustainability'
  },
  'vus': {
    id: 'vus',
    name: 'VUS',
    dependsOn: ['milho', 'soja', 'boi_gordo', 'usd'],
    calculationType: 'sub-index',
    formula: '((Boi*25*35%) + (Milho*25*30%) + (Soja*25*35%)) * (1-4.8%)',
    n8nCollection: 'vus',
    description: 'Valor Universal Sustentável (commodities agrícolas)'
  },
  'vmad': {
    id: 'vmad',
    name: 'VMAD',
    dependsOn: ['madeira', 'usd'],
    calculationType: 'sub-index',
    formula: 'rent_media_madeira * 5',
    n8nCollection: 'vmad',
    description: 'Valor da Madeira'
  },
  'valor_uso_solo': {
    id: 'valor_uso_solo',
    name: 'Valor Uso Solo',
    dependsOn: ['vus', 'vmad', 'carbono_crs', 'Agua_CRS'],
    calculationType: 'index',
    formula: 'VUS + Vmad + Carbono_CRS + Agua_CRS',
    n8nCollection: 'valor_uso_solo',
    description: 'Valor total do uso do solo'
  },

  // === CRÉDITOS DE SUSTENTABILIDADE ===
  'carbono_crs': {
    id: 'carbono_crs',
    name: 'Carbono CRS',
    dependsOn: ['carbono', 'eur'],
    calculationType: 'credit',
    formula: 'rent_media_carbono * 25',
    n8nCollection: 'carbono_crs',
    description: 'Crédito de Carbono para Sustentabilidade'
  },
  'Agua_CRS': {
    id: 'Agua_CRS',
    name: 'Água CRS',
    dependsOn: ['ch2o_agua'],
    calculationType: 'credit',
    formula: 'valor_CH2O',
    n8nCollection: 'Agua_CRS',
    description: 'Crédito de Água para Sustentabilidade'
  },

  // === ÍNDICE PRINCIPAL ===
  'ucs_ase': {
    id: 'ucs_ase',
    name: 'Índice UCS ASE',
    dependsOn: ['ucs', 'usd', 'eur'],
    calculationType: 'main-index',
    formula: '(UCS_BRL / cotacao_dolar) + (UCS_BRL / cotacao_euro)',
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
    const currentAssetId = toProcess.shift();
    if (!currentAssetId) continue;

    // Adiciona dependências diretas e indiretas
    for (const asset of Object.values(ASSET_DEPENDENCIES)) {
      if (asset.dependsOn.includes(currentAssetId) && !affected.has(asset.id)) {
        affected.add(asset.id);
        toProcess.push(asset.id);
      }
    }
  }

  return Array.from(affected);
}

/**
 * Gera ordem de cálculo baseada nas dependências
 */
export function getCalculationOrder(assetIds: string[]): string[] {
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(assetId: string) {
    if (visited.has(assetId)) return;
    
    const asset = ASSET_DEPENDENCIES[assetId];
    if (asset) {
      // Visita dependências primeiro
      asset.dependsOn.forEach(depId => {
        if (assetIds.includes(depId)) {
          visit(depId);
        }
      });
    }

    if (!visited.has(assetId)) {
        visited.add(assetId);
        result.push(assetId);
    }
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
  const steps: RecalculationStep[] = [];
  let order = 0;

  steps.push({
      id: 'validation',
      name: 'Validação de Dados',
      type: 'validation',
      description: 'Verificando consistência dos valores editados',
      status: 'pending',
      dependsOn: [],
      order: order++,
  });

  const affectedAssets = calculateAffectedAssets(editedAssetIds);
  const allToRecalculate = getCalculationOrder(affectedAssets);
  
  editedAssetIds.forEach(assetId => {
      const asset = ASSET_DEPENDENCIES[assetId];
      steps.push({
          id: `update_${assetId}`,
          name: `Atualizar ${asset?.name || assetId}`,
          type: 'base',
          description: `Aplicando novo valor para ${asset?.name || assetId}`,
          status: 'pending',
          dependsOn: ['validation'],
          order: order++,
      });
  });

  allToRecalculate.forEach(assetId => {
    const asset = ASSET_DEPENDENCIES[assetId];
    if (asset) {
        steps.push({
            id: `calc_${assetId}`,
            name: `Recalcular ${asset.name}`,
            type: asset.calculationType,
            description: asset.description || `Recalculando ${asset.name}`,
            status: 'pending',
            dependsOn: asset.dependsOn,
            order: order++,
        });
    }
  });

  steps.push({
      id: 'n8n_sync',
      name: 'Sincronização N8N',
      type: 'n8n_trigger',
      description: 'Disparando webhook N8N para sincronização completa',
      status: 'pending',
      dependsOn: allToRecalculate,
      order: order++,
  });
  
  steps.push({
      id: 'cache_update',
      name: 'Atualização de Cache',
      type: 'cache_update',
      description: 'Limpando cache da aplicação para refletir alterações',
      status: 'pending',
      dependsOn: ['n8n_sync'],
      order: order++,
  });
  
  return steps;
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
export function getAssetsByCategory(category: AssetDependency['calculationType']): AssetDependency[] {
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
