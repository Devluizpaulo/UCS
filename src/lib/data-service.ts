
'use server';

import type { ChartData, CommodityPriceData, HistoryInterval, UcsData } from './types';
import { getCommodities } from './commodity-config-service';
import { db } from './firebase-admin-config';
import type admin from 'firebase-admin';


// --- Functions to get data from FIRESTORE ---

export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const commodities = await getCommodities();
    const prices: CommodityPriceData[] = [];

    // Use Promise.all to fetch prices in parallel for better performance
    const pricePromises = commodities.map(async (commodity) => {
        try {
            // Get the latest price entry to calculate the change
            const pricesCollectionRef = db.collection('commodities').doc(commodity.id).collection('price_entries');
            const q = pricesCollectionRef.orderBy('savedAt', 'desc').limit(2);
            const querySnapshot = await q.get();

            let change = 0;
            let absoluteChange = 0;
            let currentPrice = 0;
            let lastUpdated = 'N/A';

            if (querySnapshot.docs.length > 0) {
                 const latestDoc = querySnapshot.docs[0];
                 const latestData = latestDoc.data();
                 currentPrice = latestData.price;
                 
                 const lastUpdatedTimestamp = latestData.savedAt as admin.firestore.Timestamp;
                 lastUpdated = lastUpdatedTimestamp ? lastUpdatedTimestamp.toDate().toLocaleString('pt-BR') : 'N/A';

                 if (querySnapshot.docs.length > 1) {
                    const previousData = querySnapshot.docs[1].data();
                    absoluteChange = latestData.price - previousData.price;
                    change = previousData.price !== 0 ? (absoluteChange / previousData.price) * 100 : 0;
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
            console.error(`Error fetching price for ${commodity.name} from Firestore:`, error);
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
