

'use server';

import type { ChartData, CommodityPriceData, HistoryInterval, UcsData, FirestoreQuote } from './types';
import { getCommodities } from './commodity-config-service';
import { ASSET_COLLECTION_MAP } from './marketdata-config';
import { db } from './firebase-admin-config';
import admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';


// --- Functions to get data from FIRESTORE ---

/**
 * Busca dados de uma coleção específica por ativo
 */
export async function getAssetData(assetName: string, limit: number = 10): Promise<FirestoreQuote[]> {
    try {
        const collectionName = ASSET_COLLECTION_MAP[assetName];
        if (!collectionName) {
            console.warn(`[DataService] No collection mapping found for asset: ${assetName}`);
            return [];
        }

        const query = db.collection(collectionName)
            .orderBy('timestamp', 'desc')
            .limit(limit);
            
        const querySnapshot = await query.get();
        const data: FirestoreQuote[] = [];
        
        querySnapshot.forEach(doc => {
            const docData = doc.data();
            // Convert Firestore Timestamp to serializable format
            const serializedData = {
                ...docData,
                timestamp: docData.timestamp?.toDate?.() || docData.timestamp,
                data: docData.data?.toDate?.() || docData.data
            };
            data.push({
                id: doc.id,
                ...serializedData
            } as FirestoreQuote);
        });
        
        return data;
    } catch (error) {
        console.error(`[DataService] Error fetching data for asset ${assetName}:`, error);
        return [];
    }
}

/**
 * Retrieves the latest prices for all configured commodities.
 * This function now reads from individual asset collections.
 */
export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    try {
        const commodities = await getCommodities();

        if (!commodities || commodities.length === 0) {
            console.warn('[DataService] No commodities configured.');
            return [];
        }

        // Fetch data for each commodity from its specific collection
        const pricePromises = commodities.map(async (commodity) => {
            const assetData = await getAssetData(commodity.name, 2); // Get latest 2 records for comparison
            
            let currentPrice = 0;
            let change = 0;
            let absoluteChange = 0;
            let lastUpdated = 'N/A';

            if (assetData.length > 0) {
                const latest = assetData[0];
                currentPrice = latest.ultimo || 0;
                const ts = latest.timestamp;
                if (ts instanceof Timestamp) {
                    lastUpdated = ts.toDate().toLocaleString('pt-BR');
                } else if (ts instanceof Date) {
                    lastUpdated = ts.toLocaleString('pt-BR');
                } else if (ts) {
                    lastUpdated = new Date(ts).toLocaleString('pt-BR');
                } else {
                    lastUpdated = 'N/A';
                }

                if (assetData.length > 1) {
                    const previous = assetData[1];
                    const previousPrice = previous.ultimo || 0;
                    if (previousPrice !== 0) {
                        absoluteChange = currentPrice - previousPrice;
                        change = (absoluteChange / previousPrice) * 100;
                    }
                }
            }

            return {
                ...commodity,
                price: currentPrice,
                change,
                absoluteChange,
                lastUpdated,
            };
        });

        const result = await Promise.all(pricePromises);
        
        return result.sort((a, b) => {
            if (a.category === 'exchange' && b.category !== 'exchange') return -1;
            if (a.category !== 'exchange' && b.category === 'exchange') return 1;
            return a.name.localeCompare(b.name);
        });

    } catch (error) {
        console.error(`[DataService] CRITICAL: Failed to get commodity prices. Error: ${error}`);
        return [];
    }
}

/**
 * Função legada mantida para compatibilidade - agora redireciona para getAssetData
 */
export async function getCotacoesDoDia(ativo?: string, limit: number = 50): Promise<FirestoreQuote[]> {
    if (!ativo || ativo === 'todos') {
        // Se não especificar ativo, retorna dados de todas as coleções
        const allData: FirestoreQuote[] = [];
        for (const [assetName] of Object.entries(ASSET_COLLECTION_MAP)) {
            const data = await getAssetData(assetName, limit);
            allData.push(...data);
        }
        return allData.sort((a, b) => {
            const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
            const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
            return bTime - aTime;
        }).slice(0, limit);
    }
    
    return await getAssetData(ativo, limit);
}


