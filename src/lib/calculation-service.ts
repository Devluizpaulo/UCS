
'use server';

import { getCommodityConfigs, getQuoteByDate } from '@/lib/data-service';
import type { CommodityConfig, FirestoreQuote } from '@/lib/types';
import { VUS_WEIGHTS, VUS_INTERMEDIATE_MULTIPLIER, VUS_MULTIPLIER, VMAD_MULTIPLIER, CRS_MULTIPLIER } from './constants';

// --- Type Definitions ---

type CalculationFunction = (components: Record<string, number>) => number;
export type ValueMap = Record<string, number>;

interface CalculationConfig {
    components: string[];
    calculate: CalculationFunction;
}

// --- Rentabilidade Média (Intermediate Calculations) ---

export async function calculateRentMediaBoi(precoBoi: number): Promise<number> {
    return precoBoi * 18;
}

export async function calculateRentMediaMilho(precoMilho: number): Promise<number> {
    const ton = (precoMilho / 60) * 1000;
    return ton * 7.20;
}

export async function calculateRentMediaSoja(precoSojaUSD: number, cotacaoDolar: number): Promise<number> {
    const sojaBRL = precoSojaUSD * cotacaoDolar;
    const ton = ((sojaBRL / 60) * 1000) + 0.01990; // Incluindo ajuste fino
    const fatorRentabilidade = (55 * 60) / 1000; // 3.30
    return ton * fatorRentabilidade;
}

export async function calculateRentMediaCarbono(precoCarbonoEUR: number, cotacaoEuro: number): Promise<number> {
    const carbonoBRL = precoCarbonoEUR * cotacaoEuro;
    return carbonoBRL * 2.59;
}

export async function calculateRentMediaMadeira(precoMadeiraUSD: number, cotacaoDolar: number): Promise<number> {
    const taxaConversao = 37.5620342294117 / 100;
    const madeiraToraUSD = precoMadeiraUSD * taxaConversao;
    const madeiraToraBRL = (madeiraToraUSD * cotacaoDolar) + 0.02; // Incluindo ajuste fino
    const fatorRentMedia = 1196.54547720813;
    const percentual = 0.10;
    return madeiraToraBRL * fatorRentMedia * percentual;
}

// --- Main Asset Calculation Logic ---

export async function calculateVUS(rentMedia: ValueMap): Promise<number> {
    const weightedSum = (rentMedia.boi_gordo * VUS_WEIGHTS.boi_gordo) +
                        (rentMedia.milho * VUS_WEIGHTS.milho) +
                        (rentMedia.soja * VUS_WEIGHTS.soja);
    const intermediateValue = weightedSum * VUS_INTERMEDIATE_MULTIPLIER;
    return intermediateValue * VUS_MULTIPLIER;
}

export async function calculateVMAD(rentMedia: ValueMap): Promise<number> {
    return (rentMedia.madeira || 0) * VMAD_MULTIPLIER;
}

export async function calculateCRS(rentMedia: ValueMap): Promise<number> {
    return (rentMedia.carbono || 0) * CRS_MULTIPLIER;
}

export async function calculateValorUsoSolo(components: ValueMap): Promise<number> {
    return (components.vus || 0) + (components.vmad || 0) + (components.carbono_crs || 0) + (components.Agua_CRS || 0);
}

export async function calculatePDM(components: ValueMap): Promise<number> {
    // No n8n, o PDM é uma soma complexa que é essencialmente o ValorUsoSolo.
    // PDM = (Boi×35%) + (Milho×30%) + (Soja×35%) + Madeira + Carbono + Custo_Água
    // Isso é a soma das rentabilidades, que é a base para VUS, VMAD, CRS... e Custo_Água é 7% de CH2O, que é a mesma base.
    // Simplificando, PDM é diretamente proporcional ao ValorUsoSolo
    return components.valor_uso_solo || 0;
}

export async function calculateUCS(components: ValueMap): Promise<number> {
    return (components.pdm / 900) / 2;
}

export async function calculateUCSASE(components: ValueMap): Promise<number> {
    return components.ucs * 2;
}

// --- Configuration ---

const CALCULATION_CONFIGS: Record<string, CalculationConfig> = {
    'vus': {
        components: ['soja', 'milho', 'boi_gordo', 'usd'],
        calculate: (rentMedia) => calculateVUS(rentMedia),
    },
    'vmad': {
        components: ['madeira', 'usd'],
        calculate: (rentMedia) => calculateVMAD(rentMedia),
    },
    'carbono_crs': {
        components: ['carbono', 'eur'],
        calculate: (rentMedia) => calculateCRS(rentMedia),
    },
};

// --- Public Helper Functions ---

export async function isCalculableAsset(assetId: string): Promise<boolean> {
    const staticConfigs: Record<string, string[]> = {
        'valor_uso_solo': [],
        'pdm': [],
        'ucs': [],
        'ucs_ase': [],
    };
    return assetId in CALCULATION_CONFIGS || assetId in staticConfigs;
}

export async function getAssetCompositionConfig(assetId: string): Promise<string[]> {
    if (assetId in CALCULATION_CONFIGS) {
        return CALCULATION_CONFIGS[assetId].components;
    }
    
    const staticConfigs: Record<string, string[]> = {
        'valor_uso_solo': ['vus', 'vmad', 'carbono_crs', 'Agua_CRS'],
        pdm: ['valor_uso_solo'],
        ucs: ['pdm'],
        ucs_ase: ['ucs'],
    };

    if (assetId in staticConfigs) {
        return staticConfigs[assetId];
    }
    
    return [];
}
