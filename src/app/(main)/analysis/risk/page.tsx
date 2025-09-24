
'use server';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default async function RiskAnalysisPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader
        title="Análise de Risco"
        description="Avalie a volatilidade e correlação dos ativos em relação ao índice."
        icon={ShieldAlert}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Análise de Risco e Volatilidade</CardTitle>
            <CardDescription>
              Ferramentas para análise de risco, volatilidade e correlação serão implementadas aqui.
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
