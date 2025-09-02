
'use server';
/**
 * @fileOverview A service for managing the Commodity Configuration in Firestore.
 * This replaces the static COMMODITY_TICKER_MAP file.
 */

import { db } from './firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { CommodityMap, FullCommodityConfig } from './types';
import { COMMODITY_TICKER_MAP as defaultConfigMap } from './marketdata-config';

const COMMODITY_CONFIG_DOC_ID = 'commodity_config';
const SETTINGS_COLLECTION = 'settings';

// Create a default config object from the static file
const defaultConfig: FullCommodityConfig = {
    commodityMap: defaultConfigMap,
    isConfigured: false,
};

/**
 * Retrieves the current commodity configuration from Firestore.
 * If the config doesn't exist, it creates it with default values from the static file.
 * @returns {Promise<FullCommodityConfig>} A promise that resolves to the commodity config.
 */
export async function getCommodityConfig(): Promise<FullCommodityConfig> {
  const docRef = doc(db, SETTINGS_COLLECTION, COMMODITY_CONFIG_DOC_ID);
  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as FullCommodityConfig;
    } else {
      console.log('[CommodityConfigService] No config found, creating with default values.');
      await setDoc(docRef, defaultConfig);
      return defaultConfig;
    }
  } catch (error) {
    console.error("[CommodityConfigService] Error fetching commodity config: ", error);
    // In case of error, return the hardcoded default values
    return defaultConfig;
  }
}

/**
 * Saves the updated commodity map to Firestore.
 * @param {CommodityMap} newMap - The new commodity map to save.
 * @returns {Promise<void>} A promise that resolves when the save is complete.
 */
export async function saveCommodityConfig(newMap: CommodityMap): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, COMMODITY_CONFIG_DOC_ID);
  try {
    const dataToSave: FullCommodityConfig = {
      commodityMap: newMap,
      isConfigured: true,
    };
    await setDoc(docRef, dataToSave);
    console.log('[CommodityConfigService] Successfully saved commodity configuration.');
  } catch (error) {
    console.error("[CommodityConfigService] Error saving commodity configuration: ", error);
    throw new Error("Failed to save commodity config to the database.");
  }
}
