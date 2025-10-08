
'use server';

import { getFirebaseAdmin } from './firebase-admin-config';
import { format, startOfDay } from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { createRecalculationLog } from './audit-log-service';
import { runCompleteSimulation, type SimulationInput, type CalculationResult } from './real-calculation-service';
import { getAssetDependency, ASSET_DEPENDENCIES, calculateAffectedAssets } from './dependency-service';

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
  allCurrentValues: Record<string, number>, // Estes são os valores da UI, mas vamos re-ler no backend
  user: string = 'Sistema'
): Promise<DirectUpdateResult> {
  const { db } = await getFirebaseAdmin();
  
  try {
    const result = await db.runTransaction(async (transaction) => {
      const allAssetIds = Object.keys(ASSET_DEPENDENCIES);
      const formattedDate = format(targetDate, 'dd/MM/yyyy');
      
      // =================================================================
      // ETAPA DE LEITURA (READS) - Ler TODOS os ativos primeiro
      // =================================================================
      const quoteDocs: Record<string, { ref: FirebaseFirestore.DocumentReference, data: FirebaseFirestore.DocumentData | null }> = {};
      const currentDbValues: Record<string, number> = {};

      const readPromises = allAssetIds.map(async (assetId) => {
        const collectionRef = db.collection(assetId);
        const query = collectionRef.where('data', '==', formattedDate).limit(1);
        const snapshot = await transaction.get(query);
        
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          quoteDocs[assetId] = { ref: doc.ref, data: data };
          currentDbValues[assetId] = data.valor ?? data.ultimo ?? 0;
        } else {
          // Se não existir, marcamos para criação e o valor atual é 0
          quoteDocs[assetId] = { ref: collectionRef.doc(), data: null };
          currentDbValues[assetId] = 0;
        }
      });
      await Promise.all(readPromises);

      // Prepara input para simulação com valores lidos do DB e edições do usuário
      const simulationInput: SimulationInput = {
        usd: editedValues.usd ?? currentDbValues.usd ?? 0,
        eur: editedValues.eur ?? currentDbValues.eur ?? 0,
        soja: editedValues.soja ?? currentDbValues.soja ?? 0,
        milho: editedValues.milho ?? currentDbValues.milho ?? 0,
        boi_gordo: editedValues.boi_gordo ?? currentDbValues.boi_gordo ?? 0,
        carbono: editedValues.carbono ?? currentDbValues.carbono ?? 0,
        madeira: editedValues.madeira ?? currentDbValues.madeira ?? 0,
        
        // Passa os valores atuais lidos do DB para comparação
        current_vus: currentDbValues.vus ?? 0,
        current_vmad: currentDbValues.vmad ?? 0,
        current_carbono_crs: currentDbValues.carbono_crs ?? 0,
        current_ch2o_agua: currentDbValues.ch2o_agua ?? 0,
        current_custo_agua: currentDbValues.custo_agua ?? 0,
        current_agua_crs: currentDbValues.Agua_CRS ?? 0,
        current_valor_uso_solo: currentDbValues.valor_uso_solo ?? 0,
        current_pdm: currentDbValues.pdm ?? 0,
        current_ucs: currentDbValues.ucs ?? 0,
        current_ucs_ase: currentDbValues.ucs_ase ?? 0,
      };
      
      // Executa simulação completa com a base de dados correta
      const calculationResults = runCompleteSimulation(simulationInput);
      const allAffectedIds = Array.from(new Set([...Object.keys(editedValues), ...calculationResults.map(r => r.id)]));
      
      // =================================================================
      // ETAPA DE ESCRITA (WRITES)
      // =================================================================
      const timestamp = Timestamp.fromDate(startOfDay(targetDate));
      const updatedAssets: string[] = [];

      for (const assetId of allAffectedIds) {
        const docInfo = quoteDocs[assetId];
        if (!docInfo) continue; // Segurança

        const isEdited = editedValues.hasOwnProperty(assetId);
        const calculatedResult = calculationResults.find(r => r.id === assetId);

        let updateData: any = {
            data: formattedDate,
            timestamp: timestamp,
            ativo: getAssetName(assetId),
            moeda: getAssetCurrency(assetId),
        };

        if (isEdited) {
          updateData = {
            ...updateData,
            ultimo: editedValues[assetId],
            valor: editedValues[assetId],
            fonte: 'Edição Manual',
            status: 'manual_edit',
          };
        } else if (calculatedResult) {
          updateData = {
            ...updateData,
            valor: calculatedResult.newValue,
            ultimo: calculatedResult.newValue,
            fonte: 'Cálculo Manual via Auditoria',
            formula: calculatedResult.formula,
            status: 'sucesso',
            componentes: calculatedResult.components,
            conversoes: calculatedResult.conversions,
            valor_usd: calculatedResult.components?.resultado_final_usd,
            valor_eur: calculatedResult.components?.resultado_final_eur,
          };
        } else {
            continue; // Se não foi editado nem calculado, não faz nada
        }

        if (docInfo.data) { // Documento existe, então atualiza
          transaction.update(docInfo.ref, updateData);
        } else { // Documento não existe, então cria
          transaction.set(docInfo.ref, updateData);
        }
        updatedAssets.push(assetId);
      }
      
      return { updatedAssets };
    });
    
    // Cria log de auditoria fora da transação
    const affectedAssetIds = calculateAffectedAssets(Object.keys(editedValues));
    const editedAssetsForLog: Record<string, { name: string; oldValue: number; newValue: number }> = {};
    Object.entries(editedValues).forEach(([assetId, newValue]) => {
      editedAssetsForLog[assetId] = {
        name: getAssetName(assetId),
        oldValue: allCurrentValues[assetId] || 0, // Usa o valor da UI para log
        newValue
      };
    });
    
    await createRecalculationLog(targetDate, editedAssetsForLog, affectedAssetIds, user);
    
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

// Funções auxiliares (inalteradas)
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
  const assetInfo = ASSET_DEPENDENCIES[assetId];
  return assetInfo ? assetInfo.name : assetId;
}
