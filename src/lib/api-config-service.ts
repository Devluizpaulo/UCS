
'use server';
/**
 * @fileOverview A service for managing API configurations in Firestore.
 */

import { MARKETDATA_CONFIG as defaultConfig } from './marketdata-config';
import type { ApiConfig } from './types';


/**
 * Retrieves the current API configuration. In this version, it's hardcoded.
 * @returns {Promise<ApiConfig>} A promise that resolves to the API config.
 */
export async function getApiConfig(): Promise<ApiConfig> {
  // The configuration is now hardcoded and returned directly.
  return {
    marketData: defaultConfig,
    isConfigured: true, // Assuming it's always configured now
  };
}

/**
 * This function is kept for potential future use but currently does nothing,
 * as the API configuration is hardcoded.
 * @returns {Promise<void>} A promise that resolves immediately.
 */
export async function saveApiConfig(): Promise<void> {
  console.log('[ApiConfigService] Save operation is disabled. Configuration is hardcoded.');
  return Promise.resolve();
}
