
'use server';

import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Users } from 'lucide-react';
import { UserManagementTable } from '@/components/admin/user-management-table';
import { getUsers } from '@/lib/admin-actions';
import { getFirebaseAdmin } from '@/lib/firebase-admin-config';
import { cookies } from 'next/headers';

async function verifyAdmin(): Promise<boolean> {
  try {
    const { auth, db: firestore } = await getFirebaseAdmin();
    const authToken = cookies().get('AuthToken')?.value;

    if (!authToken) {
      return false;
    }

    const decodedToken = await auth.verifyIdToken(authToken);
    const adminUserDoc = await firestore
      .collection('roles_admin')
      .doc(decodedToken.uid)
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
