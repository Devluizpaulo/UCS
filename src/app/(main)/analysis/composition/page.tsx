'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hammer, PieChart } from 'lucide-react';

export default function CompositionAnalysisPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader
        title="Análise de Composição"
        description="Visualize a participação de cada componente nos índices."
        icon={PieChart}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card className="flex flex-1 items-center justify-center border-2 border-dashed">
            <div className="text-center">
                <Hammer className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Página em Implementação</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
                </p>
            </div>
        </Card>
      </main>
    </div>
  );
}
