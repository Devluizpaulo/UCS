

'use server';

import { getCommodityConfigs, getQuoteByDate } from '@/lib/data-service';
import type { CommodityConfig, FirestoreQuote } from '@/lib/types';
import { VUS_WEIGHTS, VUS_ADJUSTMENT_FACTOR, VUS_MULTIPLIER, VMAD_MULTIPLIER, CRS_MULTIPLIER } from './constants';

// --- Type Definitions ---

type CalculationFunction = (components: Record<string, number>) => number;

interface CalculationConfig {
    components: string[];
    calculate: CalculationFunction;
}

// --- Calculation Logic ---

/**
 * Calculates the VUS (Valor de Uso do Solo) based on its components.
 * Formula: SOMA(((rent_media boi*35% + rent_media milho*30% + rent_media soja*35%) - (soma ponderada)*4,80%)) * 25
 * @param components A record containing the 'rent_media' of boi_gordo, milho, and soja.
 * @returns The calculated VUS value.
 */
function calculateVUS(components: Record<string, number>): number {
    const weightedSum = (components.boi_gordo * VUS_WEIGHTS.boi_gordo) +
                        (components.milho * VUS_WEIGHTS.milho) +
                        (components.soja * VUS_WEIGHTS.soja);
    
    const adjustedSum = weightedSum * (1 - VUS_ADJUSTMENT_FACTOR);
    
    return adjustedSum * VUS_MULTIPLIER;
}


/**
 * Calculates the VMAD (Valor da Madeira).
 * Formula: rent_media madeira * 5
 * @param components A record containing the 'rent_media' of madeira.
 * @returns The calculated VMAD value.
 */
function calculateVMAD(components: Record<string, number>): number {
    return (components.madeira || 0) * VMAD_MULTIPLIER;
}


/**
 * Calculates the CRS (Custo de Responsabilidade Socioambiental).
 * Formula: rent_media carbono * 25
 * @param components A record containing the 'rent_media' of carbono.
 * @returns The calculated CRS value.
 */
function calculateCRS(components: Record<string, number>): number {
    return (components.carbono || 0) * CRS_MULTIPLIER;
}


// --- Configuration ---

/**
 * Configuration object that maps calculable asset IDs to their components and calculation functions.
 */
export const CALCULATION_CONFIGS: Record<string, CalculationConfig> = {
    'vus': {
        components: ['soja', 'milho', 'boi_gordo'],
        calculate: calculateVUS,
    },
    'vmad': {
        components: ['madeira'],
        calculate: calculateVMAD,
    },
    'carbono_crs': {
        components: ['carbono'],
        calculate: calculateCRS,
    },
};

// --- Public Helper Functions ---

/**
 * Checks if a given asset ID corresponds to an asset that should be calculated by the app.
 * @param assetId The ID of the asset to check.
 * @returns True if the asset is calculable, false otherwise.
 */
export async function isCalculableAsset(assetId: string): Promise<boolean> {
    return assetId in CALCULATION_CONFIGS;
}

/**
 * Retrieves the composition configuration for a given asset.
 * This is used to understand the dependency tree of assets.
 * @param assetId The ID of the asset.
 * @returns An array of component asset IDs, or an empty array if not found.
 */
export async function getAssetCompositionConfig(assetId: string): Promise<string[]> {
    if (await isCalculableAsset(assetId)) {
        return CALCULATION_CONFIGS[assetId].components;
    }
    
    // For non-calculable assets, try to find a static config or return empty
    const staticConfigs: Record<string, string[]> = {
        'valor_uso_solo': ['vus', 'vmad', 'carbono_crs', 'Agua_CRS'],
        pdm: ['valor_uso_solo'], // Simplified from n8n, PDM is based on Valor Uso Solo
        ucs: ['pdm'],
        ucs_ase: ['ucs'],
    };

    if (assetId in staticConfigs) {
        return staticConfigs[assetId];
    }
    
    return [];
}
