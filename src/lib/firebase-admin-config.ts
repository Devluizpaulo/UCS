
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

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    
    // Use Base64-encoded private key to avoid formatting issues in Vercel.
    const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;

    if (!projectId || !clientEmail || !privateKeyBase64) {
      const missingVars = [];
      if (!projectId) missingVars.push('FIREBASE_PROJECT_ID');
      if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
      if (!privateKeyBase64) missingVars.push('FIREBASE_PRIVATE_KEY_BASE64');
      throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}. Please check your Vercel project settings and refer to VERCEL_SETUP.md.`);
    }

    // Decode the private key from Base64
    const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8');

    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        throw new Error('Decoded private key is not in the correct PEM format. Make sure you are encoding the full key value from your service account JSON file.');
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

    console.log('[Firebase Admin] SDK initialized successfully from Base64 key.');

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
