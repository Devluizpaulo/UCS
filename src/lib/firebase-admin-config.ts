
import admin from 'firebase-admin';

// This is a simplified check to see if the app is already initialized.
if (!admin.apps.length) {
    try {
        const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
        if (!serviceAccountString) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set.');
        }

        const serviceAccount = JSON.parse(Buffer.from(serviceAccountString, 'base64').toString('utf-8'));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('[FirebaseAdmin] Initialized successfully.');
    } catch (e: any) {
        console.error('[FirebaseAdmin] Failed to initialize:', e.message);
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
