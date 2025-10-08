
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
      const allAssetIds = Array.from(new Set([...Object.keys(editedValues), ...calculationResults.map(r => r.id)]));
      const formattedDate = format(targetDate, 'dd/MM/yyyy');
      
      // =================================================================
      // ETAPA DE LEITURA (READS)
      // =================================================================
      const quoteDocs: Record<string, { ref: any, data: any }> = {};
      const readPromises = allAssetIds.map(async (assetId) => {
        const collectionRef = db.collection(assetId);
        const query = collectionRef.where('data', '==', formattedDate).limit(1);
        const snapshot = await transaction.get(query);
        if (!snapshot.empty) {
          quoteDocs[assetId] = { ref: snapshot.docs[0].ref, data: snapshot.docs[0].data() };
        } else {
          // Se não existir, marcamos para criação posterior
          quoteDocs[assetId] = { ref: collectionRef.doc(), data: null };
        }
      });
      await Promise.all(readPromises);

      // =================================================================
      // ETAPA DE ESCRITA (WRITES)
      // =================================================================
      const timestamp = Timestamp.fromDate(startOfDay(targetDate));
      const updatedAssets: string[] = [];

      // Escreve os valores editados e os calculados
      for (const assetId of allAssetIds) {
        const docInfo = quoteDocs[assetId];
        const isEdited = editedValues.hasOwnProperty(assetId);
        const calculatedResult = calculationResults.find(r => r.id === assetId);

        if (isEdited) {
          const newValue = editedValues[assetId];
          const updateData = {
            data: formattedDate,
            timestamp: timestamp,
            ultimo: newValue,
            valor: newValue,
            fonte: 'Edição Manual',
            status: 'manual_edit',
            moeda: getAssetCurrency(assetId),
            ativo: getAssetName(assetId)
          };
          if (docInfo.data) {
            transaction.update(docInfo.ref, updateData);
          } else {
            transaction.set(docInfo.ref, updateData);
          }
          updatedAssets.push(assetId);
        } else if (calculatedResult) {
           const updateData: any = {
            data: formattedDate,
            timestamp: timestamp,
            valor: calculatedResult.newValue,
            ultimo: calculatedResult.newValue, // Garante que `ultimo` também é atualizado
            fonte: 'Cálculo Manual via Auditoria',
            formula: calculatedResult.formula,
            status: 'sucesso',
            ativo: calculatedResult.name,
            moeda: 'BRL',
          };
          
          if (calculatedResult.components) {
            updateData.componentes = calculatedResult.components;
          }
          if (calculatedResult.conversions) {
            updateData.conversoes = calculatedResult.conversions;
            if (calculatedResult.components?.resultado_final_usd) {
              updateData.valor_usd = calculatedResult.components.resultado_final_usd;
            }
             if (calculatedResult.components?.resultado_final_eur) {
              updateData.valor_eur = calculatedResult.components.resultado_final_eur;
            }
          }
           if (docInfo.data) {
            transaction.update(docInfo.ref, updateData);
          } else {
            transaction.set(docInfo.ref, { ...updateData, moedas: calculatedResult.conversions ? ['BRL', 'USD', 'EUR'] : ['BRL'] });
          }
          updatedAssets.push(calculatedResult.id);
        }
      }
      
      return { updatedAssets };
    });
    
    // Cria log de auditoria
    const editedAssetsForLog: Record<string, { name: string; oldValue: number; newValue: number }> = {};
    Object.entries(editedValues).forEach(([assetId, newValue]) => {
      editedAssetsForLog[assetId] = {
        name: getAssetName(assetId),
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
