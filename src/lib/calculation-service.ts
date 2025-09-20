import type { FirestoreQuote } from "./types";

interface RentMediaValues {
    boi_gordo: number;
    milho: number;
    soja: number;
    madeira: number;
    carbono: number;
}

/**
 * Calculates the value of the CH2OAgua index based on the rent_media of its component assets.
 * CH2O Água = (rent_media boi_gordo × 35%) + (rent_media milho × 30%) + (rent_media soja × 35%) + (rent_media madeira) + (rent_media carbono)
 * @param values An object containing the rent_media for each required asset.
 * @returns The calculated value of the CH2OAgua index.
 */
export function calculateCh2oAgua(values: RentMediaValues): number {
    const { boi_gordo, milho, soja, madeira, carbono } = values;

    if ([boi_gordo, milho, soja, madeira, carbono].some(v => typeof v !== 'number' || v === undefined)) {
        console.warn('[CalculationService] Missing one or more rent_media values for CH2OAgua calculation. Inputs:', values);
        return 0;
    }

    const ch2oAguaValue =
        (boi_gordo * 0.35) +
        (milho * 0.30) +
        (soja * 0.35) +
        madeira +
        carbono;
    
    return ch2oAguaValue;
}
