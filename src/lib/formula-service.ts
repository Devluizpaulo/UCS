

'use server';
/**
 * @fileOverview A service for managing the UCS Index formula parameters.
 */

import { db } from './firebase-admin-config'; // Use server-side admin SDK
import type { FormulaParameters } from './types';

// The document ID for the formula parameters in Firestore
const FORMULA_DOC_ID = 'formula_parameters';
const SETTINGS_COLLECTION = 'settings';

// Default values aligned with the user-provided formula specification.
const defaultParameters: FormulaParameters = {
    // VUS
    PROD_BOI: 18,                // Produção de arrobas de boi por ha/ano
    PROD_MILHO: 7.2,             // Produção de toneladas de milho por ha/ano
    PROD_SOJA: 3.3,              // Produção de toneladas de soja por ha/ano
    PESO_PEC: 0.35,              // Peso da pecuária no uso do solo (35%)
    PESO_MILHO: 0.30,            // Peso do milho no uso do solo (30%)
    PESO_SOJA: 0.35,             // Peso da soja no uso do solo (35%)
    FATOR_ARREND: 0.048,         // Fator de capitalização da renda (ex: 4.8%)

    // VMAD
    VOLUME_MADEIRA_HA: 120,      // Fator m³ (Volume de madeira comercial por hectare)
    FATOR_CONVERSAO_SERRADA_TORA: 0.10, // Fator de Conversão de madeira (10%)

    // CRS - Custo da Responsabilidade Socioambiental
    FATOR_CARBONO: 2.59,         // Fator de Crédito de Carbono (tCO₂ estocadas por m³ de madeira)
    FATOR_AGUA: 0.07,            // Fator Água (% do VUS que representa o valor da água)

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
      return { ...defaultParameters, ...dbData } as FormulaParameters;
    } else {
      // Document doesn't exist, so create it with default values and return them
      console.log('[FormulaService] No parameters found, creating with default values.');
      await docRef.set(defaultParameters);
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
  const docRef = db.collection(SETTINGS_COLLECTION).doc(FORMULA_DOC_ID);
  const dataToSave = { ...params, isConfigured: true };
  
  try {
    // First, try to update. This is safer and more common.
    await docRef.update(dataToSave);
    console.log('[FormulaService] Successfully updated formula parameters.');
  } catch (error: any) {
    // If the document does not exist (e.g., first run), the update will fail with 'NOT_FOUND'.
    // In this case, we create the document using set().
    if (error.code === 'NOT_FOUND' || error.code === 5) {
      try {
        console.log('[FormulaService] Document not found, creating new one...');
        await docRef.set(dataToSave);
        console.log('[FormulaService] Successfully created and saved formula parameters.');
      } catch (setError) {
         console.error("[FormulaService] Error creating formula parameters after update failed: ", setError);
         throw new Error("Failed to create formula parameters in the database.");
      }
    } else {
      // For any other error (permissions, network, etc.), re-throw it.
      console.error("[FormulaService] Error saving formula parameters: ", error);
      throw new Error("Failed to save formula parameters to the database.");
    }
  }
}
