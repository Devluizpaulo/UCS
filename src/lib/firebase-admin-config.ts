// @ts-nocheck
'use server';
/**
 * @fileOverview Firebase Admin SDK configuration for SERVER-SIDE use only.
 * This file provides singleton instances of Firebase services to prevent
 * re-initialization on every server request, which is crucial for performance
 * and avoiding errors in a serverless environment like Vercel.
 */

import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  try {
    console.log('[Firebase Admin] Initializing Firebase Admin SDK...');
    admin.initializeApp({
      // Environment variables are used for security and are automatically
      // available in the Vercel environment.
    });
    console.log('[Firebase Admin] SDK initialized successfully.');
  } catch (error) {
    console.error('[Firebase Admin] Initialization error:', error.stack);
  }
}

const db = admin.firestore();
const auth = admin.auth();

/**
 * Returns the singleton Firestore instance.
 * @returns {Promise<admin.firestore.Firestore>} The Firestore database object.
 */
export async function getDb() {
  return db;
}

/**
 * Returns the singleton Auth instance.
 * @returns {Promise<admin.auth.Auth>} The Firebase Auth object.
 */
export async function getAuth() {
  return auth;
}
