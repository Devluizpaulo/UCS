
'use server';

import type { ChartData, CommodityPriceData, HistoryInterval, UcsData, RiskAnalysisData, RiskMetric, CommodityConfig, FormulaParameters } from './types';
import type { CalculateUcsIndexOutput } from '@/ai/flows/calculate-ucs-index-flow';
import { getCommodities } from './commodity-config-service';
import { calculate_volatility, calculate_correlation } from './statistics';
import { db } from './firebase-admin-config';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';


// --- Functions to get data from FIRESTORE ---

export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const commodities = await getCommodities();
    const prices: CommodityPriceData[] = [];

    for (const commodity of commodities) {
        try {
            // Get the latest price entry to calculate the change
            const pricesCollectionRef = collection(db, 'commodities', commodity.id, 'price_entries');
            const q = query(pricesCollectionRef, orderBy('savedAt', 'desc'), limit(2));
            const querySnapshot = await getDocs(q);

            let change = 0;
            let absoluteChange = 0;

            if (querySnapshot.size > 1) {
                const latestData = querySnapshot.docs[0].data();
                const previousData = querySnapshot.docs[1].data();
                absoluteChange = latestData.price - previousData.price;
                change = previousData.price !== 0 ? (absoluteChange / previousData.price) * 100 : 0;
            }
            
            const lastUpdatedTimestamp = commodity.lastUpdated ? (commodity.lastUpdated as unknown as Timestamp) : null;
            const lastUpdated = lastUpdatedTimestamp ? lastUpdatedTimestamp.toDate().toLocaleString('pt-BR') : 'N/A';
            
            prices.push({
                ...commodity,
                price: commodity.price || 0,
                change,
                absoluteChange,
                lastUpdated,
            });

        } catch (error) {
            console.error(`Error fetching price for ${commodity.name} from Firestore:`, error);
            // Push commodity with default values if fetching details fails
            prices.push({
                ...commodity,
                price: 0,
                change: 0,
                absoluteChange: 0,
                lastUpdated: 'Erro ao carregar',
            });
        }
    }

    return prices.sort((a, b) => a.name.localeCompare(b.name));
}


export async function getUcsIndexValue(interval: HistoryInterval = '1d'): Promise<{ latest: UcsData, history: ChartData[] }> {
    const { calculateUcsIndex } = await import('@/ai/flows/calculate-ucs-index-flow');
    
    // This will calculate the index based on latest prices in DB.
    const ucsResult = await calculateUcsIndex();

    const historyCollectionRef = collection(db, 'ucs_index_history');
    
    // Determine limit based on interval
    const limitMap = { '1d': 30, '1wk': 26, '1mo': 60 };
    const qLimit = limitMap[interval] || 30;

    const q = query(historyCollectionRef, orderBy('savedAt', 'desc'), limit(qLimit));
    const querySnapshot = await getDocs(q);
    
    const history: ChartData[] = [];
    querySnapshot.forEach(doc => {
        const data = doc.data();
        const timestamp = data.savedAt as Timestamp;
        const date = timestamp.toDate();
        let formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        history.push({
            time: formattedDate,
            value: data.value,
        });
    });

    return {
        latest: ucsResult,
        history: history.reverse(),
    };
}
