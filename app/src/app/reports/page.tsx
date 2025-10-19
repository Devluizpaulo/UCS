

'use client';

import { PageHeader } from '@/components/page-header';
import { ReportGenerator } from '@/components/report-generator';
import { FileText } from 'lucide-react';
import { MainLayout } from '@/app/main-layout';

export default function ReportsPage() {
  return (
    <MainLayout>
        <div className="flex min-h-screen w-full flex-col">
        <PageHeader
            title="Geração de Relatórios"
            description="Crie, visualize e exporte relatórios analíticos com insights de IA."
            icon={FileText}
        />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <ReportGenerator />
        </main>
        </div>
    </MainLayout>
  );
}
