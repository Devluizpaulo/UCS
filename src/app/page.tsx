
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { User, ShieldCheck, FileText, BarChart3, TrendingUp, Briefcase, Award, Blocks, TreePine, LandPlot, Globe, TrendingDown } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { LogoUCS } from "@/components/logo-bvm";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { formatCurrency } from "@/lib/formatters";
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import Autoplay from "embla-carousel-autoplay";
import { getCommodityPrices, getCotacoesHistorico } from '@/lib/data-service';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';
import { getLandingPageSettings, type LandingPageSettings } from '@/lib/settings-actions';
import { HistoricalAnalysisChart } from '@/components/charts/historical-analysis-chart';
import { format } from 'date-fns';

// Tipo local para incluir dados de conversão
type IndexValue = {
  currency: 'BRL' | 'USD' | 'EUR';
  value: number;
  change: number;
  conversionRate?: number;
};


export default function PDMDetailsPage() {
  const [ucsAseAsset, setUcsAseAsset] = React.useState<CommodityPriceData | null>(null);
  const [ucsHistory, setUcsHistory] = React.useState<FirestoreQuote[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(true);
  const [settings, setSettings] = React.useState<LandingPageSettings | null>(null);
  const { language, t } = useLanguage();
  
  React.useEffect(() => {
    getCommodityPrices().then(prices => {
        const ucsAsset = prices.find(p => p.id === 'ucs_ase');
        if (ucsAsset) {
            setUcsAseAsset(ucsAsset);
        }
    });
    getLandingPageSettings().then(setSettings);
    
    // Fetch historical data for the chart
    setIsLoadingHistory(true);
    const today = new Date();
    const startDate = new Date('2022-01-01');
    const days = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 30; // 30 dias de margem
    getCotacoesHistorico('ucs_ase', days) 
      .then(history => {
        setUcsHistory(history);
        setIsLoadingHistory(false);
      })
      .catch(error => {
        console.error("Failed to fetch UCS history:", error);
        setIsLoadingHistory(false);
      });
  }, []);
  
  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

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
  
  const heroContent = settings ? settings[language] : { title: t.home.hero.title, subtitle: t.home.hero.subtitle };

  const homeT = t.home;

  const pilaresPDM = [
    {
      icon: TreePine,
      title: homeT.pdm.pillars.vmad.title,
      definition: homeT.pdm.pillars.vmad.definition,
      methodology: homeT.pdm.pillars.vmad.methodology,
    },
    {
      icon: LandPlot,
      title: homeT.pdm.pillars.vus.title,
      definition: homeT.pdm.pillars.vus.definition,
      methodology: homeT.pdm.pillars.vus.methodology,
    },
    {
      icon: ShieldCheck,
      title: homeT.pdm.pillars.crs.title,
      definition: homeT.pdm.pillars.crs.definition,
      methodology: homeT.pdm.pillars.crs.methodology,
    }
  ];

  const aplicacoesPDM = [
    {
      icon: TrendingUp,
      title: homeT.pdm.applications.compensation,
      description: "Base para o cálculo de valores justos de compensação por supressão vegetal, com métricas padronizadas e embasamento econômico."
    },
    {
      icon: BarChart3,
      title: homeT.pdm.applications.carbon_credits,
      description: "Valoração precisa do sequestro de carbono, permitindo a criação de ativos negociáveis em mercados voluntários e regulados."
    },
    {
      icon: FileText,
      title: homeT.pdm.applications.licensing,
      description: "Suporte técnico-econômico em processos de licenciamento, auxiliando na definição de condicionantes e medidas compensatórias."
    },
    {
      icon: Briefcase,
      title: homeT.pdm.applications.asset_management,
      description: "Inclusão de ativos ambientais nos balanços patrimoniais de empresas e governos, com metodologia de valuation reconhecida."
    }
  ];
  
  const chartData = React.useMemo(() => {
    if (!ucsHistory || ucsHistory.length === 0) return [];
    
    return ucsHistory
      .map(quote => {
        const value = quote.valor_brl ?? quote.resultado_final_brl ?? quote.valor;
        if (typeof value !== 'number') return null;

        let date: Date | null = null;
        if (quote.data) {
          try {
            const [day, month, year] = quote.data.split('/');
            date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } catch { date = null; }
        }
        if (!date && quote.timestamp) {
            try {
                date = new Date(quote.timestamp as any);
            } catch { date = null; }
        }

        if (!date) return null;

        return {
          date: format(date, 'dd/MM/yy'),
          value,
          timestamp: date.getTime()
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [ucsHistory]);

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
        <section className="relative flex h-[90vh] min-h-[700px] w-full flex-col items-center justify-center overflow-hidden bg-black p-4">
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
              <h1 className="text-4xl font-extrabold tracking-tighter text-white sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-lg animate-fade-in-down">
                {heroContent.title}
              </h1>
              <p className="mx-auto max-w-3xl text-lg text-gray-200 md:text-xl drop-shadow-md animate-fade-in-up">
                {heroContent.subtitle}
              </p>
            </div>

            <div className="sticky top-20 z-40 w-full max-w-4xl p-4 animate-fade-in-up animation-delay-400">
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
                                {homeT.quote.conversionRate} {formatCurrency(item.conversionRate, 'BRL')}
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
            <div className="mx-auto max-w-5xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{homeT.pdm.what_is.title}</h2>
              <p className="mt-4 text-lg text-muted-foreground text-justify" dangerouslySetInnerHTML={{ __html: homeT.pdm.what_is.p1 }}></p>
              <p className="mt-4 text-lg text-muted-foreground text-justify" dangerouslySetInnerHTML={{ __html: homeT.pdm.what_is.p2 }}></p>
            </div>
          </div>
        </section>

        {/* PILLARS SECTION */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-5xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{homeT.pdm.pillars_title}</h2>
            </div>
            <div className="mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl">
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
                    <p className="text-sm text-muted-foreground text-justify">{pilar.definition}</p>
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-sm mb-2">{homeT.pdm.methodology}</h4>
                      <p className="text-xs text-muted-foreground text-justify">{pilar.methodology}</p>
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
            <div className="mx-auto max-w-5xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{homeT.pdm.applications_title}</h2>
            </div>
            <div className="mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl">
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

        {/* UCS EVOLUTION SECTION */}
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mx-auto max-w-5xl text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{homeT.ucs_section.title}</h2>
                    <p className="mt-4 text-lg text-muted-foreground">{homeT.ucs_section.description}</p>
                </div>
                <div className="mx-auto max-w-5xl h-96">
                    <HistoricalAnalysisChart 
                        isLoading={isLoadingHistory}
                        chartData={chartData}
                        isMultiLine={false}
                        mainAssetData={ucsAseAsset}
                        visibleAssets={{}}
                        lineColors={{}}
                        assetNames={{}}
                        showMetrics={false}
                    />
                </div>
            </div>
        </section>
        
        {/* UCS SECTION */}
        <section className="py-16 md:py-24 bg-muted/30">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mx-auto max-w-5xl grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{homeT.ucs.title}</h2>
                        <p className="mt-4 text-lg text-muted-foreground text-justify">
                            {homeT.ucs.p1}
                        </p>
                        <p className="mt-4 text-muted-foreground text-justify">
                            {homeT.ucs.p2}
                        </p>
                    </div>
                    <div className="relative h-64 md:h-full w-full rounded-xl overflow-hidden shadow-xl">
                        <Image
                            src="https://picsum.photos/seed/sustainability/800/600"
                            alt={homeT.ucs.image_alt}
                            fill
                            style={{objectFit: 'cover'}}
                            data-ai-hint="sustainability hands"
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* BLOCKCHAIN SECTION */}
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mx-auto max-w-5xl grid md:grid-cols-2 gap-12 items-center">
                    <div className="relative h-64 md:h-full w-full rounded-xl overflow-hidden shadow-xl md:order-last">
                         <Image
                            src="https://picsum.photos/seed/blockchain-tech/800/600"
                            alt={homeT.blockchain.image_alt}
                            fill
                            style={{objectFit: 'cover'}}
                            data-ai-hint="blockchain technology"
                        />
                    </div>
                    <div className="md:order-first">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{homeT.blockchain.title}</h2>
                        <p className="mt-4 text-lg text-muted-foreground text-justify">
                            {homeT.blockchain.p1}
                        </p>
                        <p className="mt-4 text-muted-foreground text-justify">
                            {homeT.blockchain.p2}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* FINAL SUMMARY */}
        <section className="py-16 md:py-24 text-center bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-5xl">
                <div className="text-center">
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{homeT.pdm.conclusion.title}</h2>
                  <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground text-justify">
                    {homeT.pdm.conclusion.p1}
                  </p>
                  <div className="mt-8">
                    <Award className="mx-auto h-12 w-12 text-primary" />
                  </div>
                </div>
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
