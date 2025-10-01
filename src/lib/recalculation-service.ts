'use server';

import { getFirebaseAdmin } from './firebase-admin-config';
import { format, startOfDay } from 'date-fns';
import type { firestore as adminFirestore } from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import * as Calc from './calculation-service';
import type { FirestoreQuote, CommodityConfig } from './types';
import { revalidatePath } from 'next/cache';

export interface ImpactedAsset {
  id: string;
  name: string;
  currency: string;
  oldValue: number;
  newValue: number;
}

type ValueMap = Record<string, number>;

/**
 * Executes the full calculation cascade based on a map of asset values.
 * This is a pure function that returns the new, fully calculated values.
 * @param initialValues - A map of asset IDs to their initial values.
 * @returns A map of asset IDs to their newly calculated values.
 */
function runCalculationCascade(initialValues: ValueMap): ValueMap {
  const newValues: ValueMap = { ...initialValues };

  // Etapa 1: Calcular as rentabilidades médias
  const rentMedia: ValueMap = {};
  rentMedia.boi_gordo = Calc.calculateRentMediaBoi(newValues.boi_gordo || 0);
  rentMedia.milho = Calc.calculateRentMediaMilho(newValues.milho || 0);
  rentMedia.soja = Calc.calculateRentMediaSoja(newValues.soja || 0, newValues.usd || 0);
  rentMedia.carbono = Calc.calculateRentMediaCarbono(newValues.carbono || 0, newValues.eur || 0);
  rentMedia.madeira = Calc.calculateRentMediaMadeira(newValues.madeira || 0, newValues.usd || 0);

  // Etapa 2: Recalcular os índices baseados nas rentabilidades
  newValues.vus = Calc.calculateVUS(rentMedia);
  newValues.vmad = Calc.calculateVMAD(rentMedia);
  newValues.carbono_crs = Calc.calculateCRS(rentMedia);
  
  // Etapa 3: Recalcular os índices subsequentes em cascata
  newValues.valor_uso_solo = Calc.calculateValorUsoSolo({
      vus: newValues.vus,
      vmad: newValues.vmad,
      carbono_crs: newValues.carbono_crs,
      Agua_CRS: newValues.Agua_CRS || 0,
  });
  newValues.pdm = Calc.calculatePDM({ valor_uso_solo: newValues.valor_uso_solo });
  newValues.ucs = Calc.calculateUCS({ pdm: newValues.pdm });
  newValues.ucs_ase = Calc.calculateUCSASE({ ucs: newValues.ucs });

  return newValues;
}

/**
 * Server Action to preview the impact of a value change without saving.
 */
export async function previewRecalculation(params: {
  targetDate: Date;
  editedAssetId: string;
  newValue: number;
  allAssetOriginalValues: ValueMap;
  allAssetsConfig: CommodityConfig[];
}): Promise<ImpactedAsset[]> {
    const { editedAssetId, newValue, allAssetOriginalValues, allAssetsConfig } = params;

    const newInitialValues = { ...allAssetOriginalValues, [editedAssetId]: newValue };
    const calculatedNewValues = runCalculationCascade(newInitialValues);

    const impacted: ImpactedAsset[] = [];
    for (const assetConfig of allAssetsConfig) {
        const id = assetConfig.id;
        const oldValue = allAssetOriginalValues[id];
        const aNewValue = calculatedNewValues[id];

        if (oldValue !== undefined && aNewValue !== undefined && Math.abs(aNewValue - oldValue) > 1e-9) {
             impacted.push({
                id,
                name: assetConfig.name,
                currency: assetConfig.currency,
                oldValue: oldValue,
                newValue: aNewValue,
            });
        }
    }
    
    // Sort impacted assets to show main indices first
    const order = ['ucs_ase', 'ucs', 'pdm', 'valor_uso_solo'];
    impacted.sort((a, b) => {
        const indexA = order.indexOf(a.id);
        const indexB = order.indexOf(b.id);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.name.localeCompare(b.name);
    });

    return impacted;
}


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

export async function recalculateAllForDate(targetDate: Date, editedValues: Record<string, number>) {
  const { db } = await getFirebaseAdmin();

  try {
    await db.runTransaction(async (transaction) => {
      const quoteDocs = await db.collection('settings').doc('commodities').get();
      const configs = Object.keys(quoteDocs.data() || {});

      const initialValues: ValueMap = {};
      const quotes: Record<string, FirestoreQuote> = {};

      for (const assetId of configs) {
        const quote = await getOrCreateQuote(db, assetId, targetDate, transaction);
        quotes[assetId] = quote;
        initialValues[assetId] = quote?.valor ?? quote?.ultimo ?? 0;
      }
      
      const valuesWithEdits = { ...initialValues, ...editedValues };
      const finalValues = runCalculationCascade(valuesWithEdits);

      for (const assetId of configs) {
        const dataToUpdate: Partial<FirestoreQuote> = {
            ultimo: finalValues[assetId],
            valor: finalValues[assetId]
        };

        if (assetId === 'valor_uso_solo') {
            dataToUpdate.componentes = {
                vus: finalValues.vus,
                vmad: finalValues.vmad,
                carbono_crs: finalValues.carbono_crs,
                Agua_CRS: finalValues.Agua_CRS
            };
        }
        
        await updateQuote(db, assetId, quotes[assetId].id, dataToUpdate, transaction);
      }
    });

    console.log(`[Recalculation] Successfully recalculated all assets for ${format(targetDate, 'dd/MM/yyyy')}`);
    revalidatePath('/admin/audit', 'page');
    return { success: true, message: "Recálculo concluído com sucesso." };
  } catch (error: any) {
    console.error('[Recalculation] Transaction failed: ', error);
    return { success: false, message: `Falha no recálculo: ${error.message}` };
  }
}
