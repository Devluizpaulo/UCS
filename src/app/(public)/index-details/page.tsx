
'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { 
  Leaf, TrendingUp, Globe, DollarSign, Shield, Zap, TreePine, Target, Award, Coins,
  Building2, Users, BarChart3, Calculator, MapPin, Clock, CheckCircle, ArrowRight,
  PieChart, Activity, Layers, Mountain, Droplets, Wind, Sun, Zap as Lightning
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
      icon: TreePine,
      title: "VUS - Valor de Uso do Solo",
      subtitle: "Fator: 1.0 (Principal)",
      description: "Ativo principal indexado às commodities agrícolas mais importantes do Brasil",
      weight: 1.0,
      weightLabel: "Ativo Principal",
      color: "bg-green-500/10 text-green-700 border-green-200",
      iconColor: "text-green-600",
      composition: {
        title: "Composição do VUS",
        commodities: [
          { name: "Boi Gordo", weight: "40%", currentPrice: "R$ 280,00/@", trend: "+5.2%" },
          { name: "Milho", weight: "35%", currentPrice: "R$ 85,00/sc", trend: "+3.8%" },
          { name: "Soja", weight: "25%", currentPrice: "R$ 180,00/sc", trend: "+2.1%" }
        ],
        explanation: "O VUS é reajustado mensalmente baseado nas cotações das principais commodities agrícolas brasileiras, garantindo valorização contínua e proteção contra inflação."
      },
      commercialValue: "Ativo principal com fator 1.0, reajustado mensalmente pelas cotações de boi, milho e soja."
    },
    {
      icon: Mountain,
      title: "VMAD - Valor da Madeira",
      subtitle: "Fator: 0.21 (Secundário)", 
      description: "Ativo secundário indexado ao mercado madeireiro sustentável certificado",
      weight: 0.21,
      weightLabel: "Ativo Secundário",
      color: "bg-amber-500/10 text-amber-700 border-amber-200",
      iconColor: "text-amber-600",
      composition: {
        title: "Composição do VMAD",
        commodities: [
          { name: "Madeira Certificada", weight: "100%", currentPrice: "R$ 1.200,00/m³", trend: "+4.5%" }
        ],
        explanation: "O VMAD é indexado exclusivamente ao mercado de madeira certificada, garantindo sustentabilidade e valorização do manejo florestal responsável."
      },
      commercialValue: "Ativo secundário com fator 0.21, indexado ao mercado madeireiro com reajuste trimestral."
    },
    {
      icon: Shield,
      title: "CRS - Custo de Responsabilidade Socioambiental",
      subtitle: "Fator: 0.25 (Terciário)",
      description: "Ativo terciário indexado aos mercados de créditos ambientais e serviços ecossistêmicos",
      weight: 0.25,
      weightLabel: "Ativo Terciário",
      color: "bg-blue-500/10 text-blue-700 border-blue-200",
      iconColor: "text-blue-600",
      composition: {
        title: "Composição do CRS",
        commodities: [
          { name: "Créditos de Carbono", weight: "80%", currentPrice: "R$ 45,00/tCO₂", trend: "+8.5%" },
          { name: "Créditos de Água", weight: "20%", currentPrice: "R$ 12,00/m³", trend: "+4.2%" }
        ],
        explanation: "O CRS valoriza os serviços ambientais da floresta amazônica, focando no sequestro de carbono e proteção dos recursos hídricos."
      },
      commercialValue: "Ativo terciário com fator 0.25, indexado aos mercados de carbono e água."
    }
  ];

  // Exemplos Práticos de Composição - Pesos Relativos
  const compositionExamples = [
    {
      scenario: "Portfolio Padrão UCS",
      totalWeight: "1.46",
      breakdown: {
        vus: { weight: "1.0", percentage: "68.41%", description: "Ativo Principal (VUS)", price: "Preço base" },
        vmad: { weight: "0.21", percentage: "14.31%", description: "Ativo Secundário (VMAD)", price: "21% do VUS" },
        crs: { weight: "0.25", percentage: "17.28%", description: "Ativo Terciário (CRS)", price: "25% do VUS" }
      },
      roi: "Baseado no peso 1.0",
      timeframe: "Estrutura permanente"
    },
    {
      scenario: "Portfolio Escalonado",
      totalWeight: "7.3",
      breakdown: {
        vus: { weight: "5.0", percentage: "68.41%", description: "Ativo Principal (VUS)", price: "5x o preço base" },
        vmad: { weight: "1.05", percentage: "14.31%", description: "Ativo Secundário (VMAD)", price: "21% do VUS" },
        crs: { weight: "1.25", percentage: "17.28%", description: "Ativo Terciário (CRS)", price: "25% do VUS" }
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
                A Unidade de Crédito de Sustentabilidade é um ativo financeiro revolucionário que combina preservação ambiental com valorização econômica
              </CardDescription>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mt-6">
                <p className="text-xl font-semibold mb-4 text-green-800">
                  🌱 UCS - Unidade de Crédito de Sustentabilidade
                </p>
                <p className="text-lg text-gray-700 mb-4">
                  Representa os benefícios ambientais de uma área preservada de floresta nativa, produzida a partir da aplicação do BMV Standard.
                </p>
                <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                  <p className="text-xl font-bold text-center text-green-800">
                    🎯 A UCS é um ECOASSET
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-2 text-blue-800">📈 Reajuste Automático</h3>
                  <p className="text-sm text-gray-600">Valorização baseada em cotações reais de mercado</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-2 text-green-800">🌍 Impacto Ambiental</h3>
                  <p className="text-sm text-gray-600">Preservação da floresta amazônica certificada</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-2 text-purple-800">💼 Diversificação</h3>
                  <p className="text-sm text-gray-600">Ativo não-correlacionado com mercados tradicionais</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Composição Detalhada dos Pilares */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            ⚖️ Estrutura de Fatores dos Ativos UCS
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
                            <span className="text-xs font-bold text-primary">{commodity.weight}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm font-bold text-gray-800">{commodity.currentPrice}</span>
                            <span className="text-xs font-bold text-green-600">{commodity.trend}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-3 italic">{pillar.composition.explanation}</p>
                  </div>
                  
                  <div className="bg-primary/5 rounded-lg p-3">
                    <h4 className="font-semibold text-sm mb-2 text-primary">Valor Comercial:</h4>
                    <p className="text-xs text-gray-600">{pillar.commercialValue}</p>
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

        {/* Conclusão Comercial - COMENTADO TEMPORARIAMENTE
        <section>
          <Card className="shadow-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold mb-4">🎯 A UCS: O Futuro dos Investimentos</CardTitle>
              <CardDescription className="text-lg opacity-90">
                Único investimento que combina preservação ambiental, reajuste automático e diversificação estratégica
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2">📈 Reajuste Inteligente</h3>
                  <p className="text-sm opacity-90">
                    Indexado às cotações de boi, milho, soja, madeira e créditos de carbono
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2">🌍 Impacto Real</h3>
                  <p className="text-sm opacity-90">
                    Preservação certificada da floresta amazônica com benefícios mensuráveis
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2">💼 Diversificação Superior</h3>
                  <p className="text-sm opacity-90">
                    3 ativos não-correlacionados que reduzem risco e aumentam retorno
                  </p>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <p className="text-xl font-semibold mb-4">
                  🚀 Transforme sua floresta em um ativo financeiro que se valoriza automaticamente
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 font-bold">
                    <Calculator className="h-5 w-5 mr-2" />
                    Calcular Retorno Esperado
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-emerald-600 font-bold">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Ver Análise Completa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        */}

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
