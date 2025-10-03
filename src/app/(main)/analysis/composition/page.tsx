'use client';

import { PageHeader } from '@/components/page-header';
import { PieChart, Calendar } from 'lucide-react';
import { CompositionAnalysis } from '@/components/composition-analysis';
import { useSearchParams } from 'next/navigation';
import { DateNavigator } from '@/components/date-navigator';
import { parseISO, isValid } from 'date-fns';
import { Suspense } from 'react';

function getValidatedDate(dateString?: string | null): Date {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return new Date();
}

function CompositionPageContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const targetDate = getValidatedDate(dateParam);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader
        title="Análise de Composição"
        description="Visualize a participação de cada componente no índice Valor de Uso do Solo."
        icon={PieChart}
      >
        <DateNavigator targetDate={targetDate} />
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <CompositionAnalysis targetDate={targetDate} />
      </main>
    </div>
  );
}

export default function CompositionAnalysisPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <CompositionPageContent />
    </Suspense>
  );
}
