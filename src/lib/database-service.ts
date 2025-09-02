

'use server';
/**
 * @fileOverview A service for interacting with the Firebase Firestore database.
 * This service handles writing data to the 'commodities' and 'ucs_index_history' collections.
 */

import { getDb } from './firebase-admin-config';
import { collection, doc, setDoc, serverTimestamp, writeBatch, Timestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import type { CommodityPriceData, CalculateUcsIndexOutput } from './types';

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
  const db = await getDb();
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
 * Saves the calculated UCS index value and its components to its historical collection.
 * This should be called once per day by the scheduled job.
 * @param {CalculateUcsIndexOutput} indexData - The calculated UCS index data object.
 * @returns {Promise<void>}
 */
export async function saveUcsIndexData(indexData: CalculateUcsIndexOutput): Promise<void> {
    const { indexValue, isConfigured, components, vusDetails } = indexData;
    const db = await getDb();

    if (typeof indexValue !== 'number' || !isFinite(indexValue) || (isConfigured && indexValue <= 0) ) {
        console.warn('[DB] Invalid or zero UCS index value provided for saving, but will save components if available:', indexValue);
        // Allow saving even if index is 0, but log it.
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
        
        let docRef;

        if (!querySnapshot.empty) {
            const lastDoc = querySnapshot.docs[0];
            const lastSavedDate = (lastDoc.data().savedAt as Timestamp).toDate();
            lastSavedDate.setHours(0, 0, 0, 0);

            if (lastSavedDate.getTime() === today.getTime()) {
                console.log(`[DB] UCS index value for today already exists. Updating existing document.`);
                docRef = lastDoc.ref;
            }
        }
        
        // If no document for today, create a new one
        if (!docRef) {
            docRef = doc(historyCollectionRef);
        }

        await setDoc(docRef, {
            value: indexValue,
            isConfigured,
            components,
            vusDetails,
            savedAt: serverTimestamp(),
        }, { merge: true }); // Use merge to update or create
        
        console.log(`[DB] Successfully saved UCS index data. Value: ${indexValue}`);
    } catch (error) {
        console.error('[DB] Failed to save UCS index data:', error);
        throw new Error('Failed to save UCS index data.');
    }
}
