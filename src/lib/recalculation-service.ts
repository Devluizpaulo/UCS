'use server';

import { getFirebaseAdmin } from './firebase-admin-config';
import { format, startOfDay } from 'date-fns';
import type { firestore as adminFirestore } from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import * as Calc from './calculation-service';
import type { FirestoreQuote, CommodityConfig } from './types';
import { getCommodityConfigs, getQuoteByDate } from './data-service';

type QuoteMap = Record<string, FirestoreQuote>;
type ValueMap = Record<string, number>;

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
      timestamp: Timestamp.fromDate(startOfDay(targetDate)),
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
  // Remove o ID para não tentar salvá-lo no documento
  const { id, ...updateData } = data;
  transaction.update(docRef, updateData);
}

export async function recalculateAllForDate(targetDate: Date, editedValues: Record<string, number>) {
  const { db } = await getFirebaseAdmin();
  const configs = await getCommodityConfigs();
  const configMap = new Map(configs.map(c => [c.id, c]));

  try {
    await db.runTransaction(async (transaction) => {
      const quotes: QuoteMap = {};
      const allAssetIds = configs.map(c => c.id);
      
      // 1. Obter ou criar todos os documentos de cotação para o dia
      for (const assetId of allAssetIds) {
        quotes[assetId] = await getOrCreateQuote(db, assetId, targetDate, transaction);
      }
      
      const values: ValueMap = {};
      
      // 2. Preencher os valores iniciais (editados e do banco)
      for (const assetId of allAssetIds) {
        if (editedValues.hasOwnProperty(assetId)) {
          values[assetId] = editedValues[assetId];
        } else {
          // Usa 'valor' para calculados e 'ultimo' para cotados como fallback
          values[assetId] = quotes[assetId]?.valor ?? quotes[assetId]?.ultimo ?? 0;
        }
      }

      // 3. Calcular as rentabilidades médias com os valores atualizados
      const rentMedia: ValueMap = {};
      rentMedia.boi_gordo = await Calc.calculateRentMediaBoi(values.boi_gordo);
      rentMedia.milho = await Calc.calculateRentMediaMilho(values.milho);
      rentMedia.soja = await Calc.calculateRentMediaSoja(values.soja, values.usd);
      rentMedia.carbono = await Calc.calculateRentMediaCarbono(values.carbono, values.eur);
      rentMedia.madeira = await Calc.calculateRentMediaMadeira(values.madeira, values.usd);
      
      // 4. Recalcular todos os índices em cascata
      values.vus = await Calc.calculateVUS(rentMedia);
      values.vmad = await Calc.calculateVMAD(rentMedia);
      values.carbono_crs = await Calc.calculateCRS(rentMedia);

      // 'Agua_CRS' é tratado como um valor base, pode ter sido editado
      values.Agua_CRS = values.Agua_CRS; 

      values.valor_uso_solo = await Calc.calculateValorUsoSolo({
          vus: values.vus,
          vmad: values.vmad,
          carbono_crs: values.carbono_crs,
          Agua_CRS: values.Agua_CRS
      });
      values.pdm = await Calc.calculatePDM({ valor_uso_solo: values.valor_uso_solo });
      values.ucs = await Calc.calculateUCS({ pdm: values.pdm });
      values.ucs_ase = await Calc.calculateUCSASE({ ucs: values.ucs });

      // 5. Atualizar todos os documentos no Firestore dentro da transação
      for (const assetId of allAssetIds) {
        const dataToUpdate: Partial<FirestoreQuote> = {
            ultimo: values[assetId],
            valor: values[assetId]
        };

        // Adiciona os componentes para os índices calculados
        if (assetId === 'valor_uso_solo') {
            dataToUpdate.componentes = {
                vus: values.vus,
                vmad: values.vmad,
                carbono_crs: values.carbono_crs,
                Agua_CRS: values.Agua_CRS
            };
        }
        
        await updateQuote(db, assetId, quotes[assetId].id, dataToUpdate, transaction);
      }
    });

    console.log(`[Recalculation] Successfully recalculated all assets for ${format(targetDate, 'dd/MM/yyyy')}`);
    return { success: true, message: "Recálculo concluído com sucesso." };
  } catch (error: any) {
    console.error('[Recalculation] Transaction failed: ', error);
    return { success: false, message: `Falha no recálculo: ${error.message}` };
  }
}
