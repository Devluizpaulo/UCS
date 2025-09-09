'use client';

import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/page-header';
import { UCSCalculator } from '@/components/ucs-calculator';
import { Calculator } from 'lucide-react';

export default function UCSCalculatorPage() {
  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <PageHeader
          title="Calculadora UCS"
          description="Calcule o valor da Unidade de Crédito de Sustentabilidade baseado na metodologia oficial"
          icon={Calculator}
        />
        <UCSCalculator />
      </div>
    </MainLayout>
  );
}