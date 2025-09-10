
/**
 * @fileOverview Firebase Admin SDK configuration for SERVER-SIDE use only.
 * This file provides a robust way to get Firebase service instances,
 * ensuring the SDK is initialized only once.
 */

import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors.
if (!admin.apps.length) {
    try {
        console.log('[Firebase Admin] Initializing Firebase Admin SDK...');
        
        // Validate required environment variable
        if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
            throw new Error('Missing required environment variable: FIREBASE_SERVICE_ACCOUNT. Please check your .env.local file or Vercel environment variables.');
        }

        let serviceAccount: admin.ServiceAccount;
        
        try {
            // This will work in local development if the variable is a direct JSON object
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
        } catch (e) {
            // This will work for Vercel where the env var is a string but not a direct JSON object.
            // We build the object from the individual parts.
             serviceAccount = {
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            } as admin.ServiceAccount;
        }

        // Final validation to ensure the service account is valid
        if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT is not a valid service account JSON. Please ensure it contains projectId, clientEmail, and privateKey.');
        }
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.projectId,
        });

        console.log('[Firebase Admin] SDK initialized successfully.');

    } catch(error: any) {
        console.error('[Firebase Admin] CRITICAL INITIALIZATION ERROR:', error);
        // We throw the error to fail fast if initialization is impossible.
        // This prevents the app from running in a broken state.
        throw new Error(`Failed to initialize Firebase Admin SDK. Details: ${error.message}`);
    }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };
