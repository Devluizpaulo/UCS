

'use server';
/**
 * @fileOverview A service for managing Commodities in Firestore.
 * This service provides CRUD (Create, Read, Update, Delete) operations.
 */

import { db } from './firebase-admin-config';
import type { CommodityConfig, InitialCommodityConfig } from './types';
import { COMMODITY_TICKER_MAP } from './marketdata-config';

const COMMODITIES_COLLECTION = 'commodities';

/**
 * Seeds the database with a default set of commodities if the collection is empty.
 * This is useful for initial setup and prevents errors from empty collections.
 * This function is now more resilient, attempting to create documents and ignoring
 * errors if they already exist, which avoids read-before-write issues on a new database.
 */
async function seedDefaultCommodities() {
    const collectionRef = db.collection(COMMODITIES_COLLECTION);
    
    try {
        const batch = db.batch();
        console.log('[CommodityConfigService] Seeding database with default commodities...');
        
        Object.entries(COMMODITY_TICKER_MAP).forEach(([id, config]) => {
            const docRef = collectionRef.doc(id);
            const dataToSeed: InitialCommodityConfig = {
                name: config.name,
                ticker: config.ticker,
                currency: config.currency,
                category: config.category,
                description: config.description,
                unit: config.unit,
                source: config.source || 'n8n', // Default source
            };
            batch.set(docRef, dataToSeed, { merge: true });
        });
        
        await batch.commit();
        console.log('[CommodityConfigService] Default commodities seeding process completed.');
    } catch (error) {
        console.error('[CommodityConfigService] Error during seeding, this might be expected if the database is new. The process will continue, but the database might not be seeded.', error);
    }
}

/**
 * Retrieves all commodities. It first attempts to fetch from Firestore. If that fails,
 * it falls back to the hardcoded list from the config to ensure app stability.
 * @returns {Promise<CommodityConfig[]>} A promise that resolves to an array of commodities.
 */
export async function getCommodities(): Promise<CommodityConfig[]> {
    try {
        const collectionRef = db.collection(COMMODITIES_COLLECTION);
        const snapshot = await collectionRef.get();
        
        if (snapshot.empty) {
            console.warn('[CommodityConfigService] Firestore collection is empty. Attempting to seed...');
            await seedDefaultCommodities();
            const seededSnapshot = await collectionRef.get();
            if (seededSnapshot.empty) {
                 console.error('[CommodityConfigService] FATAL: Firestore is still empty after seeding. Falling back to hardcoded config.');
                 // Fallback to hardcoded list if firestore is still empty
                 return Object.entries(COMMODITY_TICKER_MAP).map(([id, config]) => ({
                    id: id,
                    ...config,
                    source: config.source || 'n8n',
                })).sort((a, b) => a.name.localeCompare(b.name));
            }
            const commodities = seededSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as CommodityConfig));
            return commodities;
        }

        const commodities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as CommodityConfig));
        
        return commodities.sort((a, b) => {
            if (a.category === 'exchange' && b.category !== 'exchange') return -1;
            if (a.category !== 'exchange' && b.category === 'exchange') return 1;
            return a.name.localeCompare(b.name);
        });

    } catch (error) {
        console.error('[CommodityConfigService] Error fetching commodities from DB, falling back to hardcoded list:', error);
        return Object.entries(COMMODITY_TICKER_MAP).map(([id, config]) => ({
            id: id,
            ...config,
            source: config.source || 'n8n',
        })).sort((a, b) => {
            if (a.category === 'exchange' && b.category !== 'exchange') return -1;
            if (a.category !== 'exchange' && b.category === 'exchange') return 1;
            return a.name.localeCompare(b.name);
        });
    }
}

/**
 * Retrieves a single commodity by its ID.
 * @param {string} id - The ID of the commodity to retrieve.
 * @returns {Promise<CommodityConfig | null>} A promise that resolves to the commodity or null if not found.
 */
export async function getCommodity(id: string): Promise<CommodityConfig | null> {
    try {
        const docRef = db.collection(COMMODITIES_COLLECTION).doc(id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return { id: docSnap.id, ...docSnap.data() } as CommodityConfig;
        }
        return null;
    } catch(error) {
        console.error(`[CommodityConfigService] Error fetching single commodity ${id}:`, error);
        return null;
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
    if (!id) {
        throw new Error("Commodity ID is required for deletion.");
    }
    try {
        const docRef = db.collection(COMMODITIES_COLLECTION).doc(id);
        await docRef.delete();
        console.log(`[CommodotyConfigService] Successfully deleted commodity: ${id}`);
    } catch (error) {
        console.error(`[CommodityConfigService] Error deleting commodity ${id}:`, error);
        throw new Error(`Failed to delete commodity ${id}.`);
    }
}
