
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { DollarSign, Euro, Leaf, User, ShieldCheck, Target, BarChart3, Scale, Microscope, FileText, Landmark, FileJson, CheckCircle, Search, GitBranch, Banknote } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { LogoUCS } from "@/components/logo-bvm";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { formatCurrency } from "@/lib/formatters";
import type { CommodityPriceData } from '@/lib/types';
import Autoplay from "embla-carousel-autoplay";
import { getCommodityPrices } from '@/lib/data-service';

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
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-background text-foreground">
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
        <section className="relative flex flex-1 flex-col p-4 text-center">
          <Image
            src="https://picsum.photos/seed/lush-forest/1920/1080"
            alt="Floresta exuberante ao fundo"
            fill
            className="object-cover animate-zoom-in"
            data-ai-hint="lush forest"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-4 px-4 md:px-6">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-white">
                O Futuro do Capital Natural é Digital
                </h1>
                <p className="mx-auto max-w-[700px] text-lg text-gray-200 md:text-xl text-justify sm:text-center">
                Transformamos ativos ambientais em oportunidades de investimento seguras e transparentes.
                </p>
            </div>
            <div className="w-full flex justify-center">
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
                          <Card className="rounded-xl border border-white/20 bg-white/10 p-4 text-white shadow-lg backdrop-blur-md">
                              <CardHeader className="p-0 text-center flex-row items-center justify-center gap-2">
                                  <Icon className="h-5 w-5 text-primary" />
                                  <CardTitle className="text-base font-medium">Índice UCS</CardTitle>
                              </CardHeader>
                              <CardContent className="p-0 mt-2 text-center">
                                  <span className="text-4xl font-bold tracking-tight">
                                      {formatCurrency(value, currency, 'ucs_ase')}
                                  </span>
                                  <span className="ml-1 text-base font-medium text-gray-300">{currency}</span>
                                  {conversionRate && (
                                      <p className="text-xs text-gray-400 mt-1">
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
            </div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center justify-end px-4 py-4 md:px-6">
             <Button size="lg" variant="outline" className="border-primary bg-transparent text-primary hover:bg-primary/10 hover:text-primary-foreground" asChild>
                <a href="https://bmvdigital.global/" target="_blank" rel="noopener noreferrer">
                  Conheça a BMV Digital
                </a>
              </Button>
          </div>
        </section>

        {/* Explanatory Section */}
        <section className="py-12 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Entenda o Crédito de Sustentabilidade (UCS)</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                O Crédito de Sustentabilidade é um produto originado da atividade rural de conservação de florestas nativas, fundamentado no BMV Standard. Ele transforma a preservação ambiental em valor econômico reconhecido legalmente, abrindo espaço para investidores, produtores rurais e instituições financeiras apoiarem a proteção das florestas.
              </p>
            </div>

            <div className="mt-12 space-y-12">
              {/* Base Legal */}
              <div>
                <h3 className="text-2xl font-semibold text-center mb-6">Base Legal Sólida</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5 text-primary" />Lei 13.986/2020</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Reconhece que produtos rurais também podem ser gerados por atividades de conservação de florestas nativas.
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base"><FileJson className="h-5 w-5 text-primary" />Decreto 10.828/2021</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Regulamenta a CPR Verde, integrando a conservação como ativo econômico negociável e seguro.
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base"><Landmark className="h-5 w-5 text-primary" />CNAE 0220-9/06</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Classifica oficialmente a "atividade rural de conservação de floresta nativa" como uma atividade econômica.
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Indicadores e Métricas */}
              <div>
                <h3 className="text-2xl font-semibold text-center mb-6">Indicadores e Métricas Avançadas</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                  {[
                    { icon: Search, title: "Lastro Monitoramento", description: "Acesso por imagens de satélite em tempo real." },
                    { icon: Target, title: "Lastro Real", description: "Vinculação direta à área de floresta preservada." },
                    { icon: GitBranch, title: "Lastro Tecnológico", description: "Sistemas digitais de controle e rastreabilidade." },
                    { icon: Banknote, title: "Lastro Financeiro", description: "Integração com mecanismos de mercado e garantias." },
                    { icon: ShieldCheck, title: "Lastro Auditoria", description: "Certificação por órgãos externos independentes." },
                    { icon: Microscope, title: "Lastro Científico", description: "Metodologia validada por instituições de pesquisa." },
                    { icon: BarChart3, title: "Lastro Técnico", description: "Relatórios e métricas ambientais verificáveis." },
                    { icon: Scale, title: "Lastro Jurídico", description: "Conformidade legal e contratual assegurada." },
                    { icon: FileText, title: "Lastro Regulatório", description: "Aderência às normas e decretos vigentes." },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                      <div className="flex-shrink-0 text-primary mt-1">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-16">
              <Alert className="max-w-3xl mx-auto bg-primary/5 border-primary/20">
                <CheckCircle className="h-5 w-5 text-primary" />
                <AlertTitle className="font-bold text-primary">Em Resumo</AlertTitle>
                <AlertDescription className="text-primary/90">
                  O Crédito de Sustentabilidade transforma a conservação de florestas em um ativo financeiro transparente, auditável e seguro, que gera valor econômico sem comprometer o equilíbrio ambiental.
                </AlertDescription>
              </Alert>
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
        </div>
      </footer>
    </div>
  );
}
