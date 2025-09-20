
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

/**
 * Calculates the Custo da Agua (7%) based on the CH2OAgua value.
 * Custo da Água (7%) = CH2OAgua * 7%
 * @param ch2oAguaValue The calculated value of the CH2OAgua index.
 * @returns The calculated value of Custo da Agua.
 */
export function calculateCustoAgua(ch2oAguaValue: number): number {
    if (typeof ch2oAguaValue !== 'number') {
        return 0;
    }
    return ch2oAguaValue * 0.07;
}

/**
 * Calculates the PDM index.
 * PDM = CH2OAgua + Custo da Água
 * @param ch2oAguaValue The value of the CH2OAgua index.
 * @param custoAguaValue The value of the Custo da Água index.
 * @returns The calculated value of the PDM index.
 */
export function calculatePdm(ch2oAguaValue: number, custoAguaValue: number): number {
    if (typeof ch2oAguaValue !== 'number' || typeof custoAguaValue !== 'number') {
        return 0;
    }
    return ch2oAguaValue + custoAguaValue;
}

/**
 * Calculates the UCS index.
 * UCS = (PDM / 900) / 2
 * @param pdmValue The value of the PDM index.
 * @returns The calculated value of the UCS index.
 */
export function calculateUcs(pdmValue: number): number {
    if (typeof pdmValue !== 'number' || pdmValue === 0) {
        return 0;
    }
    return (pdmValue / 900) / 2;
}
