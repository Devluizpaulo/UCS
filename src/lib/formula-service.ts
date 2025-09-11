

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
    produtividade_madeira: 120,
    produtividade_carbono: 150,
    VOLUME_MADEIRA_HA: 200,
    PROD_BOI: 15,
    PROD_MILHO: 6.5,
    PROD_SOJA: 3.3,
    
    // Fatores de Ponderação
    fator_pecuaria: 0.35,
    fator_milho: 0.30,
    fator_soja: 0.35,
    PESO_PEC: 0.35,
    PESO_MILHO: 0.30,
    PESO_SOJA: 0.35,
    
    // Fatores de Conversão
    fator_arrendamento: 0.048,
    FATOR_ARREND: 0.048,
    fator_agua: 0.07,
    fator_ucs: 1.0,
    FATOR_CARBONO: 1.0,
    FATOR_CONVERSAO_SERRADA_TORA: 0.5,
    
    // Valores Econômicos
    pib_por_hectare: 41194.67,
    
    // Área
    area_total: 1197,

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

    if (docSnap.exists) {
      // Merge with defaults to ensure new parameters are not missing
      const dbData = docSnap.data();
      return { ...defaultParameters, ...dbData, isConfigured: true } as FormulaParameters;
    } else {
      // Document doesn't exist, so create it with default values and return them
      console.log('[FormulaService] No parameters found, creating with default values.');
      await docRef.set({ ...defaultParameters, isConfigured: true });
      return { ...defaultParameters, isConfigured: true };
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
  const docRef = db.collection(SETTINGS_COLLECTION).doc(FORMULA_DOC_ID);
  const dataToSave = { ...params, isConfigured: true };
  
  try {
    // Use set with merge to create or update the document.
    await docRef.set(dataToSave, { merge: true });
    console.log('[FormulaService] Successfully saved formula parameters.');
  } catch (error) {
    console.error("[FormulaService] Error saving formula parameters: ", error);
    throw new Error("Failed to save formula parameters to the database.");
  }
}
