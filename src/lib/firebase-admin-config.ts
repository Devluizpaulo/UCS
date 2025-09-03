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
        admin.initializeApp({
             // Environment variables are automatically available in the Vercel/Firebase environment.
        });
        console.log('[Firebase Admin] SDK initialized successfully.');
    } catch(error: any) {
        console.error('[Firebase Admin] Initialization error:', error.stack);
        // We throw the error to fail fast if initialization is impossible.
        // This prevents the app from running in a broken state.
        throw new Error('Failed to initialize Firebase Admin SDK.');
    }
}

/**
 * Returns the initialized Firestore instance.
 * @returns {admin.firestore.Firestore} The Firestore database object.
 */
export function getDb(): admin.firestore.Firestore {
  return admin.firestore();
}

/**
 * Returns the initialized Auth instance.
 * @returns {admin.auth.Auth} The Firebase Auth object.
 */
export function getAuth(): admin.auth.Auth {
  return admin.auth();
}
