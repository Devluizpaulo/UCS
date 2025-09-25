
'use server';

import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Users } from 'lucide-react';
import { UserManagementTable } from '@/components/admin/user-management-table';
import { getUsers } from '@/lib/admin-actions';
import { auth as adminAuth } from 'firebase-admin';
import { cookies } from 'next/headers';
import { getTokens } from 'next-firebase-auth-edge';
import { firebaseAdminConfig } from '@/lib/firebase-admin-config-edge';

async function verifyAdmin(): Promise<boolean> {
  const tokens = await getTokens(cookies(), {
    apiKey: firebaseAdminConfig.apiKey,
    cookieName: 'AuthToken',
    cookieSignatureKeys: ['secret1', 'secret2'],
    serviceAccount: firebaseAdminConfig.serviceAccount,
  });

  if (!tokens) {
    return false;
  }

  try {
    const adminUserDoc = await adminAuth(firebaseAdminConfig)
      .firestore()
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
