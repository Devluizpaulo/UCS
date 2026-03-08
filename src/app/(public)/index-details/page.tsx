'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import { PageHeader } from '@/components/page-header';
import { 
  Leaf, TrendingUp, Globe, DollarSign, Shield, Zap, TreePine, Target, Award, Coins,
  Building2, Users, BarChart3, Calculator, MapPin, Clock, CheckCircle, ArrowRight,
  PieChart, Activity, Layers, Mountain, Droplets, Wind, Sun, LandPlot
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { parseISO, isValid } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

// Composição Detalhada dos Pilares da UCS
const ucsPillars = [
  {
    icon: LandPlot,
    title: "Valor de Uso do Solo",
    subtitle: "Ativo Principal",
    description: "Representa um ativo financeiro inovador, lastreado no potencial produtivo das principais commodities agrícolas brasileiras. Através de uma curadoria técnica criteriosa, captura a solidez do agronegócio nacional, oferecendo uma alternativa de investimento diretamente conectada à economia real. Sua composição diversificada e rebalanceamento periódico garantem resiliência e uma valorização consistente, funcionando como um hedge natural contra a inflação.",
    weight: 1.0,
    weightLabel: "Ativo Principal",
    color: "bg-green-500/10 text-green-700 border-green-200",
    iconColor: "text-green-600",
    composition: {
      title: "Exemplos de Ativos",
      commodities: [
        { name: "Boi Gordo", currentPrice: "R$ 280,00/@" },
        { name: "Milho", currentPrice: "R$ 85,00/sc" },
        { name: "Soja", currentPrice: "R$ 180,00/sc" }
      ],
      explanation: "É registrado mensalmente com base nas cotações de mercado, assegurando transparência, liquidez e uma gestão de risco baseada em dados concretos do setor."
    }
  },
  {
    icon: TreePine,
    title: "Valor da Madeira",
    subtitle: "Ativo Secundário", 
    description: "Mais do que um ativo, é um compromisso com a economia verde. Ele é exclusivamente indexado ao mercado de madeira de manejo florestal sustentável certificada, promovendo uma exploração que preserva o bioma para as futuras gerações. Ao investir neste pilar, o detentor não apenas acessa um nicho de mercado em franca expansão, mas também financia diretamente a conservação da floresta em pé, recebendo dividendos ambientais e econômicos.",
    weight: 0.21,
    weightLabel: "Ativo Secundário",
    color: "bg-amber-500/10 text-amber-700 border-amber-200",
    iconColor: "text-amber-600",
    image: {
      src: "https://picsum.photos/seed/forest-harvest/600/400",
      alt: "Ilustração de colheita sustentável na floresta",
      hint: "forest harvest"
    },
    composition: {
      title: "Exemplo de Ativo",
      commodities: [
        { name: "Madeira Certificada", currentPrice: "R$ 1.200,00/m³" }
      ],
      explanation: "Sua valorização está intrinsicamente ligada à crescente demanda global por produtos florestais éticos e com rastreabilidade garantida, tornando-o um pilar para carteiras de investimento com foco em ESG."
    }
  },
  {
    icon: Shield,
    title: "Custo de Responsabilidade Socioambiental",
    subtitle: "Ativo Terciário",
    description: "É um ativo de vanguarda que monetiza os serviços ecossistêmicos prestados pela floresta nativa. Ele traduz em valor financeiro tangível benefícios intangíveis, porém cruciais, como o sequestro de carbono e a proteção de recursos hídricos. Este ativo conecta investidores à nova economia de baixo carbono, permitindo que eles participem ativamente da criação de um futuro mais sustentável, com retornos associados ao desempenho ambiental.",
    weight: 0.25,
    weightLabel: "Ativo Terciário",
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
    iconColor: "text-blue-600",
    composition: {
      title: "Exemplos de Ativos",
      commodities: [
        { name: "Créditos de Carbono", currentPrice: "R$ 45,00/tCO₂" },
        { name: "Créditos de Água", currentPrice: "R$ 12,00/m³" }
      ],
      explanation: "É a materialização financeira da responsabilidade socioambiental, criando um fluxo de capital positivo que recompensa a preservação e gera impacto mensurável tanto para o planeta quanto para o portfólio."
    }
  }
];

  // Exemplos Práticos de Composição - Pesos Relativos
  const compositionExamples = [
    {
      scenario: "Portfolio Padrão UCS",
      totalWeight: "1.46",
      breakdown: {
        vus: { weight: "1.0", percentage: "68.41%", description: "Valor de Uso do Solo", price: "Preço base" },
        vmad: { weight: "0.21", percentage: "14.31%", description: "Valor da Madeira", price: "21% do total" },
        crs: { weight: "0.25", percentage: "17.28%", description: "Custo de Resp. Socioambiental", price: "25% do total" }
      },
      roi: "Baseado no peso 1.0",
      timeframe: "Estrutura permanente"
    },
    {
      scenario: "Portfolio Escalonado",
      totalWeight: "7.3",
      breakdown: {
        vus: { weight: "5.0", percentage: "68.41%", description: "Valor de Uso do Solo", price: "5x o preço base" },
        vmad: { weight: "1.05", percentage: "14.31%", description: "Valor da Madeira", price: "21% do total" },
        crs: { weight: "1.25", percentage: "17.28%", description: "Custo de Resp. Socioambiental", price: "25% do total" }
      },
      roi: "Proporcional ao peso",
      timeframe: "Escala permite maior eficiência"
    }
  ];

  // Vantagens Competitivas
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
        description="Descubra como a UCS revoluciona o mercado de investimentos com reajuste automático baseado em commodities reais."
        icon={Award}
      />
      
      <main className="flex flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8">

        {/* Hero Section */}
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
                A UCS (Unidade de Crédito de Sustentabilidade) é um ECOASSET estratégico que transforma a preservação de florestas nativas em valor financeiro, representando os benefícios ambientais mensuráveis de áreas conservadas por meio da metodologia BMV Standard, criando uma ponte inovadora entre economia e sustentabilidade.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
            </CardContent>
          </Card>
        </section>

        {/* Composição Detalhada dos Pilares */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            ⚖️ Estrutura dos Ativos UCS
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {ucsPillars.map((pillar, index) => (
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
                  <div className="space-y-2">
                    <CardTitle className="text-xl font-bold">{pillar.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed text-center">
                    {pillar.description}
                  </p>
                  
                  <div className="bg-white/50 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-3 text-gray-700">Exemplos de Ativos:</h4>
                    <div className="space-y-2">
                      {pillar.composition.commodities.map((commodity, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-sm">{commodity.name}</span>
                            <span className="text-sm font-bold text-gray-800">{commodity.currentPrice}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-3 italic">{pillar.composition.explanation}</p>
                  </div>
                  
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Vantagem do Reajuste e Indexação */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            🚀 Por que a UCS é Superior aos Outros Investimentos?
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Investimentos Tradicionais */}
            <Card className="hover:shadow-xl transition-all duration-300 bg-red-50 border-l-4 border-l-red-400">
              <CardHeader>
                <CardTitle className="text-xl text-red-700 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  Investimentos Tradicionais
              </CardTitle>
            </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border border-red-200">
                    <h4 className="font-semibold text-sm text-red-700 mb-2">Ações</h4>
                    <p className="text-xs text-gray-600">• Volatilidade alta</p>
                    <p className="text-xs text-gray-600">• Dependente de resultados da empresa</p>
                    <p className="text-xs text-gray-600">• Sem proteção contra inflação</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-red-200">
                    <h4 className="font-semibold text-sm text-red-700 mb-2">CDB/Renda Fixa</h4>
                    <p className="text-xs text-gray-600">• Rendimento fixo</p>
                    <p className="text-xs text-gray-600">• Perde para inflação</p>
                    <p className="text-xs text-gray-600">• Sem diversificação</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-red-200">
                    <h4 className="font-semibold text-sm text-red-700 mb-2">Fundos Imobiliários</h4>
                    <p className="text-xs text-gray-600">• Dependente do mercado imobiliário</p>
                    <p className="text-xs text-gray-600">• Liquidez limitada</p>
                    <p className="text-xs text-gray-600">• Custos de manutenção</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* UCS - Investimento Superior */}
            <Card className="hover:shadow-xl transition-all duration-300 bg-green-50 border-l-4 border-l-green-400">
              <CardHeader>
                <CardTitle className="text-xl text-green-700 flex items-center gap-2">
                  <Award className="h-6 w-6" />
                  UCS - Investimento Superior
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-sm text-green-700 mb-2">Reajuste Automático</h4>
                    <p className="text-xs text-gray-600">• Indexado a commodities reais</p>
                    <p className="text-xs text-gray-600">• Valorização contínua</p>
                    <p className="text-xs text-gray-600">• Proteção contra inflação</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-sm text-green-700 mb-2">Diversificação Natural</h4>
                    <p className="text-xs text-gray-600">• 3 ativos diferentes</p>
                    <p className="text-xs text-gray-600">• Mercados não-correlacionados</p>
                    <p className="text-xs text-gray-600">• Redução de risco</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-sm text-green-700 mb-2">Impacto Positivo</h4>
                    <p className="text-xs text-gray-600">• Preservação ambiental</p>
                    <p className="text-xs text-gray-600">• Certificação internacional</p>
                    <p className="text-xs text-gray-600">• ESG compliance</p>
                  </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </section>

        {/* Vantagens Competitivas */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            🚀 Vantagens Competitivas da UCS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {competitiveAdvantages.map((advantage, index) => (
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
    <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    }>
      <IndexDetailsContent />
    </Suspense>
  );
}
