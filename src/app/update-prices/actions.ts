'use server';

import { saveCommodityData, saveUcsIndexData } from "@/lib/database-service";
import type { CommodityPriceData } from "@/lib/types";
import { calculateUcsIndex } from "@/ai/flows/calculate-ucs-index-flow";

type StagedPrice = {
  id: string;
  name: string;
  ticker: string;
  currency: 'BRL' | 'USD' | 'EUR';
  price: number;
  category: 'exchange' | 'vus' | 'vmad' | 'crs';
  description: string;
  unit: string;
  source?: 'MarketData' | 'Yahoo Finance';
};

// Server action to save confirmed prices
export async function saveConfirmedPrices(prices: StagedPrice[]): Promise<{ success: boolean; message: string; newIndexValue?: number }> {
    try {
        const pricesToSave: CommodityPriceData[] = prices.map(p => ({
            ...p,
            change: 0, 
            absoluteChange: 0,
            lastUpdated: new Date().toISOString(),
        }));

        await saveCommodityData(pricesToSave);

        const ucsResult = await calculateUcsIndex();
        await saveUcsIndexData(ucsResult);

        return {
            success: true,
            message: 'Preços salvos e índice recalculado com sucesso.',
            newIndexValue: ucsResult.indexValue,
        };

    } catch (error) {
        console.error("[Save Action] Error:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Um erro desconhecido ocorreu.",
        };
    }
}
