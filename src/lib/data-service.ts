

'use server';

import type { ChartData, CommodityPriceData, HistoryInterval, UcsData, FirestoreQuote } from './types';
import { getCommodities } from './commodity-config-service';
import { db } from './firebase-admin-config';
import admin from 'firebase-admin';


// --- Functions to get data from FIRESTORE ---

/**
 * Retrieves the latest prices for all configured commodities.
 * This function is optimized to fetch all recent quotes in a single query
 * and then process them in memory, making it more efficient and resilient.
 */
export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    try {
        const [commodities, dailyQuotes] = await Promise.all([
            getCommodities(),
            getCotacoesDoDia(undefined, 200) // Fetch a larger batch of recent quotes
        ]);

        if (!commodities || commodities.length === 0) {
            console.warn('[DataService] No commodities configured.');
            return [];
        }

        // Create a map for quick lookup of the latest two prices for each asset
        const priceMap = new Map<string, { latest: FirestoreQuote, previous: FirestoreQuote | null }>();

        // Sort quotes by timestamp descending to easily find latest and previous
        dailyQuotes.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

        for (const quote of dailyQuotes) {
            if (!priceMap.has(quote.ativo)) {
                // This is the first time we see this asset, so it's the latest
                priceMap.set(quote.ativo, { latest: quote, previous: null });
            } else {
                const entry = priceMap.get(quote.ativo)!;
                if (!entry.previous) {
                    // This is the second time, so it's the previous price
                    entry.previous = quote;
                }
            }
        }
        
        // Build the final data structure
        const result = commodities.map(commodity => {
            const prices = priceMap.get(commodity.name);
            
            let currentPrice = 0;
            let change = 0;
            let absoluteChange = 0;
            let lastUpdated = 'N/A';

            if (prices?.latest) {
                currentPrice = prices.latest.ultimo || 0;
                const ts = prices.latest.timestamp as admin.firestore.Timestamp;
                lastUpdated = ts ? ts.toDate().toLocaleString('pt-BR') : 'N/A';

                if (prices.previous) {
                    const previousPrice = prices.previous.ultimo || 0;
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

        return result.sort((a, b) => {
            if (a.category === 'exchange' && b.category !== 'exchange') return -1;
            if (a.category !== 'exchange' && b.category === 'exchange') return 1;
            return a.name.localeCompare(b.name);
        });

    } catch (error) {
        console.error(`[DataService] CRITICAL: Failed to get commodity list or prices. Error: ${error}`);
        return [];
    }
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

export async function getCotacoesDoDia(ativo?: string, limit: number = 50): Promise<FirestoreQuote[]> {
    try {
        let query: admin.firestore.Query = db.collection('cotacoes_do_dia');
        
        // Only add the 'where' clause if 'ativo' is a valid, non-empty string
        if (typeof ativo === 'string' && ativo.trim() !== '' && ativo !== 'todos') {
            query = query.where('ativo', '==', ativo);
        }
        
        query = query.orderBy('timestamp', 'desc').limit(limit);
        const querySnapshot = await query.get();
        const cotacoes: any[] = [];
        
        querySnapshot.forEach(doc => {
            cotacoes.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return cotacoes;
    } catch (error: any) {
        if (error.message && error.message.includes('Could not refresh access token')) {
            console.error(`[DataService] FIREBASE AUTHENTICATION ERROR while fetching 'cotacoes_do_dia': ${error.message}. This is likely an issue with Application Default Credentials in the server environment.`);
        } else {
            console.error(`[DataService] Error fetching 'cotacoes_do_dia' for ${ativo || 'all assets'}:`, error);
        }
        return [];
    }
}

export async function getCotacoesHistorico(ativo: string, limit: number = 30): Promise<FirestoreQuote[]> {
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
            historico.push({
                id: doc.id,
                ...doc.data()
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
            const timestamp = data.savedAt as admin.firestore.Timestamp;
            const date = timestamp.toDate();
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
