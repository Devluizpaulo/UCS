'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, ShieldCheck, TreePine, LandPlot, TrendingUp, TrendingDown, ChevronRight, Sparkles, Activity, Award, ArrowUp, Globe, Droplets, Zap, Calendar, CalendarClock } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { LogoUCS } from "@/components/logo-bvm";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { formatCurrency } from "@/lib/formatters";
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import Autoplay from "embla-carousel-autoplay";
import { getCommodityPrices, getCotacoesHistorico, getCommodityPricesByDate } from '@/lib/data-service';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';
import { getLandingPageSettings, type LandingPageSettings } from '@/lib/settings-actions';
import { HistoricalAnalysisChart } from '@/components/charts/historical-analysis-chart';
import { parse, isValid, format, subYears } from 'date-fns';

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
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [targetDate, setTargetDate] = React.useState<Date | null>(null);
  const [isBusinessDay, setIsBusinessDay] = React.useState<boolean>(true);

  // Initialize targetDate on mount to avoid hydration mismatch
  React.useEffect(() => {
    setTargetDate(new Date());
  }, []);

  React.useEffect(() => {
    if (!targetDate) return;

    const init = async () => {
      try {
        const statusRes = await fetch('/api/business-day-status');
        const statusJson = await statusRes.json();
        const today = new Date();
        if (statusJson?.isBusinessDay) {
          setIsBusinessDay(true);
          const prices = await getCommodityPrices();
          const ucsAsset = prices.find(p => p.id === 'ucs_ase');
          if (ucsAsset) setUcsAseAsset(ucsAsset);
        } else {
          setIsBusinessDay(false);
          const prevRes = await fetch(`/api/business-day/previous?date=${format(today, 'yyyy-MM-dd')}`);
          const prevJson = await prevRes.json();
          const prevDate = prevJson?.date ? parse(prevJson.date, 'yyyy-MM-dd', new Date()) : today;
          setTargetDate(prevDate);
          const prices = await getCommodityPricesByDate(prevDate);
          const ucsAsset = prices.find(p => p.id === 'ucs_ase');
          if (ucsAsset) setUcsAseAsset(ucsAsset);
        }
      } catch (e) {
        const prices = await getCommodityPrices();
        const ucsAsset = prices.find(p => p.id === 'ucs_ase');
        if (ucsAsset) setUcsAseAsset(ucsAsset);
      }
    };
    init();

    getLandingPageSettings().then(setSettings);

    setIsLoadingHistory(true);
    const daysToFetch = 1100;

    getCotacoesHistorico('ucs_ase', daysToFetch)
      .then(history => {
        setUcsHistory(history);
        setIsLoadingHistory(false);
      })
      .catch(error => {
        console.error("Failed to fetch UCS history:", error);
        setIsLoadingHistory(false);
      });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [targetDate]);

  const autoplayPlugin = React.useMemo(() => Autoplay({ delay: 4000, stopOnInteraction: true }), []);

  const getIndexValues = (): IndexValue[] => {
    if (!ucsAseAsset) return [];
    let indexValues: IndexValue[] = [];
    if (ucsAseAsset.price) {
      indexValues.push({ currency: 'BRL', value: ucsAseAsset.price, change: ucsAseAsset.change || 0 });
    }
    if (ucsAseAsset.valor_usd) {
      indexValues.push({ currency: 'USD', value: ucsAseAsset.valor_usd, change: ucsAseAsset.change || 0, conversionRate: ucsAseAsset.valores_originais?.cotacao_usd });
    }
    if (ucsAseAsset.valor_eur) {
      indexValues.push({ currency: 'EUR', value: ucsAseAsset.valor_eur, change: ucsAseAsset.change || 0, conversionRate: ucsAseAsset.valores_originais?.cotacao_eur });
    }
    return indexValues;
  };

  const indexValues = getIndexValues();
  const heroContent = settings ? settings[language] : { title: "Crédito que Transforma Florestas Preservadas em Ativos Financeiros", subtitle: "Um Ecoasset que reconhece economicamente a conservação ambiental e gera valor para produtores rurais, investidores e para o planeta." };
  const homeT = t.home;

  const pilaresPDM = [
    {
      icon: TreePine,
      title: "Valor Econômico da Floresta",
      color: "bg-emerald-50 text-emerald-600",
      definition: "Representa a capacidade da floresta de gerar riqueza de forma sustentável através do manejo florestal responsável. Este pilar considera a exploração criteriosa de madeira e outros produtos não-madeireiros, garantindo que o estoque de capital natural seja mantido para as futuras gerações enquanto gera retornos financeiros imediatos e de longo prazo para os proprietários de áreas preservadas. A floresta deixa de ser um custo e passa a ser um ativo produtivo de alto rendimento.",
      methodology: "Adota uma adaptação do método americano de valoração de ativos florestais, considerando análise de ciclo de oportunidades, custos operacionais de manejo e preços de mercado de espécies florestais certificadas.",
    },
    {
      icon: LandPlot,
      title: "Valor de Transformação Territorial",
      color: "bg-blue-50 text-blue-600",
      definition: "Avalia o potencial econômico latente da área caso fosse convertida para as atividades agropecuárias dominantes na região. Ao quantificar o custo de oportunidade de não desmatar, este pilar estabelece uma base financeira sólida para a compensação ambiental, demonstrando que manter a floresta em pé é uma decisão econômica racional e lucrativa frente às alternativas de uso do solo como agricultura ou pecuária intensiva. É a métrica do impacto evitado.",
      methodology: "Baseado no método americano adaptado para a valoração de terras, considerando produtividade potencial do solo, retorno esperado sobre investimento rural, custos de conversão técnica e logística regional.",
    },
    {
      icon: ShieldCheck,
      title: "Valor Socioambiental da Conservação",
      color: "bg-purple-50 text-purple-600",
      definition: "Traduz em termos monetários os serviços ecossistêmicos vitais prestados pela biodiversidade intacta. Inclui a regulação do microclima regional, o sequestro e estoque permanente de carbono, a proteção de nascentes e cursos d'água, e a preservação do patrimônio genético essencial para o futuro da biotecnologia. É a métrica que finalmente conecta os benefícios globais da natureza com a economia real, valorizando o que antes era invisível nos balanços corporativos.",
      methodology: "Inspirada em referências internacionais de vanguarda, como o modelo TEEB (The Economics of Ecosystems and Biodiversity), quantificando externalidades positivas e capital natural intangível.",
    }
  ];

  const chartData = React.useMemo(() => {
    if (!ucsHistory || ucsHistory.length === 0) return [];
    const threeYearsAgo = subYears(new Date(), 3);
    return ucsHistory
      .map(quote => {
        const value = quote.valor_brl ?? quote.resultado_final_brl ?? quote.valor;
        if (typeof value !== 'number') return null;
        let date: Date | null = null;
        if (quote.data) {
          try {
            if (typeof quote.data === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(quote.data)) {
              date = parse(quote.data, 'dd/MM/yyyy', new Date());
            } else if (quote.timestamp) {
              date = new Date(quote.timestamp as any);
            }
          } catch { date = null; }
        }
        if (!date && quote.timestamp) {
          try { date = new Date(quote.timestamp as any); } catch { date = null; }
        }
        if (!date || date < threeYearsAgo) return null;
        return { date: format(date, 'MM/yy'), value, timestamp: date.getTime() };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [ucsHistory]);

  return (
    <div className="flex min-h-screen w-full flex-col login-bg-gradient font-sans overflow-x-hidden">
      <header className={cn(
        "fixed top-0 z-[100] w-full transition-all duration-500",
        isScrolled ? "bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 py-3 shadow-sm" : "bg-transparent py-8"
      )}>
        <div className="container mx-auto flex items-center justify-between px-6">
          <Link href="/" className="transition-all duration-300 hover:opacity-80 active:scale-95">
            <LogoUCS variant={isScrolled ? 'default' : 'text'} className={cn(isScrolled ? "" : "text-slate-900 text-3xl")} />
          </Link>
          <div className="flex items-center gap-6">
            <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <Link href="#pilares" className="hover:text-emerald-600 transition-colors">Metodologia</Link>
              <Link href="#evolucao" className="hover:text-emerald-600 transition-colors">Evolução</Link>
              <Link href="/login" className="hover:text-emerald-600 transition-colors">Acesso</Link>
            </nav>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Button asChild className="rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white shadow-xl shadow-emerald-200/50 border-none px-8 h-11 font-bold">
                <Link href="/login" className="flex items-center gap-2">
                  Entrar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION - REDESIGNED FOR HIGH-END UX */}
        <section className="relative min-h-[90vh] flex items-center pt-20 pb-12 overflow-hidden">
          {/* Atmosfera de fundo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1400px] pointer-events-none -z-10">
            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-100/40 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
            {/* Conteúdo Esquerdo */}
            <div className="lg:col-span-7 space-y-10 z-20">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/80 backdrop-blur-md text-emerald-700 text-xs font-black uppercase tracking-widest border border-emerald-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Inovação BMV Standard
              </div>
              
              <div className="space-y-6">
                <h1 className="text-6xl md:text-7xl xl:text-8xl font-black tracking-tighter text-slate-900 leading-[0.95] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                  O Ativo Real que <span className="text-emerald-500">Valoriza</span> a Natureza.
                </h1>
                <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                  Transformamos hectares preservados em créditos financeiros de alta liquidez. A UCS é o primeiro Ecoasset que conecta o mercado real à conservação ambiental.
                </p>
              </div>

              <div className="flex flex-wrap gap-5 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-400">
                <Button asChild size="lg" className="h-16 px-10 rounded-[1.5rem] bg-[#10b981] hover:bg-[#059669] text-white text-lg font-black shadow-2xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95 group">
                  <a href="https://bmvdigital.global/" target="_blank" rel="noopener noreferrer">
                    Começar agora <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="h-16 px-10 rounded-[1.5rem] border-2 border-slate-200 bg-white/50 backdrop-blur-md text-lg font-bold hover:bg-white hover:border-emerald-500 transition-all">
                  Explorar Dashboards
                </Button>
              </div>

              {/* Trust badges */}
              <div className="pt-12 flex items-center gap-10 opacity-40 grayscale hover:grayscale-0 transition-all duration-500 animate-in fade-in delay-700">
                <Globe className="h-8 w-8" />
                <Award className="h-8 w-8" />
                <ShieldCheck className="h-8 w-8" />
                <Zap className="h-8 w-8" />
              </div>
            </div>

            {/* Visual Direito - Composição Premium */}
            <div className="lg:col-span-5 relative lg:h-[700px] flex items-center justify-center">
              <div className="relative w-full aspect-square md:aspect-[4/5] max-w-[500px]">
                {/* Imagem Principal */}
                <div className="absolute inset-0 rounded-[4rem] overflow-hidden shadow-[0_80px_150px_-20px_rgba(0,0,0,0.3)] border-[12px] border-white z-10 transition-transform duration-700 hover:scale-[1.02] hover:rotate-1">
                  <Image
                    src="https://picsum.photos/seed/amazon-lush/1000/1200"
                    alt="Lush Amazon Forest"
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint="amazon forest"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>

                {/* Card Flutuante 1: Cotação (Glassmorphism) */}
                <div className="absolute -bottom-10 -left-16 z-30 w-72 bg-white/80 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] border border-white/50 animate-float">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">UCS Index</span>
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    {ucsAseAsset && (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-slate-900 tracking-tighter">
                            {ucsAseAsset.price.toFixed(2)}
                          </span>
                          <span className="text-sm font-bold text-emerald-600">BRL</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className={cn(
                            "flex items-center text-[11px] font-black",
                            ucsAseAsset.change >= 0 ? "text-emerald-600" : "text-red-600"
                          )}>
                            {ucsAseAsset.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {Math.abs(ucsAseAsset.change).toFixed(2)}%
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">{format(targetDate || new Date(), 'dd/MM/yyyy')}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Flutuante 2: Métricas Rápidas */}
                <div className="absolute top-12 -right-12 z-30 bg-[#0f172a] text-white p-6 rounded-[2rem] shadow-2xl animate-float-delayed">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                      <Droplets className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Proteção Hídrica</p>
                      <p className="text-xl font-black">+4.2M L</p>
                    </div>
                  </div>
                </div>

                {/* Elementos Decorativos de Profundidade */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-[60px] -z-10" />
                <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-blue-400/10 rounded-full blur-[80px] -z-10" />
              </div>
            </div>
          </div>
        </section>

        {/* PILLARS SECTION */}
        <section id="pilares" className="container mx-auto px-6 py-32">
          <div className="space-y-4 mb-20">
            <h2 className="text-5xl font-black text-slate-900 tracking-tight">Os Pilares do Sistema</h2>
            <p className="text-slate-500 text-xl font-medium max-w-4xl">
              Nossa metodologia inovadora é baseada em três eixos fundamentais de valor ambiental e econômico, garantindo uma visão 360º do capital natural.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-10">
            {pilaresPDM.map((pilar, index) => (
              <Card key={index} className="group border-none bg-white rounded-[3.5rem] p-10 md:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.04)] hover:shadow-[0_40px_100px_rgba(0,0,0,0.08)] transition-all duration-700 hover:-translate-y-2 flex flex-col md:flex-row gap-12 items-center md:items-start overflow-hidden relative border border-slate-50">
                <div className="absolute top-0 right-0 w-96 h-96 bg-slate-50/50 rounded-full -mr-48 -mt-48 transition-transform duration-1000 group-hover:scale-150" />
                
                <div className={cn("w-28 h-28 shrink-0 rounded-[2.5rem] flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 shadow-lg relative z-10", pilar.color)}>
                  <pilar.icon className="h-14 w-12" />
                </div>
                <div className="flex-grow space-y-10 relative z-10">
                  <div className="space-y-6">
                    <CardTitle className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">{pilar.title}</CardTitle>
                    <p className="text-slate-600 text-lg md:text-xl leading-relaxed text-justify">{pilar.definition}</p>
                  </div>
                  <div className="pt-10 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Especificações Técnicas</p>
                    </div>
                    <p className="text-base md:text-lg text-slate-500 italic leading-relaxed text-justify">{pilar.methodology}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* GLOBAL DASHBOARD SECTION */}
        <section id="evolucao" className="container mx-auto px-6 py-32">
          <div className="space-y-12 mb-20">
            <div className="space-y-6">
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight">A Evolução do Índice UCS</h2>
              <p className="text-xl text-slate-500 font-medium leading-relaxed text-justify max-w-5xl">
                Acompanhe a performance histórica do Índice de Unidade de Crédito de Sustentabilidade. O gráfico abaixo ilustra a trajetória e a estabilidade do ativo ao longo do tempo, refletindo o valor crescente da conservação ambiental.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-stretch">
              {/* Official Quote Card (Dark) */}
              <div className="lg:col-span-4 relative overflow-hidden bg-[#0f172a] text-white rounded-[4rem] p-12 shadow-[0_50px_100px_-20px_rgba(15,23,42,0.3)] flex flex-col justify-between h-full min-h-[550px]">
                <div className="absolute top-12 right-[-40px] opacity-[0.04] pointer-events-none transform rotate-12">
                  <TrendingUp size={400} />
                </div>

                <div className="relative z-10 space-y-16">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4">
                      <div className="inline-flex px-5 py-2 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black uppercase tracking-widest text-[10px]">
                        Oficial UCS INDEX ASE
                      </div>
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] block">Cotação do Dia</p>
                    </div>
                    {ucsAseAsset && (
                      <div className={cn(
                        "flex items-center text-sm font-black px-5 py-2 rounded-2xl",
                        ucsAseAsset.change >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      )}>
                        {ucsAseAsset.change >= 0 ? <TrendingUp className="h-5 w-5 mr-2" /> : <TrendingDown className="h-5 w-5 mr-2" />}
                        {Math.abs(ucsAseAsset.change).toFixed(2)}%
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-baseline gap-5">
                      <span className="text-[100px] font-black font-mono tracking-tighter leading-none">
                        {ucsAseAsset ? ucsAseAsset.price.toFixed(2) : '176.66'}
                      </span>
                      <span className="text-4xl font-bold text-emerald-500">BRL</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest">
                        Ref: {ucsAseAsset ? ucsAseAsset.lastUpdated : (targetDate ? format(targetDate, 'dd/MM/yyyy') : '--/--/----')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-12 border-t border-slate-800/50 mt-auto">
                  <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Equiv. USD</p>
                      <p className="text-4xl font-black font-mono tracking-tight text-white">
                        {ucsAseAsset?.valor_usd ? ucsAseAsset.valor_usd.toFixed(2) : '33.72'}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Equiv. EUR</p>
                      <p className="text-4xl font-black font-mono tracking-tight text-white">
                        {ucsAseAsset?.valor_eur ? ucsAseAsset.valor_eur.toFixed(2) : '28.50'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trend Chart Card (White) */}
              <div className="lg:col-span-8 bg-white rounded-[4rem] p-12 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/30 rounded-full blur-3xl -z-10" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-5 text-emerald-600">
                      <div className="p-4 bg-emerald-50 rounded-2xl shadow-inner">
                        <Activity className="h-8 w-8" />
                      </div>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tight">Análise Histórica</h3>
                    </div>
                    <p className="text-slate-500 font-semibold ml-20 text-lg uppercase tracking-widest text-xs opacity-60">Série Temporal (Últimos 3 anos)</p>
                  </div>
                  <div className="flex gap-3">
                    <Badge variant="outline" className="px-4 py-2 rounded-xl bg-slate-50 text-slate-600 border-slate-200 font-bold">Semanal</Badge>
                    <Badge variant="default" className="px-4 py-2 rounded-xl bg-emerald-500 text-white border-none font-bold">Mensal</Badge>
                  </div>
                </div>

                <div className="flex-1 min-h-[400px]">
                  <HistoricalAnalysisChart
                    isLoading={isLoadingHistory}
                    chartData={chartData}
                    isMultiLine={false}
                    mainAssetData={ucsAseAsset}
                    visibleAssets={{}}
                    lineColors={{ ucs_ase: '#10b981' }}
                    assetNames={{}}
                    showMetrics={false}
                    hideControls={true}
                    defaultChartType="area"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="container mx-auto px-6 py-32 text-center">
          <div className="space-y-12 p-24 rounded-[5rem] bg-gradient-to-br from-[#10b981] to-[#059669] text-white shadow-[0_60px_120px_-20px_rgba(16,185,129,0.4)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full -mr-64 -mt-64 transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/5 rounded-full -ml-32 -mb-32" />
            
            <h2 className="text-6xl md:text-7xl font-black leading-[0.95] relative z-10 tracking-tighter max-w-4xl mx-auto">Pronto para rentabilizar sua conservação?</h2>
            <p className="text-2xl text-emerald-50 opacity-90 mx-auto max-w-2xl relative z-10 font-medium">
              Junte-se à maior plataforma de ativos ambientais e transforme sua floresta em um portfólio de alta performance.
            </p>
            <div className="flex flex-wrap justify-center gap-8 pt-8 relative z-10">
              <Button asChild size="lg" className="h-20 px-14 rounded-[2rem] bg-white text-emerald-600 hover:bg-emerald-50 text-2xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95">
                <a href="https://bmvdigital.global/" target="_blank" rel="noopener noreferrer">
                  Começar agora
                </a>
              </Button>
              <Button size="lg" variant="outline" className="h-20 px-14 rounded-[2rem] border-2 border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 text-2xl font-black transition-all" asChild>
                <a href="mailto:contato@bmv.global">Falar com consultor</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200/50 py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-16">
            <div className="space-y-6">
              <LogoUCS className="h-12 w-auto" />
              <p className="text-slate-400 font-medium max-w-sm">Redefinindo o valor da natureza através da tecnologia blockchain e transparência financeira.</p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-4 text-sm text-slate-400 font-bold uppercase tracking-[0.2em]">
              <p>&copy; {new Date().getFullYear()} UCS Index. {homeT.footer.rights}</p>
              <p>{homeT.footer.source} <a href="https://br.investing.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">investing.com.br</a></p>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(1deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(15px) rotate(-1deg); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
