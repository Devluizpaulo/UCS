'use server';

import { getFirebaseAdmin } from './firebase-admin-config';
import { format, startOfDay } from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';
import * as Calc from './calculation-service';
import type { FirestoreQuote, CommodityConfig } from './types';
import { getCommodityConfigs, getQuoteByDate } from './data-service';

type QuoteMap = Record<string, FirestoreQuote>;
type ValueMap = Record<string, number>;

async function getOrCreateQuote(
  db: admin.firestore.Firestore,
  assetId: string,
  targetDate: Date,
  transaction: admin.firestore.Transaction
): Promise<FirestoreQuote> {
  const formattedDate = format(targetDate, 'dd/MM/yyyy');
  const collectionRef = db.collection(assetId);
  const query = collectionRef.where('data', '==', formattedDate).limit(1);
  const snapshot = await transaction.get(query);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as FirestoreQuote;
  } else {
    // Create a new empty quote document for that day
    const newDocRef = collectionRef.doc();
    const newQuote: Partial<FirestoreQuote> = {
      data: formattedDate,
      timestamp: Timestamp.fromDate(startOfDay(targetDate)),
      ultimo: 0,
      valor: 0,
      status: 'recalculated',
      fonte: 'Cálculo Manual via Auditoria',
    };
    transaction.set(newDocRef, newQuote);
    return { id: newDocRef.id, ...newQuote } as FirestoreQuote;
  }
}

async function updateQuote(
  db: admin.firestore.Firestore,
  assetId: string,
  quoteId: string,
  data: Partial<FirestoreQuote>,
  transaction: admin.firestore.Transaction
) {
  const docRef = db.collection(assetId).doc(quoteId);
  transaction.update(docRef, data);
}

export async function recalculateAllForDate(targetDate: Date, editedValues: Record<string, number>) {
  const { db } = await getFirebaseAdmin();
  const configs = await getCommodityConfigs();
  const configMap = new Map(configs.map(c => [c.id, c]));

  try {
    await db.runTransaction(async (transaction) => {
      const quotes: QuoteMap = {};
      const baseAssetIds = configs.filter(c => c.category !== 'index' && c.category !== 'sub-index').map(c => c.id);
      
      for (const assetId of baseAssetIds) {
        quotes[assetId] = await getOrCreateQuote(db, assetId, targetDate, transaction);
      }
      
      const values: ValueMap = {};
      for (const assetId of baseAssetIds) {
        if (editedValues.hasOwnProperty(assetId)) {
          const newValue = editedValues[assetId];
          values[assetId] = newValue;
          await updateQuote(db, assetId, quotes[assetId].id, { ultimo: newValue, valor: newValue }, transaction);
        } else {
          values[assetId] = quotes[assetId]?.ultimo ?? 0;
        }
      }
      
      const rentMedia: ValueMap = {};
      rentMedia.boi_gordo = Calc.calculateRentMediaBoi(values.boi_gordo);
      rentMedia.milho = Calc.calculateRentMediaMilho(values.milho);
      rentMedia.soja = Calc.calculateRentMediaSoja(values.soja, values.usd);
      rentMedia.carbono = Calc.calculateRentMediaCarbono(values.carbono, values.eur);
      rentMedia.madeira = Calc.calculateRentMediaMadeira(values.madeira, values.usd);
      
      const intermediateValues: ValueMap = {};
      intermediateValues.vus = Calc.calculateVUS(rentMedia);
      intermediateValues.vmad = Calc.calculateVMAD(rentMedia);
      intermediateValues.carbono_crs = Calc.calculateCRS(rentMedia);

      // Assuming Agua_CRS is manually edited or comes from a source
      const aguaCrsQuote = await getOrCreateQuote(db, 'Agua_CRS', targetDate, transaction);
      intermediateValues.Agua_CRS = editedValues.hasOwnProperty('Agua_CRS') ? editedValues.Agua_CRS : (aguaCrsQuote.ultimo ?? 0);
      values['Agua_CRS'] = intermediateValues.Agua_CRS; // Add to main values map
      await updateQuote(db, 'Agua_CRS', aguaCrsQuote.id, { ultimo: intermediateValues.Agua_CRS, valor: intermediateValues.Agua_CRS }, transaction);


      intermediateValues.valor_uso_solo = Calc.calculateValorUsoSolo(intermediateValues);
      intermediateValues.pdm = Calc.calculatePDM(intermediateValues);
      intermediateValues.ucs = Calc.calculateUCS(intermediateValues);
      intermediateValues.ucs_ase = Calc.calculateUCSASE(intermediateValues);

      const allCalculatedAssets = ['vus', 'vmad', 'carbono_crs', 'valor_uso_solo', 'pdm', 'ucs', 'ucs_ase'];
      for (const assetId of allCalculatedAssets) {
        const quote = await getOrCreateQuote(db, assetId, targetDate, transaction);
        await updateQuote(db, assetId, quote.id, { valor: intermediateValues[assetId] }, transaction);
      }
    });

    console.log(`[Recalculation] Successfully recalculated all assets for ${format(targetDate, 'dd/MM/yyyy')}`);
    return { success: true, message: "Recálculo concluído com sucesso." };
  } catch (error: any) {
    console.error('[Recalculation] Transaction failed: ', error);
    return { success: false, message: `Falha no recálculo: ${error.message}` };
  }
}
