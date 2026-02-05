
import admin from 'firebase-admin';

// Use a singleton pattern to initialize Firebase Admin only once.
let app: admin.app.App;

function initializeAdminApp() {
    // If the app is already initialized in this instance, return it.
    if (app) {
        return app;
    }
    
    // In serverless environments, `admin.apps` can be checked to see if an app was initialized
    // in a previous invocation of the function within the same container.
    const existingApp = admin.apps.find(a => a?.name === 'firebase-admin-app');
    if (existingApp) {
        app = existingApp;
        return app;
    }

    // Otherwise, initialize a new app.
    try {
        const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
        if (!serviceAccountString) {
            throw new Error('A variável de ambiente FIREBASE_SERVICE_ACCOUNT_BASE64 não está configurada.');
        }
        
        // Limpa a string base64, removendo quebras de linha ou espaços que podem ser adicionados
        // ao copiar/colar a variável de ambiente.
        const cleanBase64 = serviceAccountString.replace(/\s/g, '');
        const serviceAccount = JSON.parse(Buffer.from(cleanBase64, 'base64').toString('utf-8'));

        console.log('[FirebaseAdmin] Inicializando pela primeira vez...');
        
        app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        }, 'firebase-admin-app'); // Use um nome para a app para evitar conflitos

        return app;

    } catch (e: any) {
        // Se a app já existir (condição de corrida em ambientes serverless), reutilize-a.
        if (e.code === 'app/duplicate-app') {
            console.warn('[FirebaseAdmin] A app já foi inicializada, reutilizando instância existente.');
            app = admin.app('firebase-admin-app');
            return app;
        }

        console.error('[FirebaseAdmin] Falha ao inicializar:', e.message);
        throw new Error('O SDK do Firebase Admin não pôde ser inicializado.');
    }
}

/**
 * Retorna as instâncias dos serviços do Firebase Admin (Auth e Firestore).
 * A inicialização é tratada de forma segura para ambientes serverless.
 */
export async function getFirebaseAdmin() {
    const adminApp = initializeAdminApp();
    return {
        auth: adminApp.auth(),
        db: adminApp.firestore(),
    };
}
