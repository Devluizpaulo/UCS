
'use server';
/**
 * @fileOverview A service for managing the UCS Index formula parameters in Firestore.
 */

import { db } from './firebase-admin-config'; // Use server-side admin SDK
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { FormulaParameters } from './types';
import type { CalculateUcsIndexOutput } from '@/ai/flows/calculate-ucs-index-flow';

// The document ID for the formula parameters in Firestore
const FORMULA_DOC_ID = 'formula_parameters';
const SETTINGS_COLLECTION = 'settings';

// Default values for the formula parameters, in case they don't exist in the database yet.
const defaultParameters: FormulaParameters = {
    VOLUME_MADEIRA_HA: 120,      // m³ de madeira comercial por hectare
    FATOR_CARBONO: 2.59,         // tCO₂ estocadas por m³ de madeira
    PROD_BOI: 18,                // Produção de arrobas de boi por ha/ano
    PROD_MILHO: 7.2,             // Produção de toneladas de milho por ha/ano
    PROD_SOJA: 3.3,              // Produção de toneladas de soja por ha/ano
    PESO_PEC: 0.35,              // Peso da pecuária no uso do solo
    PESO_MILHO: 0.30,            // Peso do milho no uso do solo
    PESO_SOJA: 0.35,             // Peso da soja no uso do solo
    FATOR_ARREND: 0.048,         // Fator de capitalização da renda
    FATOR_AGUA: 0.07,            // % do VUS que representa o valor da água
    FATOR_CONVERSAO_SERRADA_TORA: 0.3756, // Fator de conversão de madeira serrada para tora (em pé)
    isConfigured: false, // Flag to check if user has saved the settings
};

/**
 * Retrieves the current formula parameters from Firestore.
 * If the parameters don't exist, it creates them with default values.
 * @returns {Promise<FormulaParameters>} A promise that resolves to the formula parameters.
 */
export async function getFormulaParameters(): Promise<FormulaParameters> {
  const docRef = doc(db, SETTINGS_COLLECTION, FORMULA_DOC_ID);
  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Return existing data
      return docSnap.data() as FormulaParameters;
    } else {
      // Document doesn't exist, so create it with default values and return them
      console.log('[FormulaService] No parameters found, creating with default values.');
      await setDoc(docRef, defaultParameters);
      return defaultParameters;
    }
  } catch (error) {
    console.error("[FormulaService] Error fetching formula parameters: ", error);
    // In case of error, return the hardcoded default values to ensure the app can still function
    return defaultParameters;
  }
}

/**
 * Saves the updated formula parameters to Firestore.
 * @param {Omit<FormulaParameters, 'isConfigured'>} params - The new formula parameters to save.
 * @returns {Promise<void>} A promise that resolves when the save is complete.
 */
export async function saveFormulaParameters(params: Omit<FormulaParameters, 'isConfigured'>): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, FORMULA_DOC_ID);
  try {
    // Set the parameters and mark as configured.
    // This will overwrite the document or create it if it doesn't exist.
    await setDoc(docRef, { ...params, isConfigured: true });
    console.log('[FormulaService] Successfully saved formula parameters.');
  } catch (error) {
    console.error("[FormulaService] Error saving formula parameters: ", error);
    // Re-throw the error to be handled by the calling function (e.g., to show a toast to the user)
    throw new Error("Failed to save formula parameters to the database.");
  }
}

/**
 * Pure calculation function for the UCS Index. This is not a flow and can be called from anywhere.
 * @param prices - A dictionary of asset names to their latest prices.
 * @param params - The formula parameters.
 * @returns {CalculateUcsIndexOutput} The calculated index data.
 */
