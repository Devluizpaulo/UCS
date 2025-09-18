

'use server';
/**
 * @fileOverview A service for managing the UCS Index formula parameters.
 */

import { db } from './firebase-admin-config'; // Use server-side admin SDK
import type { FormulaParameters } from './types';


// The document ID for the formula parameters in Firestore
const FORMULA_DOC_ID = 'parametros_oficiais';
const SETTINGS_COLLECTION = 'settings';


// Default values aligned with the user-provided formula specification.
const defaultParameters: FormulaParameters = {
    // Produtividades
    produtividade_boi: 18,
    produtividade_milho: 7.2,
    produtividade_soja: 3.3,
    produtividade_madeira: 120, // FM3
    produtividade_carbono: 900, // Média de CE por hectare
    
    // Fatores de Ponderação VUS
    fator_pecuaria: 0.35,
    fator_milho: 0.30,
    fator_soja: 0.35,
    
    // Fatores de Conversão e Custo
    fator_arrendamento: 0.048,
    fator_agua: 0.07, // Custo da água
    fator_conversao_madeira: 0.10, // Fator de Conversão da Madeira (10%)
    FATOR_CARBONO: 2.59, // Unidades de tCO2/ha
    fator_ucs: 2, // Fator Multiplicador Final para UCS ASE
    
    // Área
    area_total: 1197,

    // Status
    isConfigured: false, 

    // Legacy fields for compatibility - should not be used in new calculations
    VOLUME_MADEIRA_HA: 0,
    PROD_BOI: 0,
    PROD_MILHO: 0,
    PROD_SOJA: 0,
    PESO_PEC: 0,
    PESO_MILHO: 0,
    PESO_SOJA: 0,
    FATOR_ARREND: 0,
    pib_por_hectare: 0,
    FATOR_CONVERSAO_SERRADA_TORA: 0,
};

/**
 * Retrieves the current formula parameters from Firestore.
 * If the parameters don't exist in Firestore, it creates them with default values.
 * @returns {Promise<FormulaParameters>} A promise that resolves to the formula parameters.
 */
export async function getFormulaParameters(): Promise<FormulaParameters> {
  const docRef = db.collection(SETTINGS_COLLECTION).doc(FORMULA_DOC_ID);
  try {
    const docSnap = await docRef.get();
    let params: FormulaParameters;

    if (docSnap.exists) {
      const dbData = docSnap.data();
      params = { ...defaultParameters, ...dbData, isConfigured: true } as FormulaParameters;
    } else {
      console.log('[FormulaService] No parameters found, creating with default values.');
      params = { ...defaultParameters, isConfigured: true };
      await docRef.set(params);
    }
    
    return params;

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
  const docRef = db.collection(SETTINGS_COLLECTION).doc(FORMULA_DOC_ID);
  const dataToSave = { ...params, isConfigured: true };
  
  try {
    await docRef.set(dataToSave, { merge: true });
    console.log('[FormulaService] Successfully saved formula parameters.');
  } catch (error) {
    console.error("[FormulaService] Error saving formula parameters: ", error);
    throw new Error("Failed to save formula parameters to the database.");
  }
}
