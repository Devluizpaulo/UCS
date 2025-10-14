
'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { HistoricalAnalysis } from '@/components/historical-analysis';
import { TrendingUp } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { DateNavigator } from '@/components/date-navigator';
import { parseISO, isValid } from 'date-fns';

function getValidatedDate(dateString?: string | null): Date {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return new Date();
}

function IndexDetailsContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const targetDate = getValidatedDate(dateParam);
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader
        title="Análise Histórica de Ativos"
        description="Analise a performance histórica do índice e de seus componentes."
        icon={TrendingUp}
      >
        <DateNavigator targetDate={targetDate} />
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <HistoricalAnalysis targetDate={targetDate} />
      </main>
    </div>
  )
}

export default function IndexDetailsPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <IndexDetailsContent />
    </Suspense>
  );
}
