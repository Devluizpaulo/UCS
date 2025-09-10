
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
    
    // Vercel's environment variable handling can be tricky. This logic robustly handles the private key.
    // 1. Start with the raw key.
    // 2. Replace all occurrences of '\\n' (literal backslash-n) with an actual newline character.
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');


    if (!projectId || !clientEmail || !privateKey) {
      let missingVars = [];
      if (!projectId) missingVars.push('FIREBASE_PROJECT_ID');
      if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
      if (!privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');
      throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}. Please check your Vercel project settings and refer to VERCEL_SETUP.md.`);
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
