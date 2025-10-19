
'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { TrendingUp, Scale, Leaf, TreePine, LandPlot, ShieldCheck, Milestone, Search, University } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
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
      icon: TreePine,
      title: "1. VMAD – Valor da Madeira",
      description: "Representa o valor direto obtido pela exploração da mata nativa, ou seja, o preço comercial da madeira extraída e vendida. É medido em dólares por metro cúbico por hectare de floresta e reflete o retorno imediato que a extração gera.",
      commercial: "Mostra o valor bruto do corte – o quanto o mercado paga hoje pela floresta em forma de recurso madeireiro.",
      evaluation: "Método Americano e Cálculo de Custo de Oportunidade."
    },
    {
      icon: LandPlot,
      title: "2. VUS – Valor de Uso do Solo",
      description: "Calcula o valor econômico da terra caso fosse convertida para outros usos – agropecuário, industrial ou urbano. Mostra o valor de oportunidade financeira da exploração territorial, expresso em dólares por hectare.",
      commercial: "Indica o custo de oportunidade da preservação – o quanto se deixaria de ganhar se a floresta permanecer intocada.",
      evaluation: "Método Americano e Custo de Oportunidade."
    },
    {
      icon: ShieldCheck,
      title: "3. CRS – Custo da Responsabilidade Socioambiental",
      description: "Mensura o valor financeiro do investimento em preservação, ou seja, quanto custa manter os benefícios que a floresta fornece à sociedade e à economia. O cálculo considera fatores como água ciclada, sequestro de carbono (estimado em 5% a.a.) e serviços ecossistêmicos baseados no modelo internacional TEEB (The Economics of Ecosystems and Biodiversity).",
      commercial: "O CRS é o contrapeso sustentável do PDM: demonstra que a preservação também gera valor econômico real, por meio da compensação ambiental, da imagem corporativa positiva e da manutenção dos recursos que sustentam a economia regional.",
      evaluation: "Baseado em cálculos do TEEB, incluindo benefícios de armazenamento de carbono, fornecimento de água e expansão de áreas de preservação."
    }
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/20">
      <PageHeader
        title="PDM – Potencial Desflorestador Monetizado"
        description="Entenda como o PDM traduz o valor da floresta em um ativo econômico mensurável."
        icon={Milestone}
      />
      
      <main className="flex flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8">

        {/* Seção Introdutória */}
        <section>
          <Card className="shadow-lg bg-background">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">O que é o PDM?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p className="text-base">
                O Potencial Desflorestador Monetizado (PDM) é um modelo de valoração que traduz, em números, o valor econômico das áreas de floresta sob três perspectivas complementares: o ganho direto pela exploração, a oportunidade perdida ao preservar, e o investimento necessário para manter os serviços ambientais que sustentam a economia.
              </p>
              <p className="font-semibold text-foreground">
                Em termos simples: o PDM transforma a floresta em um ativo mensurável — capaz de expressar tanto o lucro potencial da exploração quanto o retorno econômico da conservação.
              </p>
            </CardContent>
          </Card>
        </section>
        
        {/* Seção Explicativa sobre os Pilares */}
        <section className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-8">
          {explanatoryCards.map(card => (
            <Card key={card.title} className="hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <card.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <p className="text-sm text-muted-foreground mb-4">{card.description}</p>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-2"><Search className="h-4 w-4 text-primary/80"/>Comercialmente:</h4>
                    <p className="text-xs text-muted-foreground mt-1">{card.commercial}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-2"><University className="h-4 w-4 text-primary/80"/>Processo de Avaliação:</h4>
                    <p className="text-xs text-muted-foreground mt-1">{card.evaluation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Seção de Conclusão */}
        <section>
          <Card className="bg-primary/90 text-primary-foreground shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Em Linguagem Prática</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                O PDM quantifica o equilíbrio entre explorar e preservar, permitindo criar métricas de compensação, crédito de carbono, e valoração de ativos ambientais com base em dados financeiros concretos. É uma ferramenta para transformar a sustentabilidade em estratégia econômica mensurável.
              </p>
            </CardContent>
          </Card>
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
