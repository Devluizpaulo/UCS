
'use client';

import { PageHeader } from '@/components/page-header';
import { PieChart } from 'lucide-react';
import { CompositionAnalysis } from '@/components/composition-analysis';

export default function CompositionAnalysisPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader
        title="Análise de Composição"
        description="Visualize a participação de cada componente no índice Valor de Uso do Solo."
        icon={PieChart}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <CompositionAnalysis />
      </main>
    </div>
  );
}
