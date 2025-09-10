
/**
 * @fileOverview Firebase Admin SDK configuration for SERVER-SIDE use only.
 * This file provides a robust way to get Firebase service instances,
 * ensuring the SDK is initialized only once.
 */

import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors.
if (!admin.apps.length) {
  try {
    console.log('[Firebase Admin] Initializing Firebase Admin SDK from individual environment variables...');

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    
    // Robustly handle the private key, which can be malformed by Vercel's environment variable handling.
    // 1. Start with the raw key.
    // 2. Remove potential surrounding quotes.
    // 3. Replace all occurrences of '\\n' with an actual newline character.
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    const privateKey = rawPrivateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');


    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing one or more required Firebase environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Please check your Vercel project settings and refer to VERCEL_SETUP.md.');
    }

    const serviceAccount: admin.ServiceAccount = {
      projectId,
      clientEmail,
      privateKey,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.projectId,
    });

    console.log('[Firebase Admin] SDK initialized successfully.');

  } catch (error: any) {
    console.error('[Firebase Admin] CRITICAL INITIALIZATION ERROR:', error.message);
    // We throw the error to fail fast if initialization is impossible.
    // This prevents the app from running in a broken state.
    throw new Error(`Failed to initialize Firebase Admin SDK. Please check your server environment variables. Details: ${error.message}`);
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };
