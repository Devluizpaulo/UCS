

'use server';

import type { ChartData, CommodityPriceData, HistoryInterval, UcsData } from './types';
import { getCommodities } from './commodity-config-service';
import { db } from './firebase-admin-config';
import admin from 'firebase-admin';


// --- Functions to get data from FIRESTORE ---

export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    try {
        const commodities = await getCommodities();

        // Use Promise.all to fetch prices in parallel for better performance
        const pricePromises = commodities.map(async (commodity) => {
            try {
                // Query the new `cotacoes_do_dia` collection based on the asset name
                const pricesCollectionRef = db.collection('cotacoes_do_dia');
                const q = pricesCollectionRef
                    .where('ativo', '==', commodity.name)
                    .orderBy('timestamp', 'desc')
                    .limit(2);
                    
                const querySnapshot = await q.get();

                let change = 0;
                let absoluteChange = 0;
                let currentPrice = 0;
                let lastUpdated = 'N/A';

                if (querySnapshot.docs.length > 0) {
                     const latestDoc = querySnapshot.docs[0];
                     const latestData = latestDoc.data();
                     
                     // Use 'ultimo' field for price as per the new schema
                     currentPrice = latestData.ultimo || 0;
                     
                     const lastUpdatedTimestamp = latestData.timestamp as admin.firestore.Timestamp;
                     lastUpdated = lastUpdatedTimestamp ? lastUpdatedTimestamp.toDate().toLocaleString('pt-BR') : 'N/A';

                     if (querySnapshot.docs.length > 1) {
                        const previousData = querySnapshot.docs[1].data();
                        const previousPrice = previousData.ultimo || 0;
                        absoluteChange = currentPrice - previousPrice;
                        change = previousPrice !== 0 ? (absoluteChange / previousPrice) * 100 : 0;
                     }
                }
                
                return {
                    ...commodity,
                    price: currentPrice,
                    change,
                    absoluteChange,
                    lastUpdated,
                };

            } catch (error) {
                console.error(`Error fetching price for ${commodity.name} from 'cotacoes_do_dia':`, error);
                // Return commodity with default values if fetching details fails, ensuring it's always displayed.
                return {
                    ...commodity,
                    price: 0,
                    change: 0,
                    absoluteChange: 0,
                    lastUpdated: 'Erro ao carregar',
                };
            }
        });

        const settledPrices = await Promise.all(pricePromises);

        return settledPrices.sort((a, b) => {
            // Prioritize 'exchange' category
            if (a.category === 'exchange' && b.category !== 'exchange') {
                return -1;
            }
            if (a.category !== 'exchange' && b.category === 'exchange') {
                return 1;
            }
            // Then sort by name
            return a.name.localeCompare(b.name);
        });
    } catch (error) {
        console.error(`[DataService] Failed to get commodity list. Error: ${error}`);
        // If we can't even get the list of commodities, return an empty array.
        return [];
    }
}
// Function to organize daily quotes into historical subcollections
export async function organizeCotacoesHistorico(): Promise<{ success: boolean; message: string; }> {
    try {
        const cotacoesDoDiaRef = db.collection('cotacoes_do_dia');
        const querySnapshot = await cotacoesDoDiaRef.get();

        if (querySnapshot.empty) {
            return { success: true, message: 'Nenhuma cotação nova para organizar.' };
        }

        const batch = db.batch();
        let batchCount = 0;

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const ativo = data.ativo;
            const dataStr = data.data; // Format: "07/09/2025"
            
            if (ativo && dataStr) {
                // Convert date format from "07/09/2025" to a safe document ID "2025-09-07"
                const dateParts = dataStr.split('/');
                const formattedDateId = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                
                // Normalize asset name for document ID (e.g., "Soja Futuros" -> "soja_futuros")
                const normalizedAtivoId = ativo.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                
                // Create reference to historical subcollection
                const historicoRef = db.collection('cotacoes_historico')
                    .doc(normalizedAtivoId)
                    .collection('dados')
                    .doc(formattedDateId);
                
                // Add to batch
                batch.set(historicoRef, {
                    ...data,
                    organized_at: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                
                batchCount++;
                
                // Firestore batch limit is 500 operations. Commit and create a new batch.
                if (batchCount >= 450) {
                    batch.commit();
                    batchCount = 0;
                }
            }
        });

        // Commit remaining operations
        if (batchCount > 0) {
            await batch.commit();
        }

        console.log('Cotações organizadas em subcoleções históricas com sucesso');
        return { success: true, message: 'Cotações organizadas com sucesso!' };

    } catch (error: any) {
        console.error('Erro ao organizar cotações históricas:', error);
        // Provide a more specific error message if possible
        const errorMessage = error.message.includes('Could not refresh access token')
            ? 'Falha na autenticação com o banco de dados. Tente novamente mais tarde.'
            : 'Ocorreu um erro desconhecido ao organizar os dados.';
        return { success: false, message: errorMessage };
    }
}

// Function to get historical quotes for a specific asset
export async function getCotacoesHistorico(ativo: string, limit: number = 30): Promise<any[]> {
    try {
        const normalizedAtivoId = ativo.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0--9_]/g, '');
        
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
                isConfigured: data.isConfigured ?? false, // Ensure isConfigured exists
                components: data.components ?? { vm: 0, vus: 0, crs: 0 },
                vusDetails: data.vusDetails ?? { pecuaria: 0, milho: 0, soja: 0 }
            };
        } else {
            // If no history, check if formula is configured to show correct status
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
        // In case of error, we will return the default latestData and an empty history array
        // to prevent the app from crashing.
        const formulaDoc = await db.collection('settings').doc('formula_parameters').get().catch(() => null);
        if (formulaDoc && formulaDoc.exists) {
            latestData.isConfigured = formulaDoc.data()?.isConfigured ?? false;
        }
    }


    return {
        latest: latestData,
        history: history.reverse(),
    };
}
