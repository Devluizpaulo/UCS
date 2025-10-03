'use client';

import { PageHeader } from '@/components/page-header';
import { TrendChart } from '@/components/trend-chart';
import { TrendingUp } from 'lucide-react';

export default function TrendAnalysisPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader
        title="Análise Histórica de Ativos"
        description="Analise a performance histórica do índice e de seus componentes."
        icon={TrendingUp}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <TrendChart />
      </main>
    </div>
  );
}
