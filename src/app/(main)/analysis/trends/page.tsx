'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, TrendingUp } from 'lucide-react';

export default function TrendAnalysisPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader
        title="Análise de Tendências"
        description="Analise a performance histórica do índice e de seus componentes."
        icon={TrendingUp}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card className="flex flex-1 items-center justify-center border-2 border-dashed">
            <div className="text-center">
                <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold">Página em Implementação</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Aguardando definição das fórmulas de cálculo.
                </p>
            </div>
        </Card>
      </main>
    </div>
  );
}
