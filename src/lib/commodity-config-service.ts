
'use server';
/**
 * @fileOverview A service for managing Commodities in Firestore.
 * This service provides CRUD (Create, Read, Update, Delete) operations.
 */

import { getDb } from './firebase-admin-config';
import type { CommodityConfig, InitialCommodityConfig } from './types';
import { COMMODITY_TICKER_MAP } from './marketdata-config';

const COMMODITIES_COLLECTION = 'commodities';

/**
 * Seeds the database with a default set of commodities if the collection is empty.
 * This is useful for initial setup and prevents errors from empty collections.
 */
async function seedDefaultCommodities() {
    const db = await getDb();
    const collectionRef = db.collection(COMMODITIES_COLLECTION);
    const snapshot = await collectionRef.limit(1).get();
    
    if (snapshot.empty) {
        console.log('[CommodityConfigService] No commodities found, seeding database with defaults.');
        const batch = db.batch();
        Object.entries(COMMODITY_TICKER_MAP).forEach(([id, config]) => {
            const docRef = collectionRef.doc(id);
            // Ensure every field from CommodityConfig is present, even optional ones
            const dataToSeed: InitialCommodityConfig = {
                name: config.name,
                ticker: config.ticker,
                currency: config.currency,
                category: config.category,
                description: config.description,
                unit: config.unit,
                source: config.source || 'MarketData',
                scrapeConfig: config.scrapeConfig || { url: '', selector: '' }
            };
            batch.set(docRef, dataToSeed);
        });
        await batch.commit();
        console.log('[CommodityConfigService] Default commodities seeded successfully.');
    }
}

/**
 * Retrieves all commodities from Firestore, ordered by name.
 * It ensures the collection is seeded with default data if it's empty.
 * @returns {Promise<CommodityConfig[]>} A promise that resolves to an array of commodities.
 */
export async function getCommodities(): Promise<CommodityConfig[]> {
    await seedDefaultCommodities(); // Ensure defaults exist on first run
    const db = await getDb();
    
    try {
        const collectionRef = db.collection(COMMODITIES_COLLECTION);
        const querySnapshot = await collectionRef.orderBy('name').get();
        const commodities: CommodityConfig[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as InitialCommodityConfig;
            commodities.push({ 
                id: doc.id, 
                ...data,
                // Ensure optional fields are present on the returned object
                source: data.source || 'MarketData', 
                scrapeConfig: data.scrapeConfig || { url: '', selector: '' }
            });
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
    const db = await getDb();
    try {
        const docRef = db.collection(COMMODITIES_COLLECTION).doc(id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            const data = docSnap.data() as InitialCommodityConfig;
            return { 
                id: docSnap.id, 
                ...data,
                source: data.source || 'MarketData',
                scrapeConfig: data.scrapeConfig || { url: '', selector: '' }
            };
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
    const db = await getDb();
    if (!commodity.id) {
        throw new Error("Commodity ID cannot be empty.");
    }
    try {
        const { id, ...dataToSave } = commodity;
        const docRef = db.collection(COMMODITIES_COLLECTION).doc(id);
        await docRef.set(dataToSave, { merge: true }); // Use merge to avoid overwriting fields on update
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
    const db = await getDb();
    if (!id) {
        throw new Error("Commodity ID is required for deletion.");
    }
    try {
        // Here you might also want to delete the `price_entries` subcollection.
        // This is a more complex operation and is omitted for now for simplicity.
        const docRef = db.collection(COMMODITIES_COLLECTION).doc(id);
        await docRef.delete();
        console.log(`[CommodityConfigService] Successfully deleted commodity: ${id}`);
    } catch (error) {
        console.error(`[CommodityConfigService] Error deleting commodity ${id}:`, error);
        throw new Error(`Failed to delete commodity ${id}.`);
    }
}
