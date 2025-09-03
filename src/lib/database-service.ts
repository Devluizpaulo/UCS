
'use server';
/**
 * @fileOverview A service for interacting with the Firebase Firestore database.
 * This service handles writing data to the 'commodities' and 'ucs_index_history' collections.
 */

import admin from 'firebase-admin';
import { getDb } from './firebase-admin-config';
import type { CommodityPriceData, CalculateUcsIndexOutput } from './types';

/**
 * Saves a batch of commodity price data to Firestore using a batched write for efficiency.
 * It creates a new historical entry in the 'price_entries' subcollection for each asset.
 * It DOES NOT update the main commodity document, as that holds static config.
 *
 * @param {CommodityPriceData[]} data - An array of commodity price data objects.
 * @returns {Promise<void>}
 */
export async function saveCommodityData(data: CommodityPriceData[]): Promise<void> {
  if (!data || data.length === 0) {
    console.log('[DB] No data provided to save.');
    return;
  }
  const db = getDb();
  console.log(`[DB] Starting batched write for ${data.length} commodities.`);
  const batch = db.batch();

  data.forEach((item) => {
    if (!item || !item.id) {
        console.warn('[DB] Skipping invalid item in data array:', item);
        return;
    }
    
    // Reference to the new document in the 'price_entries' subcollection
    const newPriceEntryRef = db.collection('commodities').doc(item.id).collection('price_entries').doc();
    
    // Data for the historical price entry
    const priceEntryData = {
        price: item.price,
        savedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Add operation to the batch
    batch.set(newPriceEntryRef, priceEntryData);
  });

  try {
    await batch.commit();
    console.log('[DB] Batched write completed successfully.');
  } catch (error) {
    console.error('[DB] Batched write failed:', error);
    throw new Error('Failed to save commodity data.');
  }
}

/**
 * Saves the calculated UCS index value and its components to its historical collection.
 * This should be called once per day by the scheduled job.
 * @param {CalculateUcsIndexOutput} indexData - The calculated UCS index data object.
 * @returns {Promise<void>}
 */
export async function saveUcsIndexData(indexData: CalculateUcsIndexOutput): Promise<void> {
    const { indexValue, isConfigured, components, vusDetails } = indexData;
    const db = getDb();

    if (typeof indexValue !== 'number' || !isFinite(indexValue)) {
        console.warn('[DB] Invalid or non-finite UCS index value provided. Skipping save.', indexValue);
        // Only save if the value is valid.
        return;
    }

    try {
        const historyCollectionRef = db.collection('ucs_index_history');
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to the beginning of the day

        // Check if an entry for today already exists to avoid duplicates
        const q = historyCollectionRef.orderBy('savedAt', 'desc').limit(1);
        const querySnapshot = await q.get();
        
        let docRef;

        if (!querySnapshot.empty) {
            const lastDoc = querySnapshot.docs[0];
            const lastSavedDate = (lastDoc.data().savedAt as admin.firestore.Timestamp).toDate();
            lastSavedDate.setHours(0, 0, 0, 0);

            if (lastSavedDate.getTime() === today.getTime()) {
                console.log(`[DB] UCS index value for today already exists. Updating existing document.`);
                docRef = lastDoc.ref;
            }
        }
        
        // If no document for today, create a new one
        if (!docRef) {
            docRef = historyCollectionRef.doc();
        }

        await docRef.set({
            value: indexValue,
            isConfigured,
            components,
            vusDetails,
            savedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true }); // Use merge to update or create
        
        console.log(`[DB] Successfully saved UCS index data. Value: ${indexValue}`);
    } catch (error) {
        console.error('[DB] Failed to save UCS index data:', error);
        throw new Error('Failed to save UCS index data.');
    }
}
