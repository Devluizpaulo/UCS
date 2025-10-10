
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { DollarSign, Euro, Leaf, User, ShieldCheck, Target, BarChart3, Scale, Microscope, FileText, Landmark, FileJson, CheckCircle, Search, GitBranch, Banknote, Building, Trees, Globe, ChevronRight } from "lucide-react";
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

const lastros = [
    { 
        icon: Globe, 
        title: "Lastro Monitoramento", 
        details: ["Acesso por imagem satélite em tempo real"] 
    },
    { 
        icon: Trees, 
        title: "Lastro Real", 
        details: ["Tangível pela vegetação nativa mantida"] 
    },
    { 
        icon: GitBranch, 
        title: "Lastro Tecnológico", 
        details: [
            "Registro Blockchain na aposentadoria/consumo das UCS",
            "Registro Blockchain na origem das UCS"
        ] 
    },
    { 
        icon: Banknote, 
        title: "Lastro Financeiro", 
        details: [
            "Identificação Internacional, código ISIN (International Securities Identification Number)",
            "Instrumento Financeiro regulado para cooperação no mercado de capitais",
            "Registro na bolsa brasileira (B3)"
        ] 
    },
    { 
        icon: ShieldCheck, 
        title: "Lastro Auditoria Independente", 
        details: [
            "Verificação por terceira parte independente com notoriedade internacional",
            "Validação por terceira parte independente com notoriedade internacional"
        ] 
    },
    { 
        icon: Microscope, 
        title: "Lastro Científico", 
        details: [
            "Diretrizes do IPCC (Intergovernmental Panel on Climate Change)",
            "Diretrizes das ISOs (International Organization for Standardization)"
        ] 
    },
    { 
        icon: BarChart3, 
        title: "Lastro Técnico", 
        details: [
            "Análise laboratorial internacional",
            "Análise laboratorial nacional",
            "Análise de campo (27 serviços ecossistêmicos)"
        ] 
    },
    { 
        icon: Scale, 
        title: "Lastro Jurídico", 
        details: [
            "Definição do produto",
            "Definição da atividade econômica",
            "Registro em cartório da propriedade",
            "Contrato de Parceria Rural e adesão"
        ] 
    },
    { 
        icon: FileText, 
        title: "Lastro Regulatório", 
        details: [
            "Internacional: Regulação União Europeia 2020/852",
            "Pactos globais: Acordo de Paris (artigo 5), Acordo de Montreal (Biodiversidade)",
            "Política Nacional de Mudanças Climáticas",
            "Constituição Brasileira, Direito de Propriedade, Direito Ambiental",
            "Código Florestal Brasileiro"
        ] 
    },
];

const stakeholders = [
    { icon: User, title: 'Produtores Rurais', description: 'São remunerados por manter e conservar áreas de floresta nativa em suas propriedades.' },
    { icon: Building, title: 'Investidores', description: 'Adquirem créditos que representam benefícios ambientais mensuráveis.' },
    { icon: Landmark, title: 'Instituições Financeiras', description: 'Participam de um mercado sustentável e regulamentado.' },
    { icon: Globe, title: 'Meio Ambiente', description: 'Ganha com a proteção efetiva de ecossistemas florestais.' },
];

const legalBasis = [
    { icon: FileText, title: 'CNAE 0220-9/06', description: 'Reconhece a atividade rural de conservação de floresta nativa.' },
    { icon: Landmark, title: 'Lei 13.986/2020', description: 'Estabelece que produtos rurais podem ser gerados por atividades de conservação.' },
    { icon: FileJson, title: 'Decreto 10.828/2021', description: 'Regulamenta a CPR Verde, integrando a conservação como ativo econômico.' },
]

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
        <section className="relative flex h-[80vh] min-h-[500px] flex-col items-center justify-center p-4 text-center">
           <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute z-0 w-full h-full object-cover"
          >
            {/* O vídeo do broto pode ser colocado na pasta /public/videos/sprout.mp4 */}
            <source src="/videos/sprout.mp4" type="video/mp4" />
            Seu navegador não suporta a tag de vídeo.
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />

          <div className="relative z-10 flex flex-col items-center gap-8 py-12">
            <div className="flex flex-col items-center gap-4 px-4 md:px-6">
                <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-white drop-shadow-lg animate-fade-in-down">
                    USC: O Crédito que Transforma Florestas Preservadas em Ativos Financeiros
                </h1>
                <p className="mx-auto max-w-3xl text-lg text-gray-200 md:text-xl drop-shadow-md animate-fade-in-up">
                    Uma inovação que reconhece economicamente a conservação ambiental e gera valor para produtores rurais, investidores e para o planeta.
                </p>
            </div>
            <div className="w-full flex justify-center animate-fade-in-up animation-delay-300">
                <Carousel
                    plugins={[autoplayPlugin.current]}
                    opts={{ align: "start", loop: true }}
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
        </section>

        {/* EXPLANATORY SECTION */}
        <section className="py-16 md:py-24 bg-muted/30">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="animate-fade-in-right">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">O que é o USC Crédito de Sustentabilidade?</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            O USC (Crédito de Sustentabilidade) é um produto financeiro inovador, lastreado na atividade rural de conservação de florestas nativas. Ele converte a preservação ambiental em um ativo econômico tangível e legalmente reconhecido.
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
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Por que o USC é um Investimento Seguro e Inovador?</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Nossa metodologia incorpora múltiplos pilares de lastro que garantem transparência, segurança e confiabilidade em cada crédito emitido.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {lastros.map((lastro, index) => (
                        <Card key={lastro.title} className="flex flex-col hover:shadow-lg transition-shadow animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
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
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Amparo Legal Sólido e Inovador</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            O USC Crédito de Sustentabilidade está ancorado em um marco regulatório robusto que lhe confere segurança e validade jurídica.
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
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Conservação que Gera Valor</h2>
                </div>
                <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 animate-fade-in-up animation-delay-200">
                  {[
                      'Transforma conservação ambiental em ativo financeiro', 
                      'Oferece transparência total através de múltiplos lastros', 
                      'Garante segurança jurídica e regulatória', 
                      'Gera retorno econômico sem comprometer o meio ambiente', 
                      'Conecta produtores, investidores e instituições em um ciclo virtuoso'
                    ].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-base text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-16 text-center animate-fade-in-up animation-delay-400">
                    <h3 className="text-2xl font-bold">Interessado em Saber Mais?</h3>
                    <p className="mt-2 text-muted-foreground">Junte-se à nova economia verde que valoriza a floresta em pé!</p>
                     <Button size="lg" className="mt-8 text-lg" asChild>
                        <a href="https://bmvdigital.global/" target="_blank" rel="noopener noreferrer">
                          Visite a BMV Digital <ChevronRight className="ml-2 h-5 w-5" />
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
        </div>
      </footer>
    </div>
  );
}
