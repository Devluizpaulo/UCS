
'use server';

import type { CommodityPriceData } from '@/lib/types';
import { saveCommodityData, saveUcsIndexData } from '@/lib/database-service';
import { calculateUcsIndex } from '@/ai/flows/calculate-ucs-index-flow';

export type StagedPrice = {
    id: string;
    name: string;
    ticker: string;
    currency: 'BRL' | 'USD' | 'EUR';
    category: 'exchange' | 'vus' | 'vmad' | 'crs';
    description: string;
    unit: string;
    source?: string;
    price: number;
    lastUpdated: string;
};


export async function saveConfirmedPrices(prices: StagedPrice[]): Promise<{ success: boolean; message: string; newIndexValue?: number }> {
    try {
        const pricesToSave: CommodityPriceData[] = prices.map(p => ({
            ...p,
            change: 0, // Not calculated in this flow
            absoluteChange: 0, // Not calculated in this flow
        }));
        
        await saveCommodityData(pricesToSave);
        const ucsResult = await calculateUcsIndex();
        await saveUcsIndexData(ucsResult);

        return { success: true, message: 'Preços salvos e índice recalculado com sucesso!', newIndexValue: ucsResult.indexValue };
    } catch (error) {
        console.error('Failed to save prices and recalculate index:', error);
        return { success: false, message: 'Ocorreu um erro ao salvar os dados.' };
    }
}
