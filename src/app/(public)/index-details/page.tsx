
'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { HistoricalAnalysis } from '@/components/historical-analysis';
import { CompositionAnalysis } from '@/components/composition-analysis';
import { TrendingUp, Scale, Leaf } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { DateNavigator } from '@/components/date-navigator';
import { parseISO, isValid } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/lib/language-context';

function getValidatedDate(dateString?: string | null): Date {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return new Date();
}

function IndexDetailsContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const targetDate = getValidatedDate(dateParam);
  const { t } = useLanguage();

  const explanatoryCards = [
    {
      icon: Leaf,
      title: "VUS - Valor de Uso do Solo",
      description: "Este é o pilar agrícola do índice. Ele representa o valor gerado pela terra através das principais commodities como soja, milho e boi gordo. O VUS traduz a capacidade produtiva do solo em um valor financeiro claro, refletindo a força da agricultura no índice."
    },
    {
      icon: Scale,
      title: "CRS - Custo de Responsabilidade Socioambiental",
      description: "Este é o pilar de sustentabilidade. O CRS quantifica o valor da preservação, incluindo os créditos de carbono (CRS Carbono) e o valor da água (CRS Água). Ele representa o 'custo' que a natureza arca e que agora é transformado em um ativo financeiro, recompensando a conservação."
    }
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/20">
      <PageHeader
        title="Entenda o Índice UCS"
        description="Explore a evolução, composição e os pilares que dão valor ao nosso índice."
        icon={TrendingUp}
      >
        <DateNavigator targetDate={targetDate} />
      </PageHeader>
      
      <main className="flex flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8">

        {/* Seção Explicativa sobre os Pilares */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {explanatoryCards.map(card => (
            <Card key={card.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <card.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{card.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Seção do Gráfico de Evolução Histórica */}
        <section>
            <HistoricalAnalysis targetDate={targetDate} />
        </section>

        {/* Seção da Composição do Índice */}
        <section>
          <CompositionAnalysis targetDate={targetDate} />
        </section>

      </main>
    </div>
  )
}

export default function IndexDetailsPage() {
  return (
    <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    }>
      <IndexDetailsContent />
    </Suspense>
  );
}
