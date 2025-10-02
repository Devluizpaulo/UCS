'use server';

/**
 * Serviço Avançado de Recálculo com Integração N8N
 * 
 * Este serviço gerencia o recálculo automático de todos os ativos dependentes
 * quando um ativo base é editado, incluindo integração com o fluxo N8N.
 */

import { getFirebaseAdmin } from './firebase-admin-config';
import { format, startOfDay } from 'date-fns';
import type { firestore as adminFirestore } from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { createRecalculationLog } from './audit-log-service';
import {
  ASSET_DEPENDENCIES,
  calculateAffectedAssets,
  getCalculationOrder,
  generateRecalculationSteps,
  estimateRecalculationTime,
  type RecalculationStep
} from './dependency-service';
import { triggerN8NRecalculation } from './n8n-actions';
import type { FirestoreQuote } from './types';

// Tipos para o progresso do recálculo
export interface RecalculationProgress {
  currentStep: string;
  completedSteps: number;
  totalSteps: number;
  percentage: number;
  estimatedTimeRemaining: number;
  steps: RecalculationStep[];
}

export interface RecalculationResult {
  success: boolean;
  message: string;
  affectedAssets: string[];
  executionTime: number;
  n8nTriggered: boolean;
  steps: RecalculationStep[];
}

// Callbacks para progresso em tempo real
type ProgressCallback = (progress: RecalculationProgress) => void;

/**
 * Executa recálculo avançado com integração N8N
 */
