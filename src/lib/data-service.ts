
'use server';

import type { CommodityPriceData, FirestoreQuote } from './types';
import { getCommodities } from './commodity-config-service';
import { db } from './firebase-admin-config';
import { Timestamp, DocumentData } from 'firebase-admin/firestore';

// Helper to safely serialize Firestore Timestamps to ISO strings
const serializeFirestoreTimestamp = (data: any): any => {
    if (data && typeof data === 'object') {
        if (data instanceof Timestamp) {
            return data.toDate().toISOString();
        }
        if (Array.isArray(data)) {
            return data.map(serializeFirestoreTimestamp);
        }
        const newObj: { [key: string]: any } = {};
        for (const key in data) {
            newObj[key] = serializeFirestoreTimestamp(data[key]);
        }
        return newObj;
    }
    return data;
};

// Fetches the single most recent quote for a given asset ID, using the ID as the collection name.
async function getLatestQuoteForAsset(assetId: string): Promise<FirestoreQuote | null> {
    const collectionName = assetId; // The asset ID is the collection name
    if (!collectionName) {
        console.warn(`[DataService] Invalid asset ID provided: ${assetId}`);
        return null;
    }

    try {
        const snapshot = await db.collection(collectionName).orderBy('timestamp', 'desc').limit(1).get();
        if (snapshot.empty) {
            console.warn(`[DataService] No documents found in collection: ${collectionName}`);
            return null;
        }

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...serializeFirestoreTimestamp(doc.data())
        } as FirestoreQuote;

    } catch (error) {
        console.error(`[DataService] Error fetching latest quote for asset ${assetId} from collection ${collectionName}:`, error);
        return null;
    }
}

/**
 * Fetches the current price and change data for all configured commodities.
 * This is the primary function used by the dashboard.
 */
export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    try {
        const commodities = await getCommodities();
        if (!commodities || commodities.length === 0) {
            console.warn("[DataService] No commodities configured.");
            return [];
        }

        const pricePromises = commodities.map(async (commodity) => {
            const latestQuote = await getLatestQuoteForAsset(commodity.id);

            let price = 0;
            let change = 0;
            let absoluteChange = 0;
            let lastUpdated = 'N/A';

            if (latestQuote) {
                price = latestQuote.ultimo ?? 0;
                change = latestQuote.variacao_pct ?? 0;
                lastUpdated = latestQuote.data ?? new Date(latestQuote.timestamp).toLocaleDateString('pt-BR');

                if (price > 0 && change !== 0) {
                    const previousPrice = price / (1 + (change / 100));
                    absoluteChange = price - previousPrice;
                }
            }

            return {
                ...commodity,
                price,
                change,
                absoluteChange,
                lastUpdated,
            };
        });

        const priceData = await Promise.all(pricePromises);
        
        return priceData;

    } catch (error) {
        console.error(`[DataService] Critical error in getCommodityPrices: ${error}`);
        return [];
    }
}

/**
 * Fetches the historical quotes for a single asset, used for the details modal.
 */
export async function getCotacoesHistorico(assetId: string, limit: number = 30): Promise<FirestoreQuote[]> {
    const collectionName = assetId; // The asset ID is the collection name
    if (!collectionName) {
        console.warn(`[DataService] No collection mapping for asset ID: ${assetId}`);
        return [];
    }
    
    try {
        const snapshot = await db.collection(collectionName).orderBy('timestamp', 'desc').limit(limit).get();
        if (snapshot.empty) return [];

        const data = snapshot.docs.map((doc: DocumentData) => ({
            id: doc.id,
            ...serializeFirestoreTimestamp(doc.data())
        } as FirestoreQuote));
        
        return data;

    } catch (error) {
        console.error(`[DataService] Error fetching historical data for asset ${assetId}:`, error);
        return [];
    }
}
