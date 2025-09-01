
'use server';
/**
 * @fileOverview A service for managing API configurations in Firestore.
 */

import { db } from './firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { ApiConfig, YahooFinanceConfig } from './types';
import { YAHOO_FINANCE_CONFIG as defaultConfig } from './yahoo-finance-config-data';

const API_CONFIG_DOC_ID = 'api_config';
const SETTINGS_COLLECTION = 'settings';

const defaultApiConfig: ApiConfig = {
    yahooFinance: defaultConfig,
    isConfigured: false,
};

/**
 * Retrieves the current API configuration from Firestore.
 * If the config doesn't exist, it creates it with default values.
 * @returns {Promise<ApiConfig>} A promise that resolves to the API config.
 */
export async function getApiConfig(): Promise<ApiConfig> {
  const docRef = doc(db, SETTINGS_COLLECTION, API_CONFIG_DOC_ID);
  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as ApiConfig;
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
 * Saves the updated Yahoo Finance API configuration to Firestore.
 * @param {YahooFinanceConfig} params - The new Yahoo Finance config to save.
 * @returns {Promise<void>} A promise that resolves when the save is complete.
 */
export async function saveApiConfig(params: YahooFinanceConfig): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, API_CONFIG_DOC_ID);
  try {
    await setDoc(docRef, { yahooFinance: params, isConfigured: true });
    console.log('[ApiConfigService] Successfully saved API configuration.');
  } catch (error) {
    console.error("[ApiConfigService] Error saving API config: ", error);
    throw new Error("Failed to save API config to the database.");
  }
}