export async function executeAdvancedRecalculation(
  targetDate: Date,
  editedValues: Record<string, number>,
  user: string = 'Sistema',
  onProgress?: ProgressCallback
): Promise<RecalculationResult> {
  const startTime = Date.now();
  const { db } = await getFirebaseAdmin();
  
  // Gera plano de recálculo
  const editedAssetIds = Object.keys(editedValues);
  const affectedAssets = calculateAffectedAssets(editedAssetIds);
  const steps = generateRecalculationSteps(editedAssetIds, targetDate);
  const estimatedTime = estimateRecalculationTime(editedAssetIds);
  
  console.log(`[Advanced Recalc] Iniciando recálculo para ${editedAssetIds.length} ativos editados`);
  console.log(`[Advanced Recalc] ${affectedAssets.length} ativos serão afetados`);
  console.log(`[Advanced Recalc] Tempo estimado: ${estimatedTime}ms`);
  
  let currentStepIndex = 0;
  let n8nTriggered = false;
  
  // Função para atualizar progresso
  const updateProgress = (stepId: string, status: RecalculationStep['status']) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex >= 0) {
      steps[stepIndex].status = status;
      if (status === 'completed') {
        steps[stepIndex].duration = Date.now() - startTime;
        currentStepIndex = Math.max(currentStepIndex, stepIndex + 1);
      }
    }
    
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const percentage = (completedSteps / steps.length) * 100;
    const elapsed = Date.now() - startTime;
    const estimatedRemaining = Math.max(0, estimatedTime - elapsed);
    
    if (onProgress) {
      onProgress({
        currentStep: stepId,
        completedSteps,
        totalSteps: steps.length,
        percentage,
        estimatedTimeRemaining: estimatedRemaining,
        steps: [...steps]
      });
    }
  };

  try {
    // === ETAPA 1: VALIDAÇÃO ===
    updateProgress('validation', 'in_progress');
    
    // Valida se todos os ativos editados podem ser editados
    for (const assetId of editedAssetIds) {
      const asset = ASSET_DEPENDENCIES[assetId];
      if (!asset || asset.calculationType !== 'base') {
        throw new Error(`Ativo ${assetId} não pode ser editado manualmente`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Simula validação
    updateProgress('validation', 'completed');
    
    // === ETAPA 2: TRANSAÇÃO FIRESTORE ===
    let editedAssets: Record<string, { name: string; oldValue: number; newValue: number }> = {};
    
    await db.runTransaction(async (transaction) => {
      // Busca configurações dos ativos
      const quoteDocs = await db.collection('settings').doc('commodities').get();
      const commoditySettings = quoteDocs.data() || {};
      
      // Busca valores atuais
      const initialValues: Record<string, number> = {};
      const quotes: Record<string, FirestoreQuote> = {};
      
      for (const assetId of [...editedAssetIds, ...affectedAssets]) {
        const quote = await getOrCreateQuote(db, assetId, targetDate, transaction);
        quotes[assetId] = quote;
        initialValues[assetId] = quote?.valor ?? quote?.ultimo ?? (quote as any)?.valor_brl ?? 0;
      }
      
      // === ETAPA 3: ATUALIZAÇÃO DOS ATIVOS BASE ===
      for (const assetId of editedAssetIds) {
        updateProgress(`update_${assetId}`, 'in_progress');
        
        const oldValue = initialValues[assetId] || 0;
        const newValue = editedValues[assetId];
        const assetName = commoditySettings[assetId]?.name || assetId;
        
        editedAssets[assetId] = {
          name: assetName,
          oldValue,
          newValue
        };
        
        // Atualiza valor base
        await updateQuote(db, assetId, quotes[assetId].id, {
          ultimo: newValue,
          valor: newValue,
          status: 'manual_edit',
          fonte: `Edição Manual - ${user}`
        }, transaction);
        
        // Recalcula rentabilidade média se aplicável
        const rentMedia = calculateRentabilidadeMedia(assetId, newValue, initialValues);
        if (rentMedia !== null) {
          await updateQuote(db, assetId, quotes[assetId].id, {
            rent_media: rentMedia
          }, transaction);
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        updateProgress(`update_${assetId}`, 'completed');
      }
      
      // === ETAPA 4: RECÁLCULO DOS ÍNDICES DEPENDENTES ===
      const calculationOrder = getCalculationOrder([...editedAssetIds, ...affectedAssets]);
      const updatedValues = { ...initialValues, ...editedValues };
      
      for (const assetId of calculationOrder) {
        if (editedAssetIds.includes(assetId)) continue; // Já processado
        
        updateProgress(`calc_${assetId}`, 'in_progress');
        
        const calculatedValue = calculateAssetValue(assetId, updatedValues);
        if (calculatedValue !== null) {
          updatedValues[assetId] = calculatedValue;
          
          await updateQuote(db, assetId, quotes[assetId].id, {
            ultimo: calculatedValue,
            valor: calculatedValue,
            status: 'auto_calculated',
            fonte: 'Recálculo Automático'
          }, transaction);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        updateProgress(`calc_${assetId}`, 'completed');
      }
    });
    
    // === ETAPA 5: INTEGRAÇÃO COM N8N ===
    if (process.env.N8N_WEBHOOK_URL) {
      updateProgress('n8n_sync', 'in_progress');
      
      const n8nResult = await triggerN8NRecalculation(targetDate, editedValues);
      n8nTriggered = n8nResult.success;
      
      if (!n8nResult.success) {
        console.warn('[Advanced Recalc] N8N sync falhou:', n8nResult.message);
        // Não falha o recálculo, apenas registra o aviso
      }
      
      updateProgress('n8n_sync', n8nTriggered ? 'completed' : 'error');
    }
    
    // === ETAPA 6: ATUALIZAÇÃO DO CACHE ===
    updateProgress('cache_update', 'in_progress');
    
    // Cria logs de auditoria
    if (Object.keys(editedAssets).length > 0) {
      await createRecalculationLog(targetDate, editedAssets, affectedAssets, user);
    }
    
    // Invalida cache
    revalidatePath('/admin/audit', 'page');
    revalidatePath('/dashboard', 'page');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    updateProgress('cache_update', 'completed');
    
    const executionTime = Date.now() - startTime;
    
    console.log(`[Advanced Recalc] Concluído em ${executionTime}ms`);
    console.log(`[Advanced Recalc] N8N disparado: ${n8nTriggered}`);
    
    return {
      success: true,
      message: `Recálculo concluído com sucesso. ${affectedAssets.length} ativos atualizados.`,
      affectedAssets,
      executionTime,
      n8nTriggered,
      steps
    };
    
  } catch (error: any) {
    console.error('[Advanced Recalc] Erro:', error);
    
    // Marca etapa atual como erro
    if (currentStepIndex < steps.length) {
      steps[currentStepIndex].status = 'error';
    }
    
    return {
      success: false,
      message: `Falha no recálculo: ${error.message}`,
      affectedAssets,
      executionTime: Date.now() - startTime,
      n8nTriggered,
      steps
    };
  }
}

/**
 * Calcula rentabilidade média para ativos base
 */
function calculateRentabilidadeMedia(
  assetId: string, 
  newValue: number, 
  allValues: Record<string, number>
): number | null {
  switch (assetId) {
    case 'boi_gordo':
      return newValue * 18;
      
    case 'milho':
      return (newValue / 60) * 1000 * 7.20;
      
    case 'soja':
      const usdRate = allValues.usd || 5.33;
      return ((newValue / 60) * 1000) * usdRate * 3.3;
      
    case 'carbono':
      const eurRate = allValues.eur || 6.25;
      return newValue * eurRate * 2.59;
      
    case 'madeira':
      const usdRateMadeira = allValues.usd || 5.33;
      const madeiraToraUSD = newValue * 0.375620342;
      const madeiraToraBRL = madeiraToraUSD * usdRateMadeira;
      return madeiraToraBRL * 1196.54547720813 * 0.10;
      
    default:
      return null;
  }
}

/**
 * Calcula valor de um ativo baseado em suas dependências
 */
function calculateAssetValue(
  assetId: string, 
  allValues: Record<string, number>
): number | null {
  const asset = ASSET_DEPENDENCIES[assetId];
  if (!asset) return null;
  
  switch (assetId) {
    case 'ch2o_agua':
      return (
        (allValues.boi_gordo || 0) * 18 * 0.35 +
        ((allValues.milho || 0) / 60 * 1000 * 7.20) * 0.30 +
        (((allValues.soja || 0) / 60 * 1000) * (allValues.usd || 5.33) * 3.3) * 0.35 +
        calculateRentabilidadeMedia('madeira', allValues.madeira || 0, allValues) +
        calculateRentabilidadeMedia('carbono', allValues.carbono || 0, allValues)
      );
      
    case 'custo_agua':
      const ch2oValue = calculateAssetValue('ch2o_agua', allValues) || 0;
      return ch2oValue * 0.07;
      
    case 'pdm':
      const ch2o = calculateAssetValue('ch2o_agua', allValues) || 0;
      const custoAgua = calculateAssetValue('custo_agua', allValues) || 0;
      return ch2o + custoAgua;
      
    case 'ucs':
      const pdm = calculateAssetValue('pdm', allValues) || 0;
      return (pdm / 900) / 2;
      
    case 'ucs_ase':
      const ucs = calculateAssetValue('ucs', allValues) || 0;
      return ucs * 2;
      
    case 'vus':
      const rentBoi = calculateRentabilidadeMedia('boi_gordo', allValues.boi_gordo || 0, allValues) || 0;
      const rentMilho = calculateRentabilidadeMedia('milho', allValues.milho || 0, allValues) || 0;
      const rentSoja = calculateRentabilidadeMedia('soja', allValues.soja || 0, allValues) || 0;
      
      const componenteBoi = (rentBoi * 25) * 0.35;
      const componenteMilho = (rentMilho * 25) * 0.30;
      const componenteSoja = (rentSoja * 25) * 0.35;
      const somaComponentes = componenteBoi + componenteMilho + componenteSoja;
      const descontoArrendamento = somaComponentes * 0.048;
      
      return somaComponentes - descontoArrendamento;
      
    case 'carbono_crs':
      const rentCarbono = calculateRentabilidadeMedia('carbono', allValues.carbono || 0, allValues) || 0;
      return rentCarbono * 25;
      
    case 'Agua_CRS':
      return calculateAssetValue('ch2o_agua', allValues);
      
    case 'vmad':
      const rentMadeira = calculateRentabilidadeMedia('madeira', allValues.madeira || 0, allValues) || 0;
      return rentMadeira * 5;
      
    case 'valor_uso_solo':
      const vus = calculateAssetValue('vus', allValues) || 0;
      const vmad = calculateAssetValue('vmad', allValues) || 0;
      const carbonoCrs = calculateAssetValue('carbono_crs', allValues) || 0;
      const aguaCrs = calculateAssetValue('Agua_CRS', allValues) || 0;
      return vus + vmad + carbonoCrs + aguaCrs;
      
    default:
      return null;
  }
}

// Funções auxiliares do serviço original
async function getOrCreateQuote(
  db: adminFirestore.Firestore,
  assetId: string,
  targetDate: Date,
  transaction: adminFirestore.Transaction
): Promise<FirestoreQuote> {
  const formattedDate = format(targetDate, 'dd/MM/yyyy');
  const collectionRef = db.collection(assetId);
  const query = collectionRef.where('data', '==', formattedDate).limit(1);
  const snapshot = await transaction.get(query);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    const data = doc.data();
    return { id: doc.id, ...data, timestamp: serializeFirestoreTimestamp(data.timestamp) } as FirestoreQuote;
  } else {
    const newDocRef = collectionRef.doc();
    const newQuote: Partial<FirestoreQuote> = {
      data: formattedDate,
      timestamp: Timestamp.fromDate(startOfDay(targetDate)).toMillis(),
      ultimo: 0,
      valor: 0,
      status: 'recalculated',
      fonte: 'Cálculo Manual via Auditoria',
      componentes: {},
    };
    transaction.set(newDocRef, newQuote);
    return { id: newDocRef.id, ...newQuote, timestamp: startOfDay(targetDate).getTime() } as FirestoreQuote;
  }
}

function serializeFirestoreTimestamp(data: any): any {
  if (data instanceof Timestamp) {
    return data.toMillis();
  }
  if (data && typeof data.toDate === 'function') {
    return data.toDate().getTime();
  }
  return data;
}

async function updateQuote(
  db: adminFirestore.Firestore,
  assetId: string,
  quoteId: string,
  data: Partial<FirestoreQuote>,
  transaction: adminFirestore.Transaction
) {
  const docRef = db.collection(assetId).doc(quoteId);
  const { id, ...updateData } = data;
  transaction.update(docRef, updateData);
}
