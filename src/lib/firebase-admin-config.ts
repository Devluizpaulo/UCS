// @ts-nocheck
'use server';
/**
 * @fileOverview Firebase Admin SDK configuration for SERVER-SIDE use only.
 */

import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // Using environment variables for admin config is a best practice
      // In this environment, we assume they are set.
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };
