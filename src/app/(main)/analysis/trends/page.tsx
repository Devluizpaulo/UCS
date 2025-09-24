
'use server';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default async function TrendAnalysisPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader
        title="Análise de Tendências"
        description="Analise a performance histórica do índice e de seus componentes."
        icon={TrendingUp}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Gráficos de Tendência de Mercado</CardTitle>
            <CardDescription>
              Gráficos interativos para análise de performance histórica serão implementados aqui.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20">
              <p className="text-muted-foreground">
                (Em desenvolvimento)
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
