
'use server';

import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Users } from 'lucide-react';
import { UserManagementTable } from '@/components/admin/user-management-table';
import { getUsers } from '@/lib/admin-actions';
import { getFirebaseAdmin } from '@/lib/firebase-admin-config';

// This is a placeholder for the actual Edge config logic if needed.
// For now, we rely on the server-side config.
const firebaseAdminConfig = {
  apiKey: process.env.FIREBASE_API_KEY!,
  cookieName: 'AuthToken',
  cookieSignatureKeys: ['secret1', 'secret2'],
  serviceAccount: {}, // This would need the actual service account
};

async function verifyAdmin(): Promise<boolean> {
  const { auth, db: firestore } = await getFirebaseAdmin();
  try {
    const { getTokens } = await import('next-firebase-auth-edge');
    const { cookies } = await import('next/headers');
    
    // The service account is fetched within getFirebaseAdmin, so we can pass it here.
    const serviceAccountJsonString = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountJsonString) return false;
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountJsonString, 'base64').toString('utf-8'));


    const tokens = await getTokens(cookies(), {
      apiKey: firebaseAdminConfig.apiKey,
      cookieName: firebaseAdminConfig.cookieName,
      cookieSignatureKeys: firebaseAdminConfig.cookieSignatureKeys,
      serviceAccount: serviceAccount,
    });

    if (!tokens) {
      return false;
    }

    const adminUserDoc = await firestore
      .collection('roles_admin')
      .doc(tokens.decodedToken.uid)
      .get();
    
    return adminUserDoc.exists;
  } catch (error) {
    console.error("Error verifying admin status:", error);
    return false;
  }
}


export default async function AdminUsersPage() {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    redirect('/dashboard');
  }
  
  const users = await getUsers();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader
        title="Gerenciamento de Usuários"
        description="Adicione, edite e gerencie os usuários da plataforma."
        icon={Users}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <UserManagementTable initialUsers={users} />
      </main>
    </div>
  );
}
