'use server';

import { getFirebaseAdmin } from './firebase-admin-config';
import { format, startOfDay } from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { createRecalculationLog } from './audit-log-service';
import { runCompleteSimulation, type SimulationInput, type CalculationResult } from './real-calculation-service';

export interface DirectUpdateResult {
  success: boolean;
  message: string;
  updatedAssets: string[];
  error?: string;
}

/**
 * Atualiza diretamente os valores calculados no banco de dados
 * Este é o complemento ao N8N para correções manuais
 */
export async function updateCalculatedValuesDirectly(
  targetDate: Date,
  editedValues: Record<string, number>,
  allCurrentValues: Record<string, number>,
  user: string = 'Sistema'
): Promise<DirectUpdateResult> {
  const { db } = await getFirebaseAdmin();
  
  try {
    const result = await db.runTransaction(async (transaction) => {
      // Prepara input para simulação
      const simulationInput: SimulationInput = {
        usd: allCurrentValues.usd || 0,
        eur: allCurrentValues.eur || 0,
        soja: allCurrentValues.soja || 0,
        milho: allCurrentValues.milho || 0,
        boi_gordo: allCurrentValues.boi_gordo || 0,
        carbono: allCurrentValues.carbono || 0,
        madeira: allCurrentValues.madeira || 0,
        current_vus: allCurrentValues.vus || 0,
        current_vmad: allCurrentValues.vmad || 0,
        current_carbono_crs: allCurrentValues.carbono_crs || 0,
        current_ch2o_agua: allCurrentValues.ch2o_agua || 0,
        current_custo_agua: allCurrentValues.custo_agua || 0,
        current_agua_crs: allCurrentValues.Agua_CRS || 0,
        current_valor_uso_solo: allCurrentValues.valor_uso_solo || 0,
        current_pdm: allCurrentValues.pdm || 0,
        current_ucs: allCurrentValues.ucs || 0,
        current_ucs_ase: allCurrentValues.ucs_ase || 0,
      };
      
      // Aplica as edições
      Object.entries(editedValues).forEach(([assetId, newValue]) => {
        (simulationInput as any)[assetId] = newValue;
      });
      
      // Executa simulação completa
      const calculationResults = runCompleteSimulation(simulationInput);
      
      const formattedDate = format(targetDate, 'dd/MM/yyyy');
      const timestamp = Timestamp.fromDate(startOfDay(targetDate));
      const updatedAssets: string[] = [];
      
      // Atualiza valores editados diretamente
      for (const [assetId, newValue] of Object.entries(editedValues)) {
        await updateAssetValue(db, transaction, assetId, formattedDate, timestamp, newValue, 'Edição Manual');
        updatedAssets.push(assetId);
      }
      
      // Atualiza valores calculados
      for (const result of calculationResults) {
        if (Math.abs(result.newValue - result.currentValue) > 0.001) {
          await updateCalculatedAssetValue(db, transaction, result, formattedDate, timestamp);
          updatedAssets.push(result.id);
        }
      }
      
      return { updatedAssets };
    });
    
    // Cria log de auditoria
    const editedAssetsForLog: Record<string, { name: string; oldValue: number; newValue: number }> = {};
    Object.entries(editedValues).forEach(([assetId, newValue]) => {
      editedAssetsForLog[assetId] = {
        name: assetId, // TODO: Buscar nome real
        oldValue: allCurrentValues[assetId] || 0,
        newValue
      };
    });
    
    await createRecalculationLog(targetDate, editedAssetsForLog, result.updatedAssets, user);
    
    // Revalida cache
    revalidatePath('/admin/audit', 'page');
    
    return {
      success: true,
      message: `${result.updatedAssets.length} ativos atualizados com sucesso.`,
      updatedAssets: result.updatedAssets
    };
    
  } catch (error: any) {
    console.error('[Direct Update] Erro:', error);
    return {
      success: false,
      message: `Erro ao atualizar valores: ${error.message}`,
      updatedAssets: [],
      error: error.message
    };
  }
}

/**
 * Atualiza um ativo base (editado manualmente)
 */
async function updateAssetValue(
  db: any,
  transaction: any,
  assetId: string,
  formattedDate: string,
  timestamp: any,
  newValue: number,
  source: string
) {
  const collectionRef = db.collection(assetId);
  const query = collectionRef.where('data', '==', formattedDate).limit(1);
  const snapshot = await transaction.get(query);
  
  if (!snapshot.empty) {
    // Atualiza documento existente
    const doc = snapshot.docs[0];
    transaction.update(doc.ref, {
      ultimo: newValue,
      valor: newValue,
      fonte: source,
      timestamp: timestamp,
      status: 'manual_edit'
    });
  } else {
    // Cria novo documento
    const newDocRef = collectionRef.doc();
    transaction.set(newDocRef, {
      data: formattedDate,
      timestamp: timestamp,
      ultimo: newValue,
      valor: newValue,
      fonte: source,
      status: 'manual_edit',
      moeda: getAssetCurrency(assetId),
      ativo: getAssetName(assetId)
    });
  }
}

/**
 * Atualiza um ativo calculado
 */
async function updateCalculatedAssetValue(
  db: any,
  transaction: any,
  result: CalculationResult,
  formattedDate: string,
  timestamp: any
) {
  const collectionRef = db.collection(result.id);
  const query = collectionRef.where('data', '==', formattedDate).limit(1);
  const snapshot = await transaction.get(query);
  
  const updateData: any = {
    data: formattedDate,
    timestamp: timestamp,
    valor_brl: result.newValue,
    fonte: 'Cálculo Manual via Auditoria',
    formula: result.formula,
    status: 'sucesso'
  };
  
  // Adiciona componentes se disponível
  if (result.components) {
    updateData.componentes = result.components;
  }
  
  // Adiciona conversões se disponível (para UCS ASE)
  if (result.conversions) {
    updateData.conversoes = result.conversions;
    if (result.components?.resultado_final_usd) {
      updateData.valor_usd = result.components.resultado_final_usd;
    }
    if (result.components?.resultado_final_eur) {
      updateData.valor_eur = result.components.resultado_final_eur;
    }
  }
  
  if (!snapshot.empty) {
    // Atualiza documento existente
    const doc = snapshot.docs[0];
    transaction.update(doc.ref, updateData);
  } else {
    // Cria novo documento
    const newDocRef = collectionRef.doc();
    transaction.set(newDocRef, {
      ...updateData,
      ativo: result.name,
      moedas: result.conversions ? ['BRL', 'USD', 'EUR'] : ['BRL']
    });
  }
}

/**
 * Retorna a moeda do ativo
 */
function getAssetCurrency(assetId: string): string {
  const currencyMap: Record<string, string> = {
    usd: 'USD',
    eur: 'EUR',
    soja: 'USD',
    milho: 'BRL',
    boi_gordo: 'BRL',
    carbono: 'EUR',
    madeira: 'USD'
  };
  return currencyMap[assetId] || 'BRL';
}

/**
 * Retorna o nome do ativo
 */
function getAssetName(assetId: string): string {
  const nameMap: Record<string, string> = {
    usd: 'Dólar Comercial',
    eur: 'Euro',
    soja: 'Soja Futuros',
    milho: 'Milho',
    boi_gordo: 'Boi Gordo',
    carbono: 'Crédito de Carbono',
    madeira: 'Madeira Serrada'
  };
  return nameMap[assetId] || assetId;
}
