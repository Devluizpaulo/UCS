/**
 * This file contains constant values used across the application,
 * particularly for financial calculations, to avoid "magic numbers" in the code.
 */

// --- VUS (Valor de Uso do Solo) Calculation Constants ---

/**
 * The weights for each commodity in the VUS calculation.
 * These should sum to 1.0 (or 100%).
 */
export const VUS_WEIGHTS = {
    boi_gordo: 0.35, // 35%
    milho: 0.30,     // 30%
    soja: 0.35,      // 35%
};

/**
 * The intermediate multiplier applied to the weighted sum in the VUS calculation.
 * This value (4.80) is based on the n8n workflow.
 */
export const VUS_INTERMEDIATE_MULTIPLIER = 4.80;

/**
 * The final multiplier applied in the VUS calculation.
 */
export const VUS_MULTIPLIER = 25;


// --- VMAD (Valor da Madeira) Calculation Constants ---

/**
 * The final multiplier for the VMAD calculation.
 */
export const VMAD_MULTIPLIER = 5;


// --- CRS (Custo de Responsabilidade Socioambiental) / Carbon Calculation Constants ---

/**
 * The final multiplier for the CRS (Carbon) calculation.
 */
export const CRS_MULTIPLIER = 25;
