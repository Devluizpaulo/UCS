
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
} from './dependency-service';
import type { RecalculationStep } from '@/components/admin/recalculation-progress';
import { triggerN8NRecalculation } from './n8n-actions';
import type { FirestoreQuote } from './types';
import { runCompleteSimulation, type SimulationInput } from './real-calculation-service';

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
      
      const allAssetsToRead = Array.from(new Set([...editedAssetIds, ...affectedAssets, 'usd', 'eur']));

      for (const assetId of allAssetsToRead) {
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
        
        editedAssets[assetId] = { name: assetName, oldValue, newValue };
        
        await updateQuote(db, assetId, quotes[assetId].id, {
          ultimo: newValue,
          valor: newValue,
          status: 'manual_edit',
          fonte: `Edição Manual - ${user}`
        }, transaction);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        updateProgress(`update_${assetId}`, 'completed');
      }
      
      // === ETAPA 4: RECÁLCULO DOS ÍNDICES DEPENDENTES USANDO real-calculation-service ===
      const valuesWithEdits = { ...initialValues, ...editedValues };
      const simulationInput: SimulationInput = {
        usd: valuesWithEdits.usd || 0,
        eur: valuesWithEdits.eur || 0,
        soja: valuesWithEdits.soja || 0,
        milho: valuesWithEdits.milho || 0,
        boi_gordo: valuesWithEdits.boi_gordo || 0,
        carbono: valuesWithEdits.carbono || 0,
        madeira: valuesWithEdits.madeira || 0,
        current_vus: valuesWithEdits.vus || 0,
        current_vmad: valuesWithEdits.vmad || 0,
        current_carbono_crs: valuesWithEdits.carbono_crs || 0,
        current_ch2o_agua: valuesWithEdits.ch2o_agua || 0,
        current_custo_agua: valuesWithEdits.custo_agua || 0,
        current_agua_crs: valuesWithEdits.Agua_CRS || 0,
        current_valor_uso_solo: valuesWithEdits.valor_uso_solo || 0,
        current_pdm: valuesWithEdits.pdm || 0,
        current_ucs: valuesWithEdits.ucs || 0,
        current_ucs_ase: valuesWithEdits.ucs_ase || 0,
      };

      const calculationResults = runCompleteSimulation(simulationInput);

      for (const result of calculationResults) {
        if (affectedAssets.includes(result.id)) {
           updateProgress(`calc_${result.id}`, 'in_progress');
           await updateQuote(db, result.id, quotes[result.id].id, {
                ultimo: result.newValue,
                valor: result.newValue,
                status: 'auto_calculated',
                fonte: 'Recálculo Avançado via Auditoria',
                componentes: result.components,
                conversoes: result.conversions,
                valor_usd: result.components?.resultado_final_usd,
                valor_eur: result.components?.resultado_final_eur,
           }, transaction);
           await new Promise(resolve => setTimeout(resolve, 500));
           updateProgress(`calc_${result.id}`, 'completed');
        }
      }
    });
    
    // === ETAPA 5: INTEGRAÇÃO COM N8N ===
    if (process.env.N8N_WEBHOOK_URL) {
      updateProgress('n8n_sync', 'in_progress');
      
      const n8nResult = await triggerN8NRecalculation(targetDate, editedValues);
      n8nTriggered = n8nResult.success;
      
      if (!n8nResult.success) {
        console.warn('[Advanced Recalc] N8N sync falhou:', n8nResult.message);
      }
      
      updateProgress('n8n_sync', n8nTriggered ? 'completed' : 'error');
    }
    
    // === ETAPA 6: ATUALIZAÇÃO DO CACHE ===
    updateProgress('cache_update', 'in_progress');
    
    if (Object.keys(editedAssets).length > 0) {
      await createRecalculationLog(targetDate, editedAssets, affectedAssets, user);
    }
    
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
