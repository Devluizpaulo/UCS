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
        
        // Use service account credentials from environment variables
        const serviceAccount = {
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY,
            private_key: process.env.FIREBASE_SERVICE_ACCOUNT?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: "",
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
        };
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID
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