export function calculateIndex(prices: { [key: string]: number }, params: FormulaParameters): CalculateUcsIndexOutput {
    const defaultResult = { 
        indexValue: 0, 
        isConfigured: params.isConfigured,
        components: { vm: 0, vus: 0, crs: 0 }, 
        vusDetails: { pecuaria: 0, milho: 0, soja: 0 }
    };
    
    if (!params.isConfigured) {
        return defaultResult;
    }

    // --- Data Validation ---
    const requiredAssets = [
        'USD/BRL Histórico', 'EUR/BRL Histórico', 'Madeira Futuros',
        'Boi Gordo Futuros - Ago 25 (BGIc1)', 'Milho Futuros', 'Soja Futuros', 'Carbono Futuros'
    ];
    for (const asset of requiredAssets) {
        if (prices[asset] === undefined || prices[asset] === null || prices[asset] === 0) {
            console.error(`[LOG] Missing or zero price for required asset in calculation: ${asset}.`);
            return { ...defaultResult, isConfigured: true }; // Return default but indicate it was configured
        }
    }

    // Exchange Rates
    const taxa_usd_brl = prices['USD/BRL Histórico'];
    const taxa_eur_brl = prices['EUR/BRL Histórico'];

    // Prices (raw)
    const preco_lumber_mbf = prices['Madeira Futuros'];
    const preco_boi_arroba = prices['Boi Gordo Futuros - Ago 25 (BGIc1)'];
    const preco_milho_bushel_cents = prices['Milho Futuros'];
    const preco_soja_bushel_cents = prices['Soja Futuros'];
    const preco_carbono_eur = prices['Carbono Futuros'];

    // --- Price Conversions ---
    const preco_madeira_serrada_m3_usd = (preco_lumber_mbf / 1000) * 424;
    const preco_madeira_serrada_m3_brl = preco_madeira_serrada_m3_usd * taxa_usd_brl;
    const preco_madeira_tora_m3_brl = preco_madeira_serrada_m3_brl * params.FATOR_CONVERSAO_SERRADA_TORA;
    const preco_milho_ton_usd = (preco_milho_bushel_cents / 100) * (1000 / 25.4);
    const preco_milho_ton_brl = preco_milho_ton_usd * taxa_usd_brl;
    const preco_soja_ton_usd = (preco_soja_bushel_cents / 100) * (1000 / 27.2);
    const preco_soja_ton_brl = preco_soja_ton_usd * taxa_usd_brl;
    const preco_carbono_brl = preco_carbono_eur * taxa_eur_brl;
    
    // --- Formula Calculation ---
    const VM = preco_madeira_tora_m3_brl * params.VOLUME_MADEIRA_HA;
    const renda_pecuaria = params.PROD_BOI * preco_boi_arroba * params.PESO_PEC;
    const renda_milho = params.PROD_MILHO * preco_milho_ton_brl * params.PESO_MILHO;
    const renda_soja = params.PROD_SOJA * preco_soja_ton_brl * params.PESO_SOJA;
    const renda_bruta_ha = renda_pecuaria + renda_milho + renda_soja;
    const VUS = renda_bruta_ha / params.FATOR_ARREND;
    const valor_carbono = preco_carbono_brl * params.VOLUME_MADEIRA_HA * params.FATOR_CARBONO;
    const valor_agua = VUS * params.FATOR_AGUA;
    const CRS = valor_carbono + valor_agua;
    
    const ucsValue = VM + VUS + CRS;

    if (!isFinite(ucsValue)) {
        console.error('[LOG] UCS calculation resulted in a non-finite number. Returning default.');
        return { ...defaultResult, isConfigured: true };
    }

    return { 
        indexValue: parseFloat(ucsValue.toFixed(2)),
        isConfigured: params.isConfigured,
        components: {
            vm: parseFloat(VM.toFixed(2)),
            vus: parseFloat(VUS.toFixed(2)),
            crs: parseFloat(CRS.toFixed(2)),
        },
        vusDetails: {
            pecuaria: parseFloat((renda_pecuaria / params.FATOR_ARREND).toFixed(2)),
            milho: parseFloat((renda_milho / params.FATOR_ARREND).toFixed(2)),
            soja: parseFloat((renda_soja / params.FATOR_ARREND).toFixed(2)),
        }
    };
}
