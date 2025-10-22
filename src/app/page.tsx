
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { DollarSign, Euro, Leaf, User, ShieldCheck, Target, BarChart3, Scale, Microscope, FileText, Landmark, FileJson, CheckCircle, Search, GitBranch, Banknote, Building, Trees, Globe, ChevronRight, TrendingUp, TrendingDown, Minus, Blocks, TreePine, LandPlot, Briefcase, Award } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { LogoUCS } from "@/components/logo-bvm";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import type { CommodityPriceData } from '@/lib/types';
import Autoplay from "embla-carousel-autoplay";
import { getCommodityPrices } from '@/lib/data-service';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Tipo local para incluir dados de conversão
type IndexValue = {
  currency: 'BRL' | 'USD' | 'EUR';
  value: number;
  change: number;
  conversionRate?: number;
};


export default function PDMDetailsPage() {
  const [allPrices, setAllPrices] = React.useState<CommodityPriceData[]>([]);
  const { t } = useLanguage();
  
  React.useEffect(() => {
    getCommodityPrices().then(setAllPrices);
  }, []);
  
  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  const ucsAseAsset = allPrices.find(p => p.id === 'ucs_ase');
  
  const getIndexValues = (): IndexValue[] => {
    if (!ucsAseAsset) return [];

    let indexValues: IndexValue[] = [];

    // Valor em BRL
    if (ucsAseAsset.price) {
        indexValues.push({ 
          currency: 'BRL', 
          value: ucsAseAsset.price, 
          change: ucsAseAsset.change || 0, 
        });
    }

    // Valor em USD (se disponível)
    if (ucsAseAsset.valor_usd) {
      indexValues.push({ 
        currency: 'USD', 
        value: ucsAseAsset.valor_usd, 
        change: ucsAseAsset.change || 0,
        conversionRate: ucsAseAsset.valores_originais?.cotacao_usd
      });
    }
    
    // Valor em EUR (se disponível)
    if (ucsAseAsset.valor_eur) {
      indexValues.push({ 
        currency: 'EUR', 
        value: ucsAseAsset.valor_eur, 
        change: ucsAseAsset.change || 0,
        conversionRate: ucsAseAsset.valores_originais?.cotacao_eur
      });
    }
    
    return indexValues;
  };
  
  const indexValues = getIndexValues();
  
  const homeT = t.home;

  const stakeholders = [
    { icon: User, title: homeT.stakeholders.producers.title, description: homeT.stakeholders.producers.description },
    { icon: Building, title: homeT.stakeholders.investors.title, description: homeT.stakeholders.investors.description },
    { icon: Landmark, title: homeT.stakeholders.institutions.title, description: homeT.stakeholders.institutions.description },
    { icon: Globe, title: homeT.stakeholders.environment.title, description: homeT.stakeholders.environment.description },
  ];

  const pilaresPDM = [
    {
      icon: TreePine,
      title: "Valor Econômico da Floresta (VMAD)",
      description: "Representa o potencial econômico direto da floresta através da exploração madeireira sustentável, refletindo o retorno imediato do recurso.",
      perspective: "Evidencia o valor de mercado do recurso florestal, servindo como base para licenças e projetos de manejo.",
      methodology: "Combina o Método Americano de avaliação com a análise de Custo de Oportunidade, considerando espécies, custos e preços de mercado."
    },
    {
      icon: LandPlot,
      title: "Valor de Transformação Territorial (VUS)",
      description: "Estima o valor da terra se fosse convertida para outros usos produtivos (agropecuário, industrial, etc.), representando o custo de oportunidade da preservação.",
      perspective: "Indica o custo econômico de manter a floresta intacta, essencial para planejamento territorial e compensações.",
      methodology: "Baseado no Método Americano adaptado, considerando produtividade potencial, retorno financeiro e custos operacionais."
    },
    {
      icon: ShieldCheck,
      title: "Valor Socioambiental da Conservação (CRS)",
      description: "Quantifica o investimento necessário para manter os serviços ecossistêmicos da floresta (clima, água, carbono), expressando o valor da floresta viva.",
      perspective: "Traduz a preservação em ativo econômico real, gerando créditos de carbono e fortalecendo a imagem corporativa.",
      methodology: "Fundamentado no modelo internacional TEEB, contemplando sequestro de carbono, ciclagem de água e proteção da biodiversidade."
    }
  ];

  const aplicacoesPDM = [
    {
      icon: TrendingUp,
      title: "Compensação Ambiental",
      description: "Base para cálculo de valores justos por supressão vegetal, com métricas padronizadas."
    },
    {
      icon: BarChart3,
      title: "Créditos de Carbono",
      description: "Valoração precisa do sequestro de carbono, criando ativos negociáveis em mercados."
    },
    {
      icon: FileText,
      title: "Licenciamento Ambiental",
      description: "Suporte técnico-econômico para definir condicionantes e medidas compensatórias."
    },
    {
      icon: Briefcase,
      title: "Gestão de Ativos",
      description: "Inclusão de ativos ambientais em balanços patrimoniais com metodologia de valuation reconhecida."
    }
  ];
  
  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" aria-label="Página Inicial">
            <LogoUCS />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
             <Button variant="ghost" size="icon" asChild>
                <Link href="/login">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Acessar Plataforma</span>
                </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative flex h-[90vh] min-h-[700px] w-full flex-col items-center justify-center overflow-hidden p-4">
           <div className="absolute inset-0 z-0 h-full w-full">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover blur-sm brightness-50"
                >
                    <source src="/video/hero.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
          
          <div className="relative z-10 flex h-full w-full max-w-6xl flex-col items-center justify-center gap-8 text-center">
            
            <div className="flex flex-col items-center gap-4 px-4 md:px-6">
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-white drop-shadow-lg animate-fade-in-down">
                PDM – Potencial Desflorestador Monetizado
              </h1>
              <p className="mx-auto max-w-3xl text-lg text-gray-200 md:text-xl drop-shadow-md animate-fade-in-up">
                Transformando o valor da floresta em ativos econômicos mensuráveis
              </p>
            </div>

            <div className="w-full max-w-4xl p-4 animate-fade-in-up animation-delay-400">
               <Card className="bg-background/20 backdrop-blur-md border-white/20 text-white shadow-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl font-bold">{homeT.quote.title}</CardTitle>
                    <CardDescription className="text-gray-300">{homeT.quote.subtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Carousel
                    opts={{ align: "start", loop: true }}
                    plugins={[autoplayPlugin.current]}
                    onMouseEnter={() => autoplayPlugin.current.stop()}
                    onMouseLeave={() => autoplayPlugin.current.play()}
                    className="w-full"
                  >
                    <CarouselContent>
                      {indexValues.map((item, index) => (
                        <CarouselItem key={index} className="basis-full">
                          <div className="flex flex-col items-center justify-center p-4">
                            <div className="flex items-baseline gap-3">
                              <span className="text-5xl font-extrabold">
                                {formatCurrency(item.value, item.currency, item.currency)}
                              </span>
                              <div className={cn('flex items-center text-lg font-semibold', item.change >= 0 ? 'text-green-400' : 'text-red-400')}>
                                  {item.change >= 0 ? <TrendingUp className="h-5 w-5 mr-1" /> : <TrendingDown className="h-5 w-5 mr-1" />}
                                  {item.change.toFixed(2)}%
                              </div>
                            </div>
                            {item.conversionRate && (
                              <div className="mt-2 text-sm text-gray-300">
                                {homeT.quote.conversionRate}: {formatCurrency(item.conversionRate, 'BRL')}
                              </div>
                            )}
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* INTRODUCTION SECTION */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">O que é o PDM</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                O **Potencial Desflorestador Monetizado (PDM)** é um modelo inovador de **valoração econômica ambiental** que quantifica, em termos financeiros, o valor das áreas de floresta a partir de três dimensões complementares: ganho direto pela exploração, oportunidade perdida ao preservar e o investimento necessário para manter os serviços ambientais.
              </p>
              <p className="mt-4 text-lg text-muted-foreground">
                Ele transforma a floresta em um **ativo financeiro mensurável**, capaz de expressar tanto o lucro potencial da exploração quanto o retorno econômico da conservação.
              </p>
            </div>
          </div>
        </section>

        {/* PILLARS SECTION */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-4xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Os Três Pilares do PDM</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {pilaresPDM.map((pilar, index) => (
                <Card key={index} className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <pilar.icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg font-bold">{pilar.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <p className="text-sm text-muted-foreground">{pilar.description}</p>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Perspectiva Comercial</h4>
                      <p className="text-xs text-muted-foreground">{pilar.perspective}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Metodologia</h4>
                      <p className="text-xs text-muted-foreground">{pilar.methodology}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* APPLICATIONS SECTION */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-4xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Aplicações Práticas do PDM</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {aplicacoesPDM.map((app, index) => (
                <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <app.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-md font-semibold mb-2">{app.title}</h3>
                  <p className="text-sm text-muted-foreground">{app.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* UCS SECTION */}
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <Badge variant="secondary" className="mb-4">O Ativo Final</Badge>
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Unidade de Créditos de Sustentabilidade – UCS</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            As Unidades de Crédito de Sustentabilidade (UCS) são a materialização do valor gerado pelo PDM. Elas permitem que corporações contribuam com a proteção e restauração de biomas, alinhando-se às diretrizes do Acordo de Paris.
                        </p>
                        <p className="mt-4 text-muted-foreground">
                            Empresas com passivos de emissões podem comprar créditos UCS para compensar seu impacto, financiando diretamente projetos que mantêm estoques de carbono e reduzem emissões de GEE, equilibrando o nível de emissões na atmosfera.
                        </p>
                    </div>
                    <div className="relative h-64 md:h-full w-full rounded-xl overflow-hidden shadow-xl">
                        <Image
                            src="https://picsum.photos/seed/sustainability/800/600"
                            alt="Mãos segurando uma planta jovem"
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="sustainability hands"
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* BLOCKCHAIN SECTION */}
        <section className="py-16 md:py-24 bg-muted/30">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="relative h-64 md:h-full w-full rounded-xl overflow-hidden shadow-xl">
                         <Image
                            src="https://picsum.photos/seed/blockchain-tech/800/600"
                            alt="Visualização abstrata de uma rede blockchain"
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="blockchain technology"
                        />
                    </div>
                    <div>
                        <Badge variant="secondary" className="mb-4">Tecnologia e Segurança</Badge>
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Blockchain na Preservação do Meio Ambiente</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            O uso de blockchain na área da sustentabilidade revoluciona a forma como rastreamos e validamos o impacto ambiental. A tecnologia oferece um registro imutável e transparente de todas as transações.
                        </p>
                        <p className="mt-4 text-muted-foreground">
                            Por ser segura e rastreável, ela aumenta a confiança entre compradores e vendedores. A plataforma de UCS conta com a segurança do registro em Blockchain como um de seus principais diferenciais, garantindo a integridade e a origem de cada crédito de sustentabilidade.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* FINAL SUMMARY & CTA */}
        <section className="py-16 md:py-24 text-center">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Equilíbrio Econômico-Ambiental</h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
              O PDM quantifica o equilíbrio entre explorar e preservar. Com base em dados financeiros concretos, o modelo demonstra que a preservação também tem valor econômico, permitindo que tomadores de decisão comparem cenários e investidores identifiquem oportunidades na economia verde.
            </p>
            <div className="mt-8">
              <Award className="mx-auto h-12 w-12 text-primary" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
          <div className="flex flex-col items-center gap-2 text-center md:flex-row md:gap-4 md:text-left">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} UCS Index. {homeT.footer.rights}</p>
            <p className="text-sm text-muted-foreground">{homeT.footer.source} <a href="https://br.investing.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">investing.com.br</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
