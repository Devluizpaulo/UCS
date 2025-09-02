
'use server';
/**
 * @fileOverview A service for managing Commodities in Firestore.
 * This service provides CRUD (Create, Read, Update, Delete) operations.
 */

import { db } from './firebase-admin-config';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import type { CommodityConfig } from './types';
import { COMMODITY_TICKER_MAP } from './marketdata-config';

const COMMODITIES_COLLECTION = 'commodities';

/**
 * Seeds the database with a default set of commodities if the collection is empty.
 * This is useful for initial setup.
 */
async function seedDefaultCommodities() {
    const q = query(collection(db, COMMODITIES_COLLECTION), orderBy('name'), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        console.log('[CommodityConfigService] No commodities found, seeding database with defaults.');
        const promises = Object.entries(COMMODITY_TICKER_MAP).map(([name, config]) => {
            const commodity: CommodityConfig = {
                id: name, // Use the key as the document ID
                name: name,
                ...config,
            };
            return saveCommodity(commodity);
        });
        await Promise.all(promises);
        console.log('[CommodityConfigService] Default commodities seeded successfully.');
    }
}

/**
 * Retrieves all commodities from Firestore, ordered by name.
 * @returns {Promise<CommodityConfig[]>} A promise that resolves to an array of commodities.
 */
export async function getCommodities(): Promise<CommodityConfig[]> {
    await seedDefaultCommodities(); // Ensure defaults exist on first run
    
    try {
        const q = query(collection(db, COMMODITIES_COLLECTION), orderBy('name'));
        const querySnapshot = await getDocs(q);
        const commodities: CommodityConfig[] = [];
        querySnapshot.forEach((doc) => {
            commodities.push({ id: doc.id, ...doc.data() } as CommodityConfig);
        });
        return commodities;
    } catch (error) {
        console.error('[CommodityConfigService] Error fetching commodities:', error);
        throw new Error('Failed to fetch commodities from the database.');
    }
}

/**
 * Retrieves a single commodity by its ID.
 * @param {string} id - The ID of the commodity to retrieve.
 * @returns {Promise<CommodityConfig | null>} A promise that resolves to the commodity or null if not found.
 */
export async function getCommodity(id: string): Promise<CommodityConfig | null> {
    try {
        const docRef = doc(db, COMMODITIES_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as CommodityConfig;
        }
        return null;
    } catch (error) {
        console.error(`[CommodityConfigService] Error fetching commodity ${id}:`, error);
        throw new Error(`Failed to fetch commodity ${id}.`);
    }
}

/**
 * Saves (creates or updates) a commodity in Firestore.
 * The document ID is taken from the 'id' field of the commodity object.
 * @param {CommodityConfig} commodity - The commodity data to save.
 * @returns {Promise<void>} A promise that resolves when the save is complete.
 */
export async function saveCommodity(commodity: CommodityConfig): Promise<void> {
    if (!commodity.id) {
        throw new Error("Commodity ID cannot be empty.");
    }
    try {
        const { id, ...dataToSave } = commodity;
        const docRef = doc(db, COMMODITIES_COLLECTION, id);
        await setDoc(docRef, dataToSave, { merge: true }); // Use merge to avoid overwriting fields on update
        console.log(`[CommodityConfigService] Successfully saved commodity: ${id}`);
    } catch (error) {
        console.error(`[CommodityConfigService] Error saving commodity ${commodity.id}:`, error);
        throw new Error(`Failed to save commodity ${commodity.id}.`);
    }
}

/**
 * Deletes a commodity from Firestore.
 * @param {string} id - The ID of the commodity to delete.
 * @returns {Promise<void>} A promise that resolves when the deletion is complete.
 */
export async function deleteCommodity(id: string): Promise<void> {
    if (!id) {
        throw new Error("Commodity ID is required for deletion.");
    }
    try {
        const docRef = doc(db, COMMODITIES_COLLECTION, id);
        await deleteDoc(docRef);
        console.log(`[CommodityConfigService] Successfully deleted commodity: ${id}`);
    } catch (error) {
        console.error(`[CommodityConfigService] Error deleting commodity ${id}:`, error);
        throw new Error(`Failed to delete commodity ${id}.`);
    }
}
