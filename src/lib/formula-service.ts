

'use server';
/**
 * @fileOverview A service for managing the UCS Index formula parameters.
 */

import { db } from './firebase-admin-config'; // Use server-side admin SDK
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { FormulaParameters } from './types';

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
    await setDoc(docRef, { ...params, isConfigured: true }, { merge: true });
    console.log('[FormulaService] Successfully saved formula parameters.');
  } catch (error) {
    console.error("[FormulaService] Error saving formula parameters: ", error);
    // Re-throw the error to be handled by the calling function (e.g., to show a toast to the user)
    throw new Error("Failed to save formula parameters to the database.");
  }
}
