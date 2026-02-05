
import admin from 'firebase-admin';

let app: admin.app.App;

/**
 * Initializes and returns the SDK do Firebase Admin.
 * Usa um padrão singleton para evitar reinicializações.
 */
function initializeAdminApp() {
    // If it's already initialized, return the existing app.
    if (admin.apps.find(a => a?.name === 'firebase-admin-app')) {
        return admin.app('firebase-admin-app');
    }

    // Initialize otherwise.
    try {
        const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
        if (!serviceAccountString) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set.');
        }
        
        // Limpar o valor Base64 removendo quebras de linha e espaços
        const cleanBase64 = serviceAccountString.replace(/\s/g, '');
        
        const serviceAccount = JSON.parse(Buffer.from(cleanBase64, 'base64').toString('utf-8'));

        console.log('[FirebaseAdmin] Initializing for the first time...');
        
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        }, 'firebase-admin-app');

    } catch (e: any) {
        console.error('[FirebaseAdmin] Failed to initialize:', e.message);
        // Em caso de falha, lançamos o erro para que o chamador saiba que o admin SDK não está disponível.
        throw new Error('Firebase Admin SDK could not be initialized.');
    }
}


export async function getFirebaseAdmin() {
    const app = initializeAdminApp();
    return {
        auth: app.auth(),
        db: app.firestore(),
    };
}