export async function organizeCotacoesHistorico(): Promise<{ success: boolean; message: string; }> {
    try {
        const cotacoesDoDiaRef = db.collection('cotacoes_do_dia');
        const querySnapshot = await cotacoesDoDiaRef.get();

        if (querySnapshot.empty) {
            return { success: true, message: 'Nenhuma cotação nova para organizar.' };
        }

        let batch = db.batch();
        let batchCount = 0;
        let processedCount = 0;

        for (const doc of querySnapshot.docs) {
            const data = doc.data();
            const ativo = data.ativo;
            const dataStr = data.data; // Format: "07/09/2025"
            
            if (ativo && dataStr) {
                const dateParts = dataStr.split('/');
                if (dateParts.length !== 3) continue; 
                const formattedDateId = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                
                const normalizedAtivoId = ativo.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                
                const historicoRef = db.collection('cotacoes_historico')
                    .doc(normalizedAtivoId)
                    .collection('dados')
                    .doc(formattedDateId);
                
                batch.set(historicoRef, {
                    ...data,
                    organized_at: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                
                batch.delete(doc.ref);
                
                batchCount+=2;
                processedCount++;
                
                if (batchCount >= 450) {
                    await batch.commit();
                    batch = db.batch();
                    batchCount = 0;
                }
            }
        }

        if (batchCount > 0) {
            await batch.commit();
        }

        console.log(`${processedCount} cotações foram organizadas com sucesso.`);
        return { success: true, message: `${processedCount} cotações organizadas com sucesso!` };

    } catch (error: any) {
        console.error('Erro ao organizar cotações históricas:', error);
        const errorMessage = error.message.includes('Could not refresh access token')
            ? 'Falha na autenticação com o banco de dados. Tente novamente mais tarde.'
            : 'Ocorreu um erro desconhecido ao organizar os dados.';
        return { success: false, message: errorMessage };
    }
}


export async function getCotacoesHistorico(ativo: string, limit: number = 30): Promise<FirestoreQuote[]> {
    try {
        // Usa a nova função getAssetData para buscar dados históricos
        return await getAssetData(ativo, limit);
    } catch (error) {
        console.error(`Erro ao buscar histórico para ${ativo}:`, error);
        return [];
    }
}

/**
 * Função legada para compatibilidade com a estrutura antiga de cotacoes_historico
 */
export async function getCotacoesHistoricoLegacy(ativo: string, limit: number = 30): Promise<FirestoreQuote[]> {
    try {
        const normalizedAtivoId = ativo.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        
        const historicoRef = db.collection('cotacoes_historico')
            .doc(normalizedAtivoId)
            .collection('dados')
            .orderBy('timestamp', 'desc')
            .limit(limit);
            
        const querySnapshot = await historicoRef.get();
        const historico: any[] = [];
        
        querySnapshot.forEach(doc => {
            const data = doc.data();
            // Convert Firestore Timestamp to serializable format
            const serializedData = {
                ...data,
                timestamp: data.timestamp?.toDate?.() || data.timestamp,
                data: data.data?.toDate?.() || data.data
            };
            historico.push({
                id: doc.id,
                ...serializedData
            });
        });
        
        return historico;
    } catch (error) {
        console.error(`Erro ao buscar histórico para ${ativo}:`, error);
        return [];
    }
}

export async function getUcsIndexValue(interval: HistoryInterval = '1d'): Promise<{ latest: UcsData, history: ChartData[] }> {
    const historyCollectionRef = db.collection('ucs_index_history');
    
    const limitMap = { '1d': 30, '1wk': 26, '1mo': 60 };
    const qLimit = limitMap[interval] || 30;

    let latestData: UcsData = {
        indexValue: 0, isConfigured: false,
        components: { vm: 0, vus: 0, crs: 0 },
        vusDetails: { pecuaria: 0, milho: 0, soja: 0 }
    };
    const history: ChartData[] = [];

    try {
        const q = historyCollectionRef.orderBy('savedAt', 'desc').limit(qLimit);
        const querySnapshot = await q.get();
        
        if (!querySnapshot.empty) {
            const latestDoc = querySnapshot.docs[0];
            const data = latestDoc.data();
            latestData = {
                indexValue: data.value,
                isConfigured: data.isConfigured ?? false, 
                components: data.components ?? { vm: 0, vus: 0, crs: 0 },
                vusDetails: data.vusDetails ?? { pecuaria: 0, milho: 0, soja: 0 }
            };
        } else {
            const formulaDoc = await db.collection('settings').doc('formula_parameters').get();
            if (formulaDoc.exists) {
                latestData.isConfigured = formulaDoc.data()?.isConfigured ?? false;
            }
        }

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const timestamp = data.savedAt;
            const date = timestamp?.toDate ? timestamp.toDate() : (timestamp ? new Date(timestamp) : new Date());
            let formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            history.push({
                time: formattedDate,
                value: data.value,
            });
        });
    } catch (error) {
        console.error(`[DataService] Failed to get index history. Error: ${error}`);
        try {
            const formulaDoc = await db.collection('settings').doc('formula_parameters').get();
             if (formulaDoc && formulaDoc.exists) {
                latestData.isConfigured = formulaDoc.data()?.isConfigured ?? false;
            }
        } catch(e) {
             console.error(`[DataService] CRITICAL: Could not even fetch formula status after initial failure. Error: ${e}`);
             latestData.isConfigured = false;
        }
    }


    return {
        latest: latestData,
        history: history.reverse(),
    };
}


