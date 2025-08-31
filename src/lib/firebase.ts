'use server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// IMPORTANT: Do not use this code in client-side components.
// This is server-side code and must only be imported in server components
// or server actions (files with 'use server').

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

if (!serviceAccount) {
  throw new Error(
    'Firebase service account credentials are not set in the environment variables.'
  );
}

// Initialize Firebase
const apps = getApps();
if (!apps.length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

export { db };
