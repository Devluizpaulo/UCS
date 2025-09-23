
'use server';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SlidersHorizontal } from 'lucide-react';

export default async function FormulaSettingsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader
        title="Configuração da Fórmula do Índice"
        description="Ajuste os parâmetros, pesos e fatores que compõem o cálculo do Índice UCS."
        icon={SlidersHorizontal}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros da Fórmula</CardTitle>
            <CardDescription>
              Esta seção permitirá a configuração detalhada dos cálculos. (Em desenvolvimento)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20">
              <p className="text-muted-foreground">
                Interface de configuração da fórmula será implementada aqui.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