/**
 * Saves a batch of commodity price data to Firestore. This is meant to be called by a trusted
 * server-side process (like a Genkit flow or a dedicated API route) to populate the daily quotes.
 *
 * @param {Omit<FirestoreQuote, 'id' | 'timestamp'>[]} quotes - An array of quote data objects.
 * @returns {Promise<void>}
 */
export async function saveLatestQuotes(quotes: Omit<FirestoreQuote, 'id' | 'timestamp'>[]): Promise<void> {
  if (!quotes || quotes.length === 0) {
    console.log('[DataService] No quote data provided to save.');
    return;
  }
  console.log(`[DataService] Starting batched write for ${quotes.length} quotes.`);
  const batch = db.batch();
  const collectionRef = db.collection('cotacoes_do_dia');

  quotes.forEach((quote) => {
    const docRef = collectionRef.doc(); // Auto-generate ID
    
    const dataToSave = {
        ...quote,
        timestamp: admin.firestore.FieldValue.serverTimestamp(), // Add server-side timestamp
    };

    batch.set(docRef, dataToSave);
  });

  try {
    await batch.commit();
    console.log('[DataService] Batched quote write completed successfully.');
  } catch (error) {
    console.error('[DataService] Batched quote write failed:', error);
    throw new Error('Failed to save latest quotes.');
  }
}

/**
 * Migrates data from cotacoes_do_dia collection to organized collections by asset and date
 * Structure: {ativo_normalizado}/{data_normalizada}
 * @param onlyRecent - If true, only processes documents from the last 24 hours
 */
