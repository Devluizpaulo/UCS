
'use server';
/**
 * @fileOverview A service for managing the UCS Index formula parameters, aligned with the user's Excel spreadsheet logic.
 */

import { db } from './firebase-admin-config';
import type { FormulaParameters } from './types';
import { clearCache } from './cache-service';

const FORMULA_DOC_ID = 'parametros_oficiais_v2';
const SETTINGS_COLLECTION = 'settings';

// Default values based on the user's Excel spreadsheet.
const defaultParameters: Omit<FormulaParameters, 'isConfigured'> = {
    // Produtividades
    produtividade_boi: 18,
    produtividade_milho: 7.2,
    produtividade_soja: 3.3,
    produtividade_madeira: 120,
    produtividade_carbono: 900,
    
    // Fatores de Ponderação VUS
    fator_pecuaria: 0.35,
    fator_milho: 0.30,
    fator_soja: 0.35,
    
    // Fatores de Conversão/Custo
    fator_arrendamento: 0.048, // 4.8%
    fator_agua: 0.07, // 7%
    fator_conversao_madeira: 0.10, // 10%

    // Fatores Finais e Multiplicadores
    fator_ucs: 2, // Fator de multiplicação final para UCS CF -> UCS ASE
    FATOR_CARBONO: 2.59, // Unidades de tCO2 por hectare para CRS
    
    // Área
    area_total: 1197,
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
      // Ensure all default keys exist in the loaded data
      params = { ...defaultParameters, ...dbData, isConfigured: true } as FormulaParameters;
    } else {
      console.log('[FormulaService] No parameters found, creating with default values.');
      params = { ...defaultParameters, isConfigured: true };
      await docRef.set(params);
    }
    
    return params;

  } catch (error) {
    console.error("[FormulaService] Error fetching formula parameters: ", error);
    // In case of error, return the hardcoded default values.
    return { ...defaultParameters, isConfigured: false };
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
    // Invalidate caches that depend on formula parameters
    await clearCache('ucsIndexValue_latest');
    await clearCache('commodityPrices'); // Prices might need re-calculation with new context
    console.log('[FormulaService] Successfully saved formula parameters and cleared relevant caches.');
  } catch (error) {
    console.error("[FormulaService] Error saving formula parameters: ", error);
    throw new Error("Failed to save formula parameters to the database.");
  }
}
