'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { EnhancedTrendAnalysis } from '@/components/enhanced-trend-analysis';
import { TrendingUp, Loader2 } from 'lucide-react';
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

function TrendAnalysisContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const targetDate = getValidatedDate(dateParam);
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader
        title="Análise Avançada e Séries Históricas"
        description="Analise a performance histórica com gráficos interativos, tabelas detalhadas e métricas avançadas."
        icon={<TrendingUp className="h-5 w-5 text-primary hidden sm:block" />}
      >
        <DateNavigator targetDate={targetDate} />
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <EnhancedTrendAnalysis targetDate={targetDate} />
      </main>
    </div>
  )
}

export default function TrendAnalysisPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <TrendAnalysisContent />
    </Suspense>
  );
}
