'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  TrendingUp, 
  TreePine, 
  LandPlot, 
  ShieldCheck, 
  Activity, 
  Award,
  Zap,
  Mail,
  Globe,
  Lock,
} from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { LogoUCS } from "@/components/logo-bvm";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getCommodityPrices, getCotacoesHistorico } from '@/lib/data-service';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';
import { getLandingPageSettings, type LandingPageSettings } from '@/lib/settings-actions';
import { HistoricalAnalysisChart } from '@/components/charts/historical-analysis-chart';
import { parse, format, subYears } from 'date-fns';

export default function LandingPage() {
  const [ucsAseAsset, setUcsAseAsset] = React.useState<CommodityPriceData | null>(null);
  const [ucsHistory, setUcsHistory] = React.useState<FirestoreQuote[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(true);
  const [settings, setSettings] = React.useState<LandingPageSettings | null>(null);
  const { language, t } = useLanguage();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const init = async () => {
      try {
        const prices = await getCommodityPrices();
        const ucsAsset = prices.find(p => p.id === 'ucs_ase');
        if (ucsAsset) setUcsAseAsset(ucsAsset);
      } catch (e) {
        console.error("Failed to fetch prices:", e);
      }
    };
    init();

    getLandingPageSettings().then(setSettings);

    setIsLoadingHistory(true);
    getCotacoesHistorico('ucs_ase', 1100)
      .then(history => {
        setUcsHistory(history);
        setIsLoadingHistory(false);
      })
      .catch(error => {
        console.error("Failed to fetch UCS history:", error);
        setIsLoadingHistory(false);
      });

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heroContent = settings ? settings[language] : { 
    title: "Onde o Capital Natural ganha Inteligência Financeira", 
    subtitle: "A plataforma definitiva para monitoramento, análise e valorização de ativos ambientais baseados em commodities reais." 
  };

  const chartData = React.useMemo(() => {
    if (!ucsHistory || ucsHistory.length === 0) return [];
    const threeYearsAgo = subYears(new Date(), 3);
    return ucsHistory
      .map(quote => {
        const value = quote.valor_brl ?? quote.resultado_final_brl ?? quote.valor;
        if (typeof value !== 'number') return null;
        let date: Date | null = null;
        if (quote.data && typeof quote.data === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(quote.data)) {
          date = parse(quote.data, 'dd/MM/yyyy', new Date());
        }
        if (!date && quote.timestamp) date = new Date(quote.timestamp as any);
        if (!date || date < threeYearsAgo) return null;
        return { date: format(date, 'MM/yy'), value, timestamp: date.getTime() };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [ucsHistory]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#fcfdfc] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* HEADER - Minimalist Glass */}
      <header className={cn(
        "fixed top-0 z-[100] w-full transition-all duration-500 px-6",
        isScrolled ? "bg-white/80 backdrop-blur-xl border-b border-slate-200 py-3 shadow-sm" : "bg-transparent py-6"
      )}>
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-transform active:scale-95">
            <LogoUCS className={cn("h-8 w-auto", !isScrolled && "brightness-0 invert")} />
          </Link>
          
          <nav className={cn(
            "hidden lg:flex items-center gap-8 text-[13px] font-semibold tracking-wide",
            isScrolled ? "text-slate-600" : "text-white/70"
          )}>
            <Link href="#sobre" className="hover:text-emerald-600 transition-colors">Plataforma</Link>
            <Link href="#pilares" className="hover:text-emerald-600 transition-colors">Metodologia</Link>
            <Link href="#evolucao" className="hover:text-emerald-600 transition-colors">Performance</Link>
          </nav>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button asChild variant="outline" size="icon" className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 border-none shadow-lg shadow-emerald-200/50 transition-all hover:-translate-y-0.5">
              <Link href="/login" title="Acessar Plataforma">
                <Lock className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION - Digital Intelligence meet Nature */}
        <section className="relative min-h-[90vh] flex items-center pt-20 pb-20 overflow-hidden bg-[#020a02]">
          <div className="absolute inset-0 z-0">
            <Image
              src="https://picsum.photos/seed/forest-data/1920/1080"
              alt="Forest with Digital Overlay"
              fill
              className="object-cover opacity-30 grayscale-[0.4]"
              priority
              data-ai-hint="forest drone"
            />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#020a02]/90 via-transparent to-[#020a02]" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Side: Value Prop */}
              <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <Zap className="h-3 w-3 fill-current" /> Digital Intelligence
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
                  {heroContent.title}
                </h1>
                <p className="text-lg text-white/60 font-medium leading-relaxed">
                  {heroContent.subtitle}
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <Button asChild size="lg" className="rounded-full bg-white text-black hover:bg-emerald-50 px-10 h-14 text-sm font-bold transition-all hover:scale-105 shadow-xl shadow-black/40 border-none group">
                    <Link href="/login">
                      Começar agora 
                      <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" className="rounded-full border-2 border-white/40 bg-transparent text-white hover:bg-white hover:text-black px-10 h-14 text-sm font-bold transition-all hover:scale-105 backdrop-blur-sm" asChild>
                    <Link href="mailto:contato@bmv.global">
                      Falar com consultor
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right Side: Eco-Monitor */}
              <div className="relative animate-in fade-in zoom-in-95 duration-1000 delay-300">
                <div className="relative z-20 p-8 rounded-[3rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden group hover:border-emerald-500/30 transition-all duration-500 animate-float">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors" />
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Award className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Live Index</p>
                          <h3 className="text-white font-bold">UCS INDEX ASE</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> AO VIVO
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline gap-3">
                        <span className="text-5xl lg:text-6xl font-black text-white font-mono tracking-tighter">
                          {ucsAseAsset ? ucsAseAsset.price.toFixed(2) : '176.66'}
                        </span>
                        <span className="text-xl font-bold text-emerald-500">BRL</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400/80 font-bold text-sm">
                        <TrendingUp className="h-4 w-4" /> +2.34% <span className="text-white/20 ml-1">vs ontem</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* O QUE É A UCS SECTION */}
        <section id="sobre" className="container mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-5 space-y-6">
              <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] px-4 py-1 uppercase font-black tracking-[0.2em]">
                Definição Estratégica
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                O que é a UCS
              </h2>
              <div className="w-20 h-1.5 bg-emerald-500 rounded-full" />
            </div>
            <div className="lg:col-span-7 space-y-8 text-justify">
              <p className="text-lg text-slate-600 leading-relaxed font-medium">
                A Unidade de Créditos de Sustentabilidade (UCS) é um <strong>Ecoasset</strong> — a representação financeira do valor gerado pela conservação da floresta. Ela converte benefícios ambientais — como manutenção de estoques de carbono, proteção da água e biodiversidade — em um ativo econômico mensurável, transparente e auditável.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed font-medium">
                A UCS utiliza uma base metodológica que considera dimensões econômicas e socioambientais da floresta, permitindo que empresas e investidores apoiem a preservação com métricas claras de desempenho e impacto.
              </p>
            </div>
          </div>
        </section>

        {/* PILLARS SECTION */}
        <section id="pilares" className="bg-slate-50 py-24">
          <div className="container mx-auto px-6 space-y-16">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">Os Pilares do Sistema</h2>
              <p className="text-slate-500 font-medium">Metodologia proprietária baseada em três eixos estratégicos de valorização.</p>
            </div>
            
            <div className="flex flex-col gap-8">
              {[
                {
                  icon: TreePine,
                  title: "Valor Econômico da Floresta (VMAD)",
                  tag: "VMAD",
                  color: "emerald",
                  desc: "Mede o potencial econômico direto da floresta a partir da exploração sustentável de seus recursos, principalmente madeireiros. O cálculo considera o preço comercial das espécies exploradas sob manejo de baixo impacto, ciclos de corte controlados e custos operacionais, refletindo o uso responsável da floresta como ativo produtivo.",
                  method: "Adaptação do método americano de valoração de ativos florestais, considerando análise de ciclo de oportunidades e preços de mercado certificados."
                },
                {
                  icon: LandPlot,
                  title: "Valor de Transformação Territorial (VUS)",
                  tag: "VUS",
                  color: "blue",
                  desc: "Estima o valor que a terra teria caso a cobertura florestal fosse convertida para outros usos produtivos — como agricultura, pecuária, indústria ou expansão urbana. Esse pilar reflete o valor alternativo da área, ou seja, o potencial econômico de substituição da floresta por outra atividade.",
                  method: "Adota uma adaptação do método americano de valoração de terras, considerando produtividade potencial, retorno esperado, custos de conversão e operação."
                },
                {
                  icon: ShieldCheck,
                  title: "Valor Socioambiental da Conservação (CRS)",
                  tag: "CRS",
                  color: "purple",
                  desc: "Traduz o valor dos benefícios que a floresta em pé gera para a sociedade, como regulação do clima, sequestro de carbono, purificação da água, proteção do solo e manutenção da biodiversidade. Representa o investimento necessário para manter esses serviços ecossistêmicos essenciais.",
                  method: "Inspirada no modelo TEEB (The Economics of Ecosystems and Biodiversity), combina a quantificação de serviços com custos de conservação."
                }
              ].map((pilar, idx) => (
                <Card key={idx} className="group border-none bg-white rounded-[3rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-700 border border-slate-100">
                  <div className={cn(
                    "flex flex-col md:flex-row items-stretch",
                    idx % 2 !== 0 && "md:flex-row-reverse"
                  )}>
                    <div className={cn(
                      "md:w-1/3 p-12 flex flex-col justify-center items-center text-center gap-4",
                      pilar.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                      pilar.color === 'blue' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                    )}>
                      <div className="p-6 rounded-3xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-500">
                        <pilar.icon className="h-12 w-12" />
                      </div>
                      <Badge variant="outline" className="border-current font-black px-4">{pilar.tag}</Badge>
                      <h3 className="text-xl font-black leading-tight">{pilar.title}</h3>
                    </div>
                    <div className="md:w-2/3 p-12 lg:p-16 space-y-6 flex flex-col justify-center">
                      <p className="text-lg text-slate-600 leading-relaxed font-medium text-justify">{pilar.desc}</p>
                      <div className="pt-6 border-t border-slate-100">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Metodologia Técnica</span>
                        <p className="text-sm text-slate-500 italic text-justify">{pilar.method}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* EVOLUTION SECTION */}
        <section id="evolucao" className="container mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4 space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Performance e Estabilidade</h2>
                <p className="text-lg text-slate-500 font-medium leading-relaxed text-justify">
                  Acompanhe a performance histórica do Índice UCS. O gráfico ao lado ilustra a trajetória e a resiliência do ativo, refletindo o valor crescente do capital natural monitorado em tempo real.
                </p>
              </div>
              
              <div className="p-10 rounded-[2.5rem] bg-slate-900 text-white space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
                  <TrendingUp size={240} />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Última Cotação</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black font-mono tracking-tighter">
                      {ucsAseAsset ? ucsAseAsset.price.toFixed(2) : '176.66'}
                    </span>
                    <span className="text-sm font-bold text-emerald-500">BRL</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10 relative z-10">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Variação 12M</p>
                    <p className="text-2xl font-bold text-emerald-400">+14.2%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Confiança</p>
                    <p className="text-2xl font-bold text-blue-400">99.8%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 min-h-[500px]">
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
        </section>

        {/* CTA SECTION */}
        <section className="container mx-auto px-6 py-20">
          <div className="p-16 md:p-24 rounded-[4rem] bg-gradient-to-br from-emerald-600 to-green-900 text-white shadow-2xl relative overflow-hidden text-center space-y-10">
            <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-white/10 rounded-full -mr-48 -mt-48 blur-[100px]" />
            <h2 className="text-4xl md:text-5xl font-black tracking-tight max-w-3xl mx-auto leading-tight">
              Pronto para transformar preservação em rentabilidade?
            </h2>
            <p className="text-xl text-emerald-50/80 max-w-2xl mx-auto font-medium">
              Junte-se à maior rede de ativos ambientais da América Latina e valorize seu capital natural com transparência e tecnologia.
            </p>
            <div className="flex flex-wrap justify-center gap-6 pt-4">
              <Button asChild size="lg" className="h-16 px-12 rounded-full bg-white text-black hover:bg-emerald-50 text-base font-bold transition-all hover:scale-105 shadow-2xl shadow-black/20 border-none group">
                <Link href="/login">
                  Começar agora
                  <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-16 px-12 rounded-full border-2 border-white/40 bg-transparent text-white hover:bg-white hover:text-black text-base font-bold transition-all hover:scale-105 backdrop-blur-sm" asChild>
                <Link href="mailto:contato@bmv.global">Falar com consultor</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-16">
            <div className="space-y-8 max-w-md">
              <LogoUCS className="h-10 w-auto" />
              <p className="text-slate-500 text-base leading-relaxed font-medium">
                Redefinindo o valor da natureza através da tecnologia, transparência financeira e inovação socioambiental para um futuro sustentável.
              </p>
              <div className="flex gap-4">
                <Link href="#" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"><Globe size={20}/></Link>
                <Link href="#" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"><Mail size={20}/></Link>
              </div>
            </div>
            
            <div className="flex flex-col md:items-end gap-8">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 space-y-3 md:text-right">
                <p>&copy; {new Date().getFullYear()} UCS INDEX. TODOS OS DIREITOS RESERVADOS.</p>
                <p className="text-slate-300">BMV - SUSTAINABLE BUSINESS SOLUTIONS</p>
                <div className="pt-8 border-t border-slate-100">
                  FONTE DOS DADOS: <a href="https://br.investing.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-500 transition-colors font-black">INVESTING.COM.BR</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
