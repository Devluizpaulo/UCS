
'use server';
/**
 * @fileOverview A service for interacting with the Firebase Firestore database.
 * This service handles writing data to the 'commodities' and 'ucs_index_history' collections.
 */

import { db } from './firebase-admin-config';
import { collection, doc, setDoc, serverTimestamp, writeBatch, Timestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import type { CommodityPriceData } from './types';

/**
 * Saves a batch of commodity price data to Firestore using a batched write for efficiency.
 * It updates the main document for each commodity with the latest price and adds a new
 * historical entry in the 'price_entries' subcollection.
 *
 * @param {CommodityPriceData[]} data - An array of commodity price data objects.
 * @returns {Promise<void>}
 */
export async function saveCommodityData(data: CommodityPriceData[]): Promise<void> {
  if (!data || data.length === 0) {
    console.log('[DB] No data provided to save.');
    return;
  }

  console.log(`[DB] Starting batched write for ${data.length} commodities.`);
  const batch = writeBatch(db);

  data.forEach((item) => {
    if (!item || !item.id) {
        console.warn('[DB] Skipping invalid item in data array:', item);
        return;
    }
    
    // 1. Reference to the main commodity document (e.g., /commodities/Soja Futuros)
    const commodityDocRef = doc(db, 'commodities', item.id);
    
    // 2. Reference to the new document in the 'price_entries' subcollection
    const newPriceEntryRef = doc(collection(commodityDocRef, 'price_entries'));
    
    // Data for the historical price entry
    const priceEntryData = {
        price: item.price,
        savedAt: serverTimestamp(),
    };
    
    // Data to update the main commodity document
    const mainDocUpdateData = {
        price: item.price,
        lastUpdated: serverTimestamp(),
        // Keep other fields like ticker, name, etc. as they are
    };

    // Add operations to the batch
    batch.set(newPriceEntryRef, priceEntryData);
    batch.set(commodityDocRef, mainDocUpdateData, { merge: true }); // Merge to avoid overwriting static data
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
 * Saves the calculated UCS index value to its own historical collection.
 * This should be called once per day by the scheduled job.
 * @param {number} indexValue - The calculated UCS index value.
 * @returns {Promise<void>}
 */
export async function saveUcsIndexData(indexValue: number): Promise<void> {
    if (typeof indexValue !== 'number' || !isFinite(indexValue) || indexValue <= 0) {
        console.error('[DB] Invalid or zero UCS index value provided for saving:', indexValue);
        return;
    }

    try {
        const historyCollectionRef = collection(db, 'ucs_index_history');
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to the beginning of the day

        // Check if an entry for today already exists to avoid duplicates
        const q = query(
            historyCollectionRef,
            orderBy('savedAt', 'desc'),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const lastDoc = querySnapshot.docs[0];
            const lastSavedDate = (lastDoc.data().savedAt as Timestamp).toDate();
            lastSavedDate.setHours(0, 0, 0, 0);

            if (lastSavedDate.getTime() === today.getTime()) {
                console.log(`[DB] UCS index value for today already exists. Skipping save.`);
                return;
            }
        }

        const newDocRef = doc(historyCollectionRef);
        await setDoc(newDocRef, {
            value: indexValue,
            savedAt: serverTimestamp(),
        });
        console.log(`[DB] Successfully saved UCS index value: ${indexValue}`);
    } catch (error) {
        console.error('[DB] Failed to save UCS index data:', error);
        throw new Error('Failed to save UCS index data.');
    }
}
