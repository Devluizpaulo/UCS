
'use client';

import { PageHeader } from '@/components/page-header';
import { ShieldAlert } from 'lucide-react';
import { VolatilityAnalysis } from '@/components/volatility-analysis';

export default function RiskAnalysisPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader
        title="Análise de Risco"
        description="Avalie a volatilidade e correlação dos ativos em relação ao índice."
        icon={ShieldAlert}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <VolatilityAnalysis />
      </main>
    </div>
  );
}
