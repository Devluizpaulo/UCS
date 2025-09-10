'use client';

import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/page-header';
import { UpdateProfileForm } from '@/components/update-profile-form';
import { ChangePasswordForm } from '@/components/change-password-form';
import { User } from 'lucide-react';

export default function ProfilePage() {
  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <PageHeader
          title="Meu Perfil"
          description="Gerencie suas informações pessoais e configurações de segurança."
          icon={User}
        />
        <div className="grid gap-8 md:grid-cols-2">
          <UpdateProfileForm />
          <ChangePasswordForm />
        </div>
      </div>
    </MainLayout>
  );
}
