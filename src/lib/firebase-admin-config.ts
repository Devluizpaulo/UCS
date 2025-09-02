
'use server';
/**
 * @fileOverview Firebase Admin SDK configuration for SERVER-SIDE use only.
 * This file provides singleton instances of Firebase services to prevent
 * re-initialization on every server request, which is crucial for performance
 * and avoiding errors in a serverless environment like Vercel.
 */

import admin from 'firebase-admin';

// This function ensures that we initialize the app only once.
function getFirebaseApp() {
    if (!admin.apps.length) {
        try {
            console.log('[Firebase Admin] Initializing Firebase Admin SDK...');
            admin.initializeApp({
                 // Environment variables are used for security and are automatically
                 // available in the Vercel environment.
            });
            console.log('[Firebase Admin] SDK initialized successfully.');
        } catch(error: any) {
            console.error('[Firebase Admin] Initialization error:', error.stack);
            throw error; // Re-throw the error to fail fast if initialization is impossible.
        }
    }
    // Return the default app instance.
    return admin.app();
}


/**
 * Returns the singleton Firestore instance.
 * Ensures the app is initialized before returning the db object.
 * @returns {Promise<admin.firestore.Firestore>} The Firestore database object.
 */
export async function getDb(): Promise<admin.firestore.Firestore> {
  const app = getFirebaseApp();
  return admin.firestore(app);
}

/**
 * Returns the singleton Auth instance.
 * Ensures the app is initialized before returning the auth object.
 * @returns {Promise<admin.auth.Auth>} The Firebase Auth object.
 */
export async function getAuth(): Promise<admin.auth.Auth> {
  const app = getFirebaseApp();
  return admin.auth(app);
}
