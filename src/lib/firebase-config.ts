
// This file exports the plain Firebase config object and the initialized app instances.
// It is NOT marked with 'use server' and is safe for both client and server use.
// Components and services are responsible for initializing the app instance themselves
// to prevent re-initialization errors in Next.js.
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyB3-5OjQnMteTZS-nYaORUI3-dQP19DvSw",
  authDomain: "ucs-index-tracker.firebaseapp.com",
  projectId: "ucs-index-tracker",
  storageBucket: "ucs-index-tracker.appspot.com",
  messagingSenderId: "458013275204",
  appId: "1:458013275204:web:458c46ffb38940dd527811"
};


// Initialize Firebase only once
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);

export { app, auth };
