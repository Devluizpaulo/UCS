'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import { PageHeader } from '@/components/page-header';
import { 
  Leaf, TrendingUp, Globe, Shield, TreePine, Award,
  Building2, BarChart3, CheckCircle, LandPlot, Loader2
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { parseISO, isValid } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const ucsPillars = [
  {
    icon: LandPlot,
    title: "Valor de Uso do Solo",
    description: "Representa um ativo financeiro inovador, lastreado no potencial produtivo das principais commodities agrícolas brasileiras.",
    color: "bg-green-500/10 text-green-700 border-green-200",
    iconColor: "text-green-600",
    composition: {
      commodities: [
        { name: "Boi Gordo", currentPrice: "R$ 280,00/@" },
        { name: "Milho", currentPrice: "R$ 85,00/sc" },
        { name: "Soja", currentPrice: "R$ 180,00/sc" }
      ],
      explanation: "É registrado mensalmente com base nas cotações de mercado, assegurando transparência e liquidez."
    }
  },
  {
    icon: TreePine,
    title: "Valor da Madeira",
    description: "Mais do que um ativo, é um compromisso com a economia verde. Indexado ao mercado de madeira de manejo sustentável.",
    color: "bg-amber-500/10 text-amber-700 border-amber-200",
    iconColor: "text-amber-600",
    image: {
      src: "https://picsum.photos/seed/forest-harvest/600/400",
      alt: "Ilustração de colheita sustentável na floresta",
      hint: "forest harvest"
    },
    composition: {
      commodities: [
        { name: "Madeira Certificada", currentPrice: "R$ 1.200,00/m³" }
      ],
      explanation: "Sua valorização está ligada à crescente demanda global por produtos florestais éticos."
    }
  },
  {
    icon: Shield,
    title: "Custo de Responsabilidade Socioambiental",
    description: "Ativo de vanguarda que monetiza os serviços ecossistêmicos prestados pela floresta nativa.",
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
    iconColor: "text-blue-600",
    composition: {
      commodities: [
        { name: "Créditos de Carbono", currentPrice: "R$ 45,00/tCO₂" },
        { name: "Créditos de Água", currentPrice: "R$ 12,00/m³" }
      ],
      explanation: "É a materialização financeira da responsabilidade socioambiental, recompensando a preservação."
    }
  }
];

  const competitiveAdvantages = [
    {
      icon: CheckCircle,
      title: "Certificação BMV Standard",
      description: "Único padrão internacional para ativos ambientais amazônicos",
      benefit: "Credibilidade e aceitação global"
    },
    {
      icon: BarChart3,
      title: "Precificação Transparente",
      description: "Valores calculados com base em dados científicos e de mercado",
      benefit: "Transparência total para investidores"
    },
    {
      icon: Globe,
      title: "Impacto Global",
      description: "Contribuição direta para metas de carbono e biodiversidade",
      benefit: "Alinhamento com ESG e sustentabilidade"
    },
    {
      icon: Building2,
      title: "Diversificação de Portfolio",
      description: "Ativo não-correlacionado com mercados tradicionais",
      benefit: "Redução de risco e volatilidade"
    }
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <PageHeader
        title="UCS – O Investimento que se Valoriza Automaticamente"
        description="Descubra como a UCS revoluciona o mercado de investimentos."
        icon={<Award className="h-5 w-5 text-primary hidden sm:block" />}
      />
      
      <main className="flex flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8">
        <section>
          <Card className="shadow-2xl bg-white text-gray-800 border-2 border-green-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Badge className="bg-green-100 text-green-800 border-green-300 text-lg px-4 py-2">
                  🌱 ECOASSET ESTRATÉGICO
                </Badge>
              </div>
              <CardTitle className="text-3xl md:text-4xl font-bold text-gray-800">O que é a UCS?</CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-4">
                A UCS (Unidade de Crédito de Sustentabilidade) é um ECOASSET estratégico que transforma a preservação de florestas nativas em valor financeiro.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            ⚖️ Estrutura dos Ativos UCS
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {ucsPillars.map((pillar) => (
              <Card key={pillar.title} className={`hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 ${pillar.color} border-2`}>
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-6 rounded-full bg-white/70 shadow-lg ${pillar.iconColor}`}>
                      <pillar.icon className="h-10 w-10" />
                    </div>
                  </div>
                  {pillar.image && (
                    <div className="my-4 aspect-video relative overflow-hidden rounded-lg shadow-inner">
                      <Image
                        src={pillar.image.src}
                        alt={pillar.image.alt}
                        width={600}
                        height={400}
                        className="object-cover"
                        data-ai-hint={pillar.image.hint}
                      />
                    </div>
                  )}
                  <CardTitle className="text-xl font-bold">{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed text-center">{pillar.description}</p>
                  <div className="bg-white/50 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-3 text-gray-700">Exemplos:</h4>
                    <div className="space-y-2">
                      {pillar.composition.commodities.map((commodity, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                          <span className="font-semibold text-sm">{commodity.name}</span>
                          <span className="text-sm font-bold text-gray-800">{commodity.currentPrice}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            🚀 Vantagens Competitivas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {competitiveAdvantages.map((advantage) => (
              <Card key={advantage.title} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-t-4 border-t-primary">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <advantage.icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-lg font-bold">{advantage.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">{advantage.description}</p>
                  <div className="bg-primary/5 rounded-lg p-3">
                    <p className="text-xs font-semibold text-primary">{advantage.benefit}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default function IndexDetailsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <IndexDetailsContent />
    </Suspense>
  );
}
