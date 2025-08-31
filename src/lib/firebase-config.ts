// @ts-nocheck
// IMPORTANT: This file is not marked with 'use server' and should not be,
// as it needs to be accessible on both the client and server for Firebase initialization.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyB3-5OjQnMteTZS-nYaORUI3-dQP19DvSw",
  authDomain: "ucs-index-tracker.firebaseapp.com",
  projectId: "ucs-index-tracker",
  storageBucket: "ucs-index-tracker.appspot.com",
  messagingSenderId: "458013275204",
  appId: "1:458013275204:web:458c46ffb38940dd527811"
};


// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { app, db, auth, storage, functions };
