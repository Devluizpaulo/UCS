'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { isValid, parseISO } from 'date-fns';
import { PageHeader } from '@/components/page-header';
import { DateNavigator } from '@/components/date-navigator';
import { StatisticsAnalysis } from '@/components/statistics-analysis';
import { BarChart3 } from 'lucide-react';

function getValidatedDate(dateString?: string | null): Date {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return new Date();
}

function StatisticsPageContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const targetDate = getValidatedDate(dateParam);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader
        title="Estatísticas e Performance"
        description="Análise detalhada de performance, histórico completo de cotações e métricas estatísticas dos ativos."
        icon={BarChart3}
      >
        <DateNavigator targetDate={targetDate} />
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <StatisticsAnalysis targetDate={targetDate} />
      </main>
    </div>
  );
}

export default function StatisticsPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <StatisticsPageContent />
    </Suspense>
  );
}
