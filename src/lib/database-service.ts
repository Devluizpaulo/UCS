'use server';
/**
 * @fileOverview A service for interacting with the Firebase Firestore database.
 *
 * - saveCommodityData - Saves commodity price data to Firestore.
 */

import { db } from './firebase-config';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { CommodityPriceData } from './types';

/**
 * Saves a batch of commodity price data to Firestore.
 * Each asset's data is saved in its own document, within a subcollection
 * for historical price entries.
 *
 * @param {CommodityPriceData[]} data - An array of commodity price data objects.
 * @returns {Promise<void>}
 */
export async function saveCommodityData(data: CommodityPriceData[]): Promise<void> {
  if (!data || data.length === 0) {
    console.log('[DB] No data provided to save.');
    return;
  }

  console.log(`[DB] Saving data for ${data.length} commodities.`);

  const writePromises: Promise<void>[] = [];

  data.forEach((item) => {
    try {
      // A reference to the document for the specific commodity (e.g., 'Soja Futuros')
      const commodityDocRef = doc(db, 'commodities_history', item.name);
      
      // A reference to the new document in the 'price_entries' subcollection
      // We use a timestamp for the document ID to keep them ordered chronologically
      const entryDocRef = doc(collection(commodityDocRef, 'price_entries'));
      
      // Set the data for the new price entry
      const promise = setDoc(entryDocRef, {
        price: item.price,
        change: item.change,
        absoluteChange: item.absoluteChange,
        lastUpdated: item.lastUpdated,
        savedAt: serverTimestamp(), // Use Firestore server timestamp
      });
      
      writePromises.push(promise);
    } catch (error) {
       console.error(`[DB] Error preparing to save data for ${item.name}:`, error);
    }
  });

  try {
    await Promise.all(writePromises);
    console.log('[DB] Successfully saved all commodity data to Firestore.');
  } catch (error) {
    console.error('[DB] Failed to save one or more commodity data entries:', error);
  }
}
