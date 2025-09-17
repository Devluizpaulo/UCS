
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

    // Check if we have the Base64 encoded service account
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    
    if (!serviceAccountBase64) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set. This is required for server-side operations. Please check your Vercel/server environment variables.');
    }

    // Decode the Base64 service account
    let serviceAccount;
    try {
        const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(serviceAccountJson);
    } catch (error: any) {
        throw new Error(`Failed to decode or parse FIREBASE_SERVICE_ACCOUNT_BASE64. Make sure it is a valid Base64 encoded JSON string. Error: ${error.message}`);
    }

    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error('Decoded service account JSON is missing required fields (project_id, client_email, private_key).');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log('[Firebase Admin] SDK initialized successfully.');

  } catch (error: any) {
    console.error('[Firebase Admin] CRITICAL INITIALIZATION ERROR:', error.message);
    // We throw the error to fail fast if initialization is impossible.
    // This prevents the app from running in a broken state.
    throw new Error(`Failed to initialize Firebase Admin SDK. Details: ${error.message}`);
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };
