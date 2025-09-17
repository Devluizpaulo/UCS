

'use server';
/**
 * @fileOverview A service for managing the UCS Index formula parameters.
 */

import { db } from './firebase-admin-config'; // Use server-side admin SDK
import type { FormulaParameters } from './types';
import { getCache, setCache, clearCache } from './cache-service';


// The document ID for the formula parameters in Firestore
const FORMULA_DOC_ID = 'parametros_oficiais';
const SETTINGS_COLLECTION = 'settings';
const CACHE_KEY_FORMULA = 'formula_parameters';


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
    FATOR_CARBONO: 2.59, // From user's logic
    FATOR_CONVERSAO_SERRADA_TORA: 0.3756, // From user's logic
    
    // Valores Econômicos
    pib_por_hectare: 41194.67,
    
    // Área
    area_total: 1197,

    // Status
    isConfigured: false, 
};

/**
 * Retrieves the current formula parameters from Firestore.
 * It uses a cache to avoid frequent database reads.
 * If the parameters don't exist in Firestore, it creates them with default values.
 * @returns {Promise<FormulaParameters>} A promise that resolves to the formula parameters.
 */
export async function getFormulaParameters(): Promise<FormulaParameters> {
  const cachedParams = await getCache<FormulaParameters>(CACHE_KEY_FORMULA);
  if (cachedParams) {
    return cachedParams;
  }
  
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
    
    await setCache(CACHE_KEY_FORMULA, params); // Save to cache
    return params;

  } catch (error) {
    console.error("[FormulaService] Error fetching formula parameters: ", error);
    // In case of error, return the hardcoded default values to ensure the app can still function
    return defaultParameters;
  }
}

/**
 * Saves the updated formula parameters to Firestore and clears the cache.
 * @param {Omit<FormulaParameters, 'isConfigured'>} params - The new formula parameters to save.
 * @returns {Promise<void>} A promise that resolves when the save is complete.
 */
export async function saveFormulaParameters(params: Omit<FormulaParameters, 'isConfigured'>): Promise<void> {
  const docRef = db.collection(SETTINGS_COLLECTION).doc(FORMULA_DOC_ID);
  const dataToSave = { ...params, isConfigured: true };
  
  try {
    await docRef.set(dataToSave, { merge: true });
    await clearCache(CACHE_KEY_FORMULA); // Invalidate the cache
    console.log('[FormulaService] Successfully saved formula parameters and cleared cache.');
  } catch (error) {
    console.error("[FormulaService] Error saving formula parameters: ", error);
    throw new Error("Failed to save formula parameters to the database.");
  }
}
