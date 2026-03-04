
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, ShieldCheck, FileText, BarChart3, TrendingUp, Briefcase, Award, Blocks, TreePine, LandPlot, Globe, TrendingDown, ArrowUp, ChevronRight, Sparkles, Activity } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { LogoUCS } from "@/components/logo-bvm";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    // Para 3 anos de tendência, buscamos ~1100 dias
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
  const heroContent = settings ? settings[language] : { title: t.home.hero.title, subtitle: t.home.hero.subtitle };
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
      methodology: "Inspirado em referências internacionais de vanguarda, como o modelo TEEB (The Economics of Ecosystems and Biodiversity), quantificando externalidades positivas e capital natural intangível.",
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
        // Para visualização de 3 anos, formatamos apenas MM/yy para não poluir
        return { date: format(date, 'MM/yy'), value, timestamp: date.getTime() };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [ucsHistory]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen w-full flex-col login-bg-gradient font-sans">
      <header className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        isScrolled ? "bg-white/80 backdrop-blur-xl border-b border-slate-200 py-3" : "bg-transparent py-6"
      )}>
        <div className="container mx-auto flex items-center justify-between px-6">
          <Link href="/" className="transition-transform hover:scale-105">
            <LogoUCS variant={isScrolled ? 'default' : 'text'} className={isScrolled ? "" : "text-slate-900"} />
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button asChild className="rounded-full bg-[#10b981] hover:bg-[#059669] text-white shadow-lg shadow-emerald-200 border-none px-6">
              <Link href="/login" className="flex items-center gap-2">
                Acessar <User className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-24">
        {/* HERO SECTION */}
        <section className="container mx-auto px-6 mb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold border border-emerald-200">
                <Sparkles className="h-4 w-4" /> Ecoasset Estratégico
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                {heroContent.title}
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed text-justify">
                {heroContent.subtitle}
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button asChild size="lg" className="h-14 px-8 rounded-full bg-[#10b981] hover:bg-[#059669] text-white text-lg font-bold shadow-xl shadow-emerald-200">
                  <a href="https://bmvdigital.global/" target="_blank" rel="noopener noreferrer">
                    Começar Agora <ChevronRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-2 border-slate-200 bg-white/50 text-lg font-bold hover:bg-white transition-all">
                  Ver Metodologia
                </Button>
              </div>
            </div>

            <div className="relative animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
              <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-[0_48px_100px_-12px_rgba(0,0,0,0.2)] border-8 border-white">
                <Image
                  src="https://picsum.photos/seed/amazon/800/600"
                  alt="Amazon Rainforest"
                  fill
                  className="object-cover"
                  priority
                  data-ai-hint="amazon rainforest"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
              
              {/* Floating Quote Card */}
              {indexValues.length > 0 && targetDate && (
                <div className="absolute -bottom-8 -left-8 right-8 md:right-auto md:w-80 bg-white/95 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-bounce-subtle">
                  <Carousel opts={{ loop: true }} plugins={[autoplayPlugin]}>
                    <CarouselContent>
                      {indexValues.map((item, index) => (
                        <CarouselItem key={index}>
                          <div className="space-y-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Cotacão Atual UCS</p>
                            <div className="flex items-end justify-between gap-4">
                              <span className="text-4xl font-black text-slate-900 font-mono">
                                {formatCurrency(item.value, item.currency, item.currency)}
                              </span>
                              <div className={cn(
                                "flex items-center text-sm font-bold px-2 py-1 rounded-lg",
                                item.change >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                              )}>
                                {item.change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                                {item.change.toFixed(2)}%
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400">Ref: {format(targetDate, 'dd/MM/yyyy')}</p>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PILLARS SECTION - NOW ONE PER LINE */}
        <section className="container mx-auto px-6 py-24">
          <div className="space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-slate-900">Os Pilares do Sistema</h2>
            <p className="text-slate-500 text-lg">
              Nossa metodologia inovadora é baseada em três eixos fundamentais de valor ambiental e econômico, garantindo uma visão 360º do capital natural.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 items-stretch">
            {pilaresPDM.map((pilar, index) => (
              <Card key={index} className="group border-none bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2 flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className={cn("w-20 h-20 shrink-0 rounded-3xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm", pilar.color)}>
                  <pilar.icon className="h-10 w-10" />
                </div>
                <div className="flex-grow space-y-6">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{pilar.title}</CardTitle>
                    <p className="text-slate-600 text-lg leading-relaxed text-justify">{pilar.definition}</p>
                  </div>
                  <div className="pt-6 border-t border-slate-100">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Especificações da Metodologia</p>
                    <p className="text-sm text-slate-500 italic leading-relaxed text-justify">{pilar.methodology}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* GLOBAL DASHBOARD SECTION */}
        <section className="container mx-auto px-6 py-24">
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">A Evolução do Índice UCS</h2>
              <p className="text-lg text-slate-500 leading-relaxed text-justify">
                Acompanhe a performance histórica do Índice de Unidade de Crédito de Sustentabilidade. O gráfico abaixo ilustra a trajetória e a estabilidade do ativo ao longo do tempo, refletindo o valor crescente da conservação ambiental.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-stretch">
              {/* Official Quote Card (Dark) */}
              <div className="lg:col-span-1 relative overflow-hidden bg-[#0f172a] text-white rounded-[3rem] p-10 shadow-2xl flex flex-col justify-between h-full min-h-[450px]">
                {/* Background Watermark Icon */}
                <div className="absolute top-12 right-[-40px] opacity-[0.03] pointer-events-none transform rotate-12">
                  <TrendingUp size={320} />
                </div>

                <div className="relative z-10 space-y-10">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="inline-flex px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-widest text-[10px]">
                        UCS INDEX ASE
                      </div>
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Cotação Oficial</p>
                    </div>
                    {ucsAseAsset && (
                      <div className={cn(
                        "flex items-center text-sm font-bold px-3 py-1 rounded-full",
                        ucsAseAsset.change >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      )}>
                        {ucsAseAsset.change >= 0 ? <TrendingUp className="h-4 w-4 mr-1.5" /> : <TrendingDown className="h-4 w-4 mr-1.5" />}
                        {Math.abs(ucsAseAsset.change).toFixed(2)}%
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline gap-3">
                      <span className="text-7xl font-black font-mono tracking-tighter leading-none">
                        {ucsAseAsset ? ucsAseAsset.price.toFixed(2) : '176.66'}
                      </span>
                      <span className="text-2xl font-bold text-emerald-500">BRL</span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      Atualizado: {ucsAseAsset ? ucsAseAsset.lastUpdated : (targetDate ? format(targetDate, 'dd/MM/yyyy') : '--/--/----')}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 pt-10 border-t border-slate-800/50">
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Equiv. USD</p>
                      <p className="text-3xl font-black font-mono tracking-tight text-white">
                        {ucsAseAsset?.valor_usd ? ucsAseAsset.valor_usd.toFixed(2) : '33.72'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Equiv. EUR</p>
                      <p className="text-3xl font-black font-mono tracking-tight text-white">
                        {ucsAseAsset?.valor_eur ? ucsAseAsset.valor_eur.toFixed(2) : '28.50'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trend Chart Card (White) */}
              <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col h-full">
                <div className="flex items-start justify-between mb-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-emerald-600">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tendência UCS</h3>
                    </div>
                    <p className="text-slate-500 font-medium ml-11">Histórico de valorização (Últimos 3 anos)</p>
                  </div>
                </div>

                <div className="flex-1 min-h-[300px]">
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
        <section className="container mx-auto px-6 py-24 text-center">
          <div className="space-y-8 p-16 rounded-[3rem] bg-gradient-to-br from-[#10b981] to-[#059669] text-white shadow-2xl shadow-emerald-200">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">Pronto para transformar sua conservação em valor?</h2>
            <p className="text-xl text-emerald-50 opacity-90 mx-auto">
              Junte-se à maior plataforma de ativos ambientais e comece a rentabilizar a preservação hoje mesmo.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button asChild size="lg" className="h-14 px-10 rounded-full bg-white text-emerald-600 hover:bg-emerald-50 text-lg font-bold shadow-lg">
                <a href="https://bmvdigital.global/" target="_blank" rel="noopener noreferrer">
                  Começar agora
                </a>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-10 rounded-full border-2 border-white/30 bg-transparent text-white hover:bg-white/10 text-lg font-bold" asChild>
                <a href="mailto:contato@bmv.global">Falar com consultor</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <LogoUCS />
            <div className="flex flex-col items-center md:items-end gap-2 text-sm text-slate-400">
              <p>&copy; {new Date().getFullYear()} UCS Index. {homeT.footer.rights}</p>
              <p>{homeT.footer.source} <a href="https://br.investing.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">investing.com.br</a></p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Quote Button */}
      {ucsAseAsset && (
        <div className={cn(
          "fixed bottom-8 right-8 z-50 transition-all duration-500 transform",
          isScrolled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12 pointer-events-none"
        )}>
          <Button
            variant="default"
            className="h-16 px-6 rounded-full shadow-[0_20px_50px_rgba(16,185,129,0.3)] bg-[#10b981] hover:bg-[#059669] hover:scale-105 transition-all"
            onClick={scrollToTop}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-start leading-none text-left">
                <div className="flex flex-col items-start mr-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Índice UCS</span>
                  <span className="text-xl font-black font-mono">
                    {formatCurrency(ucsAseAsset.price, ucsAseAsset.currency, ucsAseAsset.id)}
                  </span>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div className={cn(
                  "flex items-center gap-1 font-bold ml-4",
                  ucsAseAsset.change >= 0 ? "text-emerald-200" : "text-red-200"
                )}>
                  {ucsAseAsset.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {ucsAseAsset.change.toFixed(2)}%
                </div>
              </div>
              <div className="p-2 bg-white/20 rounded-full">
                <ArrowUp className="h-4 w-4" />
              </div>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}
