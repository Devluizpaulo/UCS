
'use server';
/**
 * @fileOverview A service for interacting with the Firebase Firestore database.
 *
 * - saveCommodityData - Saves commodity price data to Firestore.
 * - saveUcsIndexData - Saves the calculated UCS index value to Firestore.
 */

import { db } from './firebase-config';
import { collection, doc, setDoc, serverTimestamp, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import type { CommodityPriceData } from './types';

/**
 * Saves a single or a batch of commodity price data to Firestore.
 * Each asset's data is saved in its own document, within a subcollection
 * for historical price entries.
 *
 * @param {CommodityPriceData[] | CommodityPriceData} data - A single object or an array of commodity price data objects.
 * @returns {Promise<void>}
 */
export async function saveCommodityData(data: CommodityPriceData[] | CommodityPriceData): Promise<void> {
  const dataArray = Array.isArray(data) ? data : [data];

  if (!dataArray || dataArray.length === 0) {
    console.log('[DB] No data provided to save.');
    return;
  }

  console.log(`[DB] Saving data for ${dataArray.length} commodities.`);

  const writePromises: Promise<void>[] = [];

  dataArray.forEach((item) => {
    if (!item || !item.name) {
        console.warn('[DB] Skipping invalid item in data array:', item);
        return;
    }
    try {
      // A reference to the document for the specific commodity (e.g., 'Soja Futuros')
      const commodityDocRef = doc(db, 'commodities_history', item.name);
      
      // A reference to the new document in the 'price_entries' subcollection
      // We use a timestamp for the document ID to keep them ordered chronologically
      const entryDocRef = doc(collection(commodityDocRef, 'price_entries'));
      
      // Set the data for the new price entry
      const promise = setDoc(entryDocRef, {
        ...item, // Save the whole item object
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
