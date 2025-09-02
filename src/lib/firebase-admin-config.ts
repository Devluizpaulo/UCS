
'use server';
/**
 * @fileOverview Firebase Admin SDK configuration for SERVER-SIDE use only.
 * This file provides singleton instances of Firebase services to prevent
 * re-initialization on every server request, which is crucial for performance
 * and avoiding errors in a serverless environment.
 */

import admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        console.log('[Firebase Admin] Initializing Firebase Admin SDK...');
        admin.initializeApp({
             // Environment variables are used for security and are automatically
             // available in the Vercel/Firebase environment.
        });
        console.log('[Firebase Admin] SDK initialized successfully.');
    } catch(error: any) {
        console.error('[Firebase Admin] Initialization error:', error.stack);
        // We throw the error to fail fast if initialization is impossible.
        // This prevents the app from running in a broken state.
        throw new Error('Failed to initialize Firebase Admin SDK.');
    }
}

const db = admin.firestore();
const auth = admin.auth();

/**
 * Returns the singleton Firestore instance.
 * @returns {Promise<admin.firestore.Firestore>} A promise that resolves to the Firestore database object.
 */
export async function getDb(): Promise<admin.firestore.Firestore> {
  return db;
}

/**
 * Returns the singleton Auth instance.
 * @returns {Promise<admin.auth.Auth>} A promise that resolves to the Firebase Auth object.
 */
export async function getAuth(): Promise<admin.auth.Auth> {
  return auth;
}
