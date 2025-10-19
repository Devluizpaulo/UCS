

'use server';

import { PageHeader } from '@/components/page-header';
import { Users } from 'lucide-react';
import { UserManagementTable } from '@/components/admin/user-management-table';
import { getUsers } from '@/lib/admin-actions';
import { MainLayout } from '@/app/main-layout';

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <MainLayout>
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
    </MainLayout>
  );
}
