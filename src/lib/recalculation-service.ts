
'use server';

import { getFirebaseAdmin } from './firebase-admin-config';
import { format, startOfDay } from 'date-fns';
import type { firestore as adminFirestore } from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { runCompleteSimulation, type SimulationInput } from './real-calculation-service';
import type { FirestoreQuote } from './types';
import { revalidatePath } from 'next/cache';
import { createRecalculationLog } from './audit-log-service';
import { ASSET_DEPENDENCIES } from './dependency-service';

type ValueMap = Record<string, number>;

// --- Firestore Interaction ---

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
    // Create a new empty quote document for that day
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

export async function recalculateAllForDate(
  targetDate: Date, 
  editedValues: Record<string, number>,
  user: string = 'Sistema'
) {
  const { db } = await getFirebaseAdmin();

  try {
    let editedAssets: Record<string, { name: string; oldValue: number; newValue: number }> = {};
    let affectedAssets: string[] = [];

    await db.runTransaction(async (transaction) => {
      const quoteDocs = await db.collection('settings').doc('commodities').get();
      const configs = Object.keys(quoteDocs.data() || {});
      const commoditySettings = quoteDocs.data() || {};

      const initialValues: ValueMap = {};
      const quotes: Record<string, FirestoreQuote> = {};

      for (const assetId of configs) {
        const quote = await getOrCreateQuote(db, assetId, targetDate, transaction);
        quotes[assetId] = quote;
        initialValues[assetId] = quote?.valor ?? quote?.ultimo ?? (quote as any)?.valor_brl ?? 0;
      }
      
      for (const [assetId, newValue] of Object.entries(editedValues)) {
        const oldValue = initialValues[assetId] || 0;
        const assetName = commoditySettings[assetId]?.name || assetId;
        editedAssets[assetId] = { name: assetName, oldValue, newValue };
      }
      
      const valuesWithEdits = { ...initialValues, ...editedValues };
      
      // Use o real-calculation-service como única fonte da verdade
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

      const finalValues: ValueMap = { ...valuesWithEdits };
      calculationResults.forEach(result => {
        finalValues[result.id] = result.newValue;
      });

      affectedAssets = Object.keys(finalValues).filter(id => initialValues[id] !== finalValues[id] && !editedValues[id]);

      for (const assetId of configs) {
        if (finalValues[assetId] === undefined) continue;

        const dataToUpdate: Partial<FirestoreQuote> = {
            ultimo: finalValues[assetId],
            valor: finalValues[assetId]
        };
        
        const result = calculationResults.find(r => r.id === assetId);
        if (result) {
            dataToUpdate.componentes = result.components;
            dataToUpdate.conversoes = result.conversions;
            if(assetId === 'ucs_ase') {
              dataToUpdate.valor_usd = result.components?.resultado_final_usd;
              dataToUpdate.valor_eur = result.components?.resultado_final_eur;
            }
        }

        await updateQuote(db, assetId, quotes[assetId].id, dataToUpdate, transaction);
      }
    });

    if (Object.keys(editedAssets).length > 0) {
      await createRecalculationLog(targetDate, editedAssets, affectedAssets, user);
    }

    console.log(`[Recalculation] Successfully recalculated all assets for ${format(targetDate, 'dd/MM/yyyy')}`);
    revalidatePath('/admin/audit', 'page');
    return { success: true, message: "Recálculo concluído com sucesso." };
  } catch (error: any) {
    console.error('[Recalculation] Transaction failed: ', error);
    return { success: false, message: `Falha no recálculo: ${error.message}` };
  }
}
