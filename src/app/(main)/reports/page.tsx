
'use server';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default async function ReportsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader
        title="Geração de Relatórios"
        description="Crie, visualize e exporte relatórios analíticos com insights de IA."
        icon={FileText}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Relatórios Executivos</CardTitle>
            <CardDescription>
              A funcionalidade de geração de relatórios (PDF, XLSX) com IA será implementada aqui.
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
