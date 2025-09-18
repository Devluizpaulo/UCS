
'use server';
/**
 * @fileOverview A service for managing the UCS Index formula parameters, aligned with the new simplified methodology.
 */

import { db } from './firebase-admin-config';
import type { FormulaParameters } from './types';

const FORMULA_DOC_ID = 'parametros_oficiais_v2'; // New doc ID for the new formula structure
const SETTINGS_COLLECTION = 'settings';

// Default values based on the new simplified formula specification.
const defaultParameters: FormulaParameters = {
    // Produtividades
    produtividade_boi: 18,
    produtividade_milho: 7.2,
    produtividade_soja: 3.3,
    produtividade_madeira: 120,

    // Fatores
    fator_uso_terra: 0.35, // 35%
    credito_carbono_param: 1, // Placeholder, e.g., units of carbon credit
    consumo_agua_param: 1, // Placeholder, e.g., units of water consumption
    fator_ucs: 0.07, // 7%

    // Status
    isConfigured: false,
};

/**
 * Retrieves the current formula parameters from Firestore.
 * If the parameters don't exist, it creates them with default values.
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
      console.log('[FormulaService] No new parameters found, creating with default values.');
      params = { ...defaultParameters, isConfigured: true };
      await docRef.set(params);
    }
    
    return params;

  } catch (error) {
    console.error("[FormulaService] Error fetching formula parameters: ", error);
    // In case of error, return the hardcoded default values.
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
    console.log('[FormulaService] Successfully saved new formula parameters.');
  } catch (error) {
    console.error("[FormulaService] Error saving new formula parameters: ", error);
    throw new Error("Failed to save formula parameters to the database.");
  }
}
