
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { DollarSign, Euro, Leaf, User, ShieldCheck, Target, BarChart3, Scale, Microscope, FileText, Landmark, FileJson, CheckCircle, Search, GitBranch, Banknote, Building, Trees, Globe, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
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

export default function LandingPage() {
  const [allPrices, setAllPrices] = React.useState<CommodityPriceData[]>([]);
  const { t } = useLanguage();
  
  React.useEffect(() => {
    getCommodityPrices().then(setAllPrices);
  }, []);
  
  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  const ucsAseAsset = allPrices.find(p => p.id === 'ucs_ase');
  const usdAsset = allPrices.find(p => p.id === 'usd');
  const eurAsset = allPrices.find(p => p.id === 'eur');
  
  const getIndexValues = () => {
    if (!ucsAseAsset) return [];

    const ucsAseBRL = ucsAseAsset.price || 0;
    const changeBRL = ucsAseAsset.change || 0;
    
    let indexValues = [{ 
      currency: 'BRL', 
      value: ucsAseBRL, 
      change: changeBRL, 
    }];

    if (usdAsset?.price) {
      const ucsAseUSD = ucsAseBRL / usdAsset.price;
      const prevUcsAseBRL = ucsAseBRL - ucsAseAsset.absoluteChange;
      const prevUsdPrice = usdAsset.price - usdAsset.absoluteChange;
      const prevUcsAseUSD = prevUsdPrice > 0 ? prevUcsAseBRL / prevUsdPrice : 0;
      const changeUSD = prevUcsAseUSD > 0 ? ((ucsAseUSD - prevUcsAseUSD) / prevUcsAseUSD) * 100 : 0;
      
      indexValues.push({ 
        currency: 'USD', 
        value: ucsAseUSD, 
        change: changeUSD, 
        conversionRate: usdAsset?.price 
      });
    }
    
    if (eurAsset?.price) {
      const ucsAseEUR = ucsAseBRL / eurAsset.price;
      const prevUcsAseBRL = ucsAseBRL - ucsAseAsset.absoluteChange;
      const prevEurPrice = eurAsset.price - eurAsset.absoluteChange;
      const prevUcsAseEUR = prevEurPrice > 0 ? prevUcsAseBRL / prevEurPrice : 0;
      const changeEUR = prevUcsAseEUR > 0 ? ((ucsAseEUR - prevUcsAseEUR) / prevUcsAseEUR) * 100 : 0;

      indexValues.push({ 
        currency: 'EUR', 
        value: ucsAseEUR, 
        change: changeEUR,
        conversionRate: eurAsset?.price 
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

  const lastros = [
      { key: 'monitoring', icon: Globe, title: homeT.pillars.monitoring.title, details: homeT.pillars.monitoring.details },
      { key: 'real', icon: Trees, title: homeT.pillars.real.title, details: homeT.pillars.real.details },
      { key: 'technological', icon: GitBranch, title: homeT.pillars.technological.title, details: homeT.pillars.technological.details },
      { key: 'financial', icon: Banknote, title: homeT.pillars.financial.title, details: homeT.pillars.financial.details },
      { key: 'audit', icon: ShieldCheck, title: homeT.pillars.audit.title, details: homeT.pillars.audit.details },
      { key: 'scientific', icon: Microscope, title: homeT.pillars.scientific.title, details: homeT.pillars.scientific.details },
      { key: 'technical', icon: BarChart3, title: homeT.pillars.technical.title, details: homeT.pillars.technical.details },
      { key: 'legal', icon: Scale, title: homeT.pillars.legal.title, details: homeT.pillars.legal.details },
      { key: 'regulatory', icon: FileText, title: homeT.pillars.regulatory.title, details: homeT.pillars.regulatory.details },
  ];

  const legalBasis = [
      { icon: FileText, title: "CNAE 0220-9/06", description: homeT.legal.cnae },
      { icon: Landmark, title: "Lei 13.986/2020", description: homeT.legal.law },
      { icon: FileJson, title: "Decreto 10.828/2021", description: homeT.legal.decree },
  ]
  
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
          {/* Fundo com Vídeo e Blur */}
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
          
          {/* Conteúdo Principal: Título e Cotação */}
          <div className="relative z-10 flex h-full w-full max-w-6xl flex-col items-center justify-center gap-8 text-center">
            
            {/* Título e Subtítulo */}
            <div className="flex flex-col items-center gap-4 px-4 md:px-6">
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-white drop-shadow-lg animate-fade-in-down">
                {homeT.hero.title}
              </h1>
              <p className="mx-auto max-w-3xl text-lg text-gray-200 md:text-xl drop-shadow-md animate-fade-in-up">
                {homeT.hero.subtitle}
              </p>
            </div>

            {/* Painel de Cotação */}
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
                                {formatCurrency(item.value, item.currency, item.currency.toLowerCase())}
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
                  <div className="mt-6 text-center">
                    <Button asChild size="lg" className="bg-primary/90 hover:bg-primary text-lg">
                        <Link href="/index-details">
                          {homeT.hero.cta}
                          <ChevronRight className="ml-2 h-4 w-4"/>
                        </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* EXPLANATORY SECTION */}
        <section className="py-16 md:py-24 bg-muted/30">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="animate-fade-in-right">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{homeT.whatIs.title}</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            {homeT.whatIs.description}
                        </p>
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {stakeholders.map((stakeholder) => (
                                <div key={stakeholder.title} className="flex gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                                        <stakeholder.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold">{stakeholder.title}</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">{stakeholder.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative h-64 md:h-full w-full rounded-xl overflow-hidden shadow-xl animate-fade-in-left">
                        <Image
                            src="https://picsum.photos/seed/river-forest/800/600"
                            alt="Rio serpenteando por uma floresta densa"
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="river forest"
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* DIFFERENTIALS SECTION */}
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                 <div className="mx-auto max-w-4xl text-center mb-12 animate-fade-in-up">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{homeT.pillars.title}</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        {homeT.pillars.subtitle}
                    </p>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {lastros.map((lastro, index) => (
                        <Card key={lastro.key} className="flex flex-col hover:shadow-lg transition-shadow animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <lastro.icon className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-lg font-bold">{lastro.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    {lastro.details.map((detail, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                                            <span>{detail}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* LEGAL BASIS SECTION */}
        <section className="py-16 md:py-24 bg-muted/30">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="relative h-64 md:h-full w-full rounded-xl overflow-hidden shadow-xl animate-fade-in-right">
                         <Image
                            src="https://picsum.photos/seed/forest-waterfall/800/600"
                            alt="Cachoeira em meio a uma floresta verde"
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="forest waterfall"
                        />
                    </div>
                    <div className="animate-fade-in-left">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{homeT.legal.title}</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            {homeT.legal.subtitle}
                        </p>
                        <div className="mt-8 space-y-6">
                            {legalBasis.map((item) => (
                                <div key={item.title} className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold">{item.title}</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* FINAL SUMMARY & CTA */}
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mx-auto max-w-4xl text-center animate-fade-in-up">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{homeT.summary.title}</h2>
                </div>
                <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 animate-fade-in-up animation-delay-200">
                  {homeT.summary.points.map((item: string) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-base text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-16 text-center animate-fade-in-up animation-delay-400">
                    <h3 className="text-2xl font-bold">{homeT.cta.title}</h3>
                    <p className="mt-2 text-muted-foreground">{homeT.cta.subtitle}</p>
                     <Button size="lg" className="mt-8 text-lg" asChild>
                        <a href="https://bmvdigital.global/" target="_blank" rel="noopener noreferrer">
                          {homeT.cta.button} <ChevronRight className="ml-2 h-5 w-5" />
                        </a>
                      </Button>
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