export async function migrateDataToOrganizedCollections(onlyRecent: boolean = false): Promise<{ success: boolean; message: string; processed: number }> {
  try {
    console.log('[DataService] Starting data migration to organized collections...');
    
    // Get documents from cotacoes_do_dia
    let cotacoesDoDiaRef = db.collection('cotacoes_do_dia');
    
    if (onlyRecent) {
      // Only process documents from the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      cotacoesDoDiaRef = cotacoesDoDiaRef.where('timestamp', '>=', yesterday) as any;
    }
    
    const snapshot = await cotacoesDoDiaRef.get();
    
    if (snapshot.empty) {
      return { success: true, message: 'No data to migrate', processed: 0 };
    }
    
    let processedCount = 0;
    const batch = db.batch();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Skip if already processed (has migrated_at field)
      if (data.migrated_at && onlyRecent) {
        return;
      }
      
      // Normalize asset name for collection name
      const normalizedAsset = data.ativo
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      
      // Normalize date for document ID (DD-MM-YYYY format)
      let normalizedDate = '';
      if (data.data) {
        // Convert DD/MM/YYYY to DD-MM-YYYY
        normalizedDate = data.data.replace(/\//g, '-');
      } else if (data.timestamp) {
        // Convert timestamp to DD-MM-YYYY format
        const date = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        normalizedDate = date.toLocaleDateString('pt-BR').replace(/\//g, '-');
      }
      
      if (!normalizedAsset || !normalizedDate) {
        console.warn(`[DataService] Skipping document ${doc.id} - missing asset or date`);
        return;
      }
      
      // Create document in organized structure: {asset}/{date}
      const organizedDocRef = db.collection(normalizedAsset).doc(normalizedDate);
      
      // Prepare data with source information
      const organizedData = {
        ...data,
        fonte_original: data.fonte || 'n8n',
        migrated_from: 'cotacoes_do_dia',
        migrated_at: admin.firestore.FieldValue.serverTimestamp(),
        original_doc_id: doc.id
      };
      
      batch.set(organizedDocRef, organizedData, { merge: true });
      
      // Mark original document as processed
      const originalDocRef = db.collection('cotacoes_do_dia').doc(doc.id);
      batch.update(originalDocRef, {
        migrated_at: admin.firestore.FieldValue.serverTimestamp(),
        organized_to: `${normalizedAsset}/${normalizedDate}`
      });
      
      processedCount++;
    });
    
    // Commit the batch
    await batch.commit();
    
    console.log(`[DataService] Migration completed successfully. Processed ${processedCount} documents.`);
    return { 
      success: true, 
      message: `Successfully migrated ${processedCount} documents to organized collections`, 
      processed: processedCount 
    };
    
  } catch (error: any) {
    console.error('[DataService] Migration failed:', error);
    return { 
      success: false, 
      message: `Migration failed: ${error.message}`, 
      processed: 0 
    };
  }
}

/**
 * Automatically reorganizes new data from cotacoes_do_dia
 * This function is designed to be called by webhooks or scheduled tasks
 */
export async function autoReorganizeNewData(): Promise<{ success: boolean; message: string; processed: number }> {
  return await migrateDataToOrganizedCollections(true);
}

/**
 * Gets data from organized collection structure
 * @param asset - Asset name (will be normalized)
 * @param date - Date in DD/MM/YYYY or DD-MM-YYYY format
 */
export async function getOrganizedAssetData(asset: string, date?: string): Promise<any[]> {
  try {
    const normalizedAsset = asset
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    const collectionRef = db.collection(normalizedAsset);
    
    if (date) {
      // Get specific date
      const normalizedDate = date.replace(/\//g, '-');
      const docRef = collectionRef.doc(normalizedDate);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        if (data) {
            // Convert Firestore Timestamp to serializable format
            const serializedData = {
                ...data,
                timestamp: data.timestamp?.toDate?.() || data.timestamp,
                data: data.data?.toDate?.() || data.data
            };
            return [{ id: doc.id, ...serializedData }];
         }
      } else {
        return [];
      }
    } else {
      // Get all dates for this asset
      const snapshot = await collectionRef.orderBy('timestamp', 'desc').get();
      const results: any[] = [];
      
      snapshot.forEach(doc => {
            const data = doc.data();
            if (!data) return;
            // Convert Firestore Timestamp to serializable format
            const serializedData = {
              ...data,
              timestamp: data.timestamp?.toDate?.() || data.timestamp,
              data: data.data instanceof Date ? data.data : (data.data?.toDate?.() || data.data)
            };
        results.push({
          id: doc.id,
          ...serializedData
        });
      });
      
      return results;
    }
  } catch (error: any) {
    console.error(`[DataService] Error getting organized data for ${asset}:`, error);
    return [];
  }
}
