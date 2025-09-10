
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

    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountString) {
      throw new Error('Missing required environment variable: FIREBASE_SERVICE_ACCOUNT. Please refer to VERCEL_SETUP.md for instructions.');
    }

    let serviceAccount: admin.ServiceAccount;

    try {
      // First, try to parse the variable as a JSON string.
      // This works for local development and environments where the JSON is passed directly.
      serviceAccount = JSON.parse(serviceAccountString);
    } catch (e) {
      // If parsing fails, it's likely because the environment (like Vercel)
      // doesn't handle multi-line JSONs well. We'll try to build it from base64.
      // This is a more robust way for production environments.
      try {
        const decodedString = Buffer.from(serviceAccountString, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decodedString);
      } catch (e2) {
        // If both methods fail, the variable is malformed.
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT as direct JSON or Base64-encoded JSON.");
        throw new Error("The FIREBASE_SERVICE_ACCOUNT environment variable is not a valid JSON string or a valid Base64-encoded JSON string. Please refer to VERCEL_SETUP.md.");
      }
    }
    
    // Final validation to ensure the service account is valid
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        throw new Error('Parsed FIREBASE_SERVICE_ACCOUNT is not a valid service account object. Please ensure it contains projectId, clientEmail, and privateKey.');
    }

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
