
'use server';
/**
 * @fileOverview A service for managing API configurations in Firestore.
 */

import { getDb } from './firebase-admin-config'; // Use server-side admin SDK
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { ApiConfig } from './types';
import { MARKETDATA_CONFIG as defaultConfig } from './marketdata-config';

const API_CONFIG_DOC_ID = 'api_config';
const SETTINGS_COLLECTION = 'settings';

const defaultApiConfig: ApiConfig = {
    marketData: defaultConfig,
    isConfigured: false,
};

/**
 * Retrieves the current API configuration from Firestore.
 * If the config doesn't exist, it creates it with default values.
 * @returns {Promise<ApiConfig>} A promise that resolves to the API config.
 */
export async function getApiConfig(): Promise<ApiConfig> {
  const db = await getDb();
  const docRef = doc(db, SETTINGS_COLLECTION, API_CONFIG_DOC_ID);
  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Merge with default config to ensure all keys are present
      const dbConfig = docSnap.data();
      const mergedConfig = {
          ...defaultApiConfig,
          ...dbConfig,
          marketData: {
            ...defaultApiConfig.marketData,
            ...(dbConfig.marketData || {}),
          },
      };
      return mergedConfig as ApiConfig;
    } else {
      console.log('[ApiConfigService] No config found, creating with default values.');
      await setDoc(docRef, defaultApiConfig);
      return defaultApiConfig;
    }
  } catch (error) {
    console.error("[ApiConfigService] Error fetching API config: ", error);
    // In case of error, return the hardcoded default values
    return defaultApiConfig;
  }
}

/**
 * Saves the updated MarketData API configuration to Firestore.
 * @param {Partial<ApiConfig>} params - The new config to save.
 * @returns {Promise<void>} A promise that resolves when the save is complete.
 */
export async function saveApiConfig(params: Partial<Omit<ApiConfig, 'isConfigured'>>): Promise<void> {
  const db = await getDb();
  const docRef = doc(db, SETTINGS_COLLECTION, API_CONFIG_DOC_ID);
  try {
    // Use merge: true to avoid overwriting the whole document if we only pass partial data
    await setDoc(docRef, { ...params, isConfigured: true }, { merge: true });
    console.log('[ApiConfigService] Successfully saved API configuration.');
  } catch (error) {
    console.error("[ApiConfigService] Error saving API config: ", error);
    throw new Error("Failed to save API config to the database.");
  }
}
