
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Briefcase, CheckCircle, Globe, HandCoins, Landmark, Leaf, Repeat, Scale, ShieldCheck, TrendingUp, User, Euro, DollarSign } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { LogoUCS } from "@/components/logo-bvm";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getCommodityPrices } from "@/lib/data-service";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { formatCurrency } from "@/lib/formatters";
import type { CommodityPriceData } from '@/lib/types';
import Autoplay from "embla-carousel-autoplay";

export default function LandingPage() {
  const [allPrices, setAllPrices] = React.useState<CommodityPriceData[]>([]);
  
  React.useEffect(() => {
    getCommodityPrices().then(setAllPrices);
  }, []);
  
  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  const ucsAseAsset = allPrices.find(p => p.id === 'ucs_ase');
  const usdAsset = allPrices.find(p => p.id === 'usd');
  const eurAsset = allPrices.find(p => p.id === 'eur');
  
  const ucsAseBRL = ucsAseAsset?.price || 0;
  const ucsAseUSD = (usdAsset?.price && ucsAseAsset?.price) ? ucsAseAsset.price / usdAsset.price : 0;
  const ucsAseEUR = (eurAsset?.price && ucsAseAsset?.price) ? ucsAseAsset.price / eurAsset.price : 0;

  const indexValues = [
    { currency: 'BRL', value: ucsAseBRL, icon: Leaf },
    { currency: 'USD', value: ucsAseUSD, icon: DollarSign, conversionRate: usdAsset?.price },
    { currency: 'EUR', value: ucsAseEUR, icon: Euro, conversionRate: eurAsset?.price },
  ]
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <LogoUCS />
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
        <section className="relative w-full h-[calc(100vh-4rem)] flex items-center justify-center text-center">
          <Image
            src="https://picsum.photos/seed/forest-path/1920/1080"
            alt="Floresta exuberante com caminho de luz"
            fill
            className="object-cover animate-zoom-in"
            data-ai-hint="lush forest light path"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 flex flex-col items-center gap-8 px-4 md:px-6">
            <div className="flex flex-col items-center gap-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-white">
                O Futuro do Capital Natural é Digital
                </h1>
                <p className="mx-auto max-w-[700px] text-lg text-gray-200 md:text-xl">
                Transformamos ativos ambientais em oportunidades de investimento seguras e transparentes.
                </p>
            </div>
            
            <Carousel
                plugins={[autoplayPlugin.current]}
                opts={{
                    align: "start",
                    loop: true,
                }}
                className="w-full max-w-xs sm:max-w-sm"
                onMouseEnter={autoplayPlugin.current.stop}
                onMouseLeave={autoplayPlugin.current.reset}
                >
                <CarouselContent>
                    {indexValues.map(({ currency, value, icon: Icon, conversionRate }) => (
                    <CarouselItem key={currency}>
                        <div className="p-1">
                        <Card className="rounded-xl border border-white/20 bg-white/10 p-6 text-white shadow-lg backdrop-blur-md">
                            <CardHeader className="p-0 text-center flex-row items-center justify-center gap-2">
                                <Icon className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg font-medium">Índice UCS ASE</CardTitle>
                            </CardHeader>
                             <CardContent className="p-0 mt-2 text-center">
                                <span className="text-5xl font-bold tracking-tight">
                                    {formatCurrency(value, currency, 'ucs_ase')}
                                </span>
                                <span className="ml-1 text-base font-medium text-gray-300">{currency}</span>
                                {conversionRate && (
                                    <p className="text-xs text-gray-400 mt-2">
                                        (1 {currency} = {formatCurrency(conversionRate, 'BRL', 'usd')})
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

             <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="outline" className="border-primary bg-transparent text-primary hover:bg-primary/10 hover:text-primary-foreground" asChild>
                <a href="https://bmvdigital.global/" target="_blank" rel="noopener noreferrer">
                  Conheça a BMV Digital
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
          <div className="flex flex-col items-center gap-2 text-center md:flex-row md:gap-4 md:text-left">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} UCS Index. Todos os direitos reservados.</p>
            <p className="text-sm text-muted-foreground">Fonte dos dados: <a href="https://br.investing.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">investing.com.br</a></p>
          </div>
          <div className="flex items-center gap-4">
              <a href="https://bmvdigital.global/" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                Site Institucional
              </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
