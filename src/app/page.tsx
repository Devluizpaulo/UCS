'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ArrowUp, 
  TrendingUp, 
  TrendingDown, 
  TreePine, 
  LandPlot, 
  ShieldCheck, 
  Activity, 
  Calendar, 
  Droplets,
  Award
} from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { LogoUCS } from "@/components/logo-bvm";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getCommodityPrices, getCotacoesHistorico, getCommodityPricesByDate } from '@/lib/data-service';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';
import { getLandingPageSettings, type LandingPageSettings } from '@/lib/settings-actions';
import { HistoricalAnalysisChart } from '@/components/charts/historical-analysis-chart';
import { parse, isValid, format, subYears } from 'date-fns';

export default function PDMDetailsPage() {
  const [ucsAseAsset, setUcsAseAsset] = React.useState<CommodityPriceData | null>(null);
  const [ucsHistory, setUcsHistory] = React.useState<FirestoreQuote[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(true);
  const [settings, setSettings] = React.useState<LandingPageSettings | null>(null);
  const { language, t } = useLanguage();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [targetDate, setTargetDate] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setTargetDate(new Date());
  }, []);

  React.useEffect(() => {
    if (!targetDate) return;

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

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [targetDate]);

  const heroContent = settings ? settings[language] : { 
    title: "Gestão do Capital Natural", 
    subtitle: "Transformamos o ativo ambiental em valor econômico" 
  };

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

  const projects = [
    {
      title: "Bioeconomia Regional",
      image: "https://picsum.photos/seed/forest1/600/800",
      logo: "https://placehold.co/100x40/png?text=SEAGRO",
      active: true
    },
    {
      title: "Logística Verde",
      image: "https://picsum.photos/seed/forest2/600/800",
      logo: "https://placehold.co/100x40/png?text=PostALL"
    },
    {
      title: "Capacitação ESG",
      image: "https://picsum.photos/seed/forest3/600/800",
      logo: "https://placehold.co/100x40/png?text=SEBRAE"
    }
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#fcfdfc] font-sans overflow-x-hidden">
      {/* HEADER - Estilo Referência */}
      <header className={cn(
        "fixed top-0 z-[100] w-full transition-all duration-500 px-6",
        isScrolled ? "bg-[#051405]/90 backdrop-blur-xl border-b border-white/10 py-3 shadow-2xl" : "bg-transparent py-6"
      )}>
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="transition-all duration-300 hover:opacity-80 active:scale-95">
            <div className="text-2xl font-bold tracking-tighter text-white">bmv</div>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-10 text-[13px] font-medium text-white/80">
            <Link href="https://bmvdigital.global/" className="hover:text-white transition-colors">BMV Global</Link>
            <Link href="#sobre" className="hover:text-white transition-colors">Serviços</Link>
            <Link href="#pilares" className="hover:text-white transition-colors">Setores</Link>
            <button className="flex items-center gap-1 hover:text-white transition-colors">
              Projetos <ChevronDown className="h-3 w-3" />
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <Button asChild className="rounded-full bg-white text-black hover:bg-white/90 px-6 h-10 text-xs font-bold transition-all hover:scale-105">
              <Link href="https://bmvdigital.global/">Entenda a UCS</Link>
            </Button>
            <Button variant="outline" asChild className="rounded-full border-white/30 text-white hover:bg-white/10 px-6 h-10 text-xs font-bold hidden md:flex">
              <Link href="mailto:contato@bmv.global">Contato</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION - Dark Natural Immersive */}
        <section className="relative min-h-screen flex flex-col justify-center items-center pt-24 pb-20 overflow-hidden bg-[#051405]">
          {/* Background com imagem aérea e overlay escuro */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://picsum.photos/seed/aerialforest/1920/1080"
              alt="Aerial Forest View"
              fill
              className="object-cover opacity-40 grayscale-[0.2]"
              priority
              data-ai-hint="aerial forest"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#051405]/80 via-[#051405]/60 to-[#051405]" />
          </div>

          <div className="container mx-auto px-6 relative z-10 text-center mb-24">
            <div className="space-y-6 max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {heroContent.title}
              </h1>
              <p className="text-lg md:text-xl text-white/70 font-medium animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
                {heroContent.subtitle}
              </p>
            </div>
          </div>

          {/* Projetos/Carrossel na parte inferior do Hero */}
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-end justify-between gap-12">
              <div className="lg:w-1/3 mb-12 lg:mb-0">
                <p className="text-white/50 text-sm font-medium leading-relaxed italic mb-8 animate-in fade-in delay-500">
                  Veja como fizemos juntos com produtores, empresas e instituições financeiras
                </p>
                <div className="flex gap-3">
                  <button className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center text-white/60 hover:bg-white/10 transition-all active:scale-95">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center text-white/60 hover:bg-white/10 transition-all active:scale-95">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                {projects.map((project, idx) => (
                  <div 
                    key={idx} 
                    className="group relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-500 hover:-translate-y-2 cursor-pointer shadow-2xl"
                  >
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"
                      data-ai-hint="forest project"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                    
                    <div className="absolute top-6 right-6 p-2 bg-white/10 backdrop-blur-md rounded-lg">
                      <Image src={project.logo} alt="Logo" width={60} height={24} className="brightness-0 invert opacity-80" />
                    </div>

                    <div className="absolute bottom-8 left-8 right-8">
                      {project.active && (
                        <Button className="rounded-full bg-white text-black hover:bg-white h-10 px-6 font-bold text-xs mb-4 shadow-xl shadow-black/20">
                          Saiba mais
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* O QUE É A UCS SECTION */}
        <section id="sobre" className="container mx-auto px-6 py-24">
          <Card className="shadow-xl bg-white text-slate-900 border-none overflow-hidden rounded-[2.5rem] p-12 md:p-20 relative border border-slate-100">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-4 space-y-4">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] px-4 py-1 uppercase font-black tracking-widest mb-2">
                  🌱 ECOASSET ESTRATÉGICO
                </Badge>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">O que é a UCS?</h2>
              </div>
              <div className="lg:col-span-8 space-y-6">
                <p className="text-lg text-slate-600 leading-relaxed font-medium text-justify">
                  A Unidade de Créditos de Sustentabilidade (UCS) é um Ecoasset — a representação financeira do valor gerado pela conservação da floresta. Ela converte benefícios ambientais — como manutenção de estoques de carbono, proteção da água e biodiversidade — em um ativo econômico mensurável, transparente e auditável.
                </p>
                <p className="text-lg text-slate-600 leading-relaxed font-medium text-justify">
                  A UCS utiliza uma base metodológica que considera dimensões econômicas e socioambientais da floresta, permitindo que empresas e investidores apoiem a preservação com métricas claras de desempenho e impacto.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* PILLARS SECTION - One card per line as requested */}
        <section id="pilares" className="container mx-auto px-6 py-20 bg-slate-50/50 rounded-[4rem]">
          <div className="space-y-3 mb-16 px-6">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Os Pilares do Sistema</h2>
            <p className="text-slate-500 text-lg font-medium text-justify">
              Nossa metodologia inovadora é baseada em três eixos fundamentais de valor ambiental e econômico, garantindo uma visão 360º do capital natural.
            </p>
          </div>
          
          <div className="flex flex-col gap-10">
            {[
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
            ].map((pilar, index) => (
              <Card key={index} className="group border-none bg-white rounded-[2.5rem] p-10 shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_30px_80px_rgba(0,0,0,0.06)] transition-all duration-700 flex flex-col md:flex-row gap-10 items-center md:items-start border border-slate-50">
                <div className={cn("w-20 h-20 shrink-0 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 shadow-sm", pilar.color)}>
                  <pilar.icon className="h-10 w-8" />
                </div>
                <div className="flex-grow space-y-6">
                  <div className="space-y-4">
                    <CardTitle className="text-2xl font-black text-slate-900 tracking-tighter">{pilar.title}</CardTitle>
                    <p className="text-slate-600 text-base leading-relaxed text-justify">{pilar.definition}</p>
                  </div>
                  <div className="pt-6 border-t border-slate-100">
                    <p className="text-sm text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Metodologia Técnica
                    </p>
                    <p className="text-sm text-slate-500 italic leading-relaxed text-justify">{pilar.methodology}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* EVOLUTION SECTION */}
        <section id="evolucao" className="container mx-auto px-6 py-24">
          <div className="space-y-4 mb-16 px-6">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">A Evolução do Índice UCS</h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed text-justify">
              Acompanhe a performance histórica do Índice de Unidade de Crédito de Sustentabilidade. O gráfico abaixo ilustra a trajetória e a estabilidade do ativo ao longo do tempo, refletindo o valor crescente da conservação ambiental.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-4 relative overflow-hidden bg-[#0f172a] text-white rounded-[3rem] p-10 shadow-2xl flex flex-col justify-between h-full min-h-[400px]">
              <div className="absolute top-12 right-[-40px] opacity-[0.04] pointer-events-none transform rotate-12">
                <TrendingUp size={300} />
              </div>

              <div className="relative z-10 space-y-10">
                <div className="space-y-2">
                  <div className="inline-flex px-4 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black uppercase tracking-widest text-[9px]">
                    Oficial UCS INDEX ASE
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Cotação do Dia</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-baseline gap-4">
                    <span className="text-5xl lg:text-6xl font-black font-mono tracking-tighter leading-none">
                      {ucsAseAsset ? ucsAseAsset.price.toFixed(2) : '176.66'}
                    </span>
                    <span className="text-2xl font-bold text-emerald-500">BRL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                      Ref: {ucsAseAsset ? ucsAseAsset.lastUpdated : format(new Date(), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-10 border-t border-slate-800/50 mt-auto">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Equiv. USD</p>
                    <p className="text-2xl font-black font-mono tracking-tight text-white">
                      {ucsAseAsset?.valor_usd ? ucsAseAsset.valor_usd.toFixed(2) : '33.72'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Equiv. EUR</p>
                    <p className="text-2xl font-black font-mono tracking-tight text-white">
                      {ucsAseAsset?.valor_eur ? ucsAseAsset.valor_eur.toFixed(2) : '28.50'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50/30 rounded-full blur-3xl -z-10" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-emerald-600">
                    <div className="p-3 bg-emerald-50 rounded-xl shadow-inner">
                      <Activity className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Análise Histórica</h3>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-14">Série Temporal (Últimos 3 anos)</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="default" className="px-4 py-1.5 rounded-full bg-[#10b981] text-white border-none font-bold text-[10px]">Histórico Completo</Badge>
                </div>
              </div>

              <div className="flex-1 min-h-[350px]">
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
        </section>

        {/* CTA SECTION */}
        <section className="container mx-auto px-6 py-20 text-center">
          <div className="space-y-10 p-16 md:p-24 rounded-[4rem] bg-gradient-to-br from-[#10b981] to-[#059669] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -mr-48 -mt-48 transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/5 rounded-full -ml-32 -mb-32" />
            
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black leading-[1.1] relative z-10 tracking-tighter mx-auto">Pronto para rentabilizar sua conservação?</h2>
            <p className="text-lg md:text-xl text-emerald-50 opacity-90 mx-auto relative z-10 font-medium">
              Junte-se à maior plataforma de ativos ambientais e transforme sua floresta em um portfólio de alta performance.
            </p>
            <div className="flex flex-wrap justify-center gap-6 pt-6 relative z-10">
              <Button asChild size="lg" className="h-16 px-10 rounded-full bg-white text-emerald-600 hover:bg-emerald-50 text-lg font-black shadow-2xl transition-all hover:scale-105">
                <Link href="https://bmvdigital.global/">
                  Começar agora
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-16 px-10 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 text-lg font-black transition-all" asChild>
                <a href="mailto:contato@bmv.global">Falar com consultor</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="space-y-4 max-w-md">
              <div className="text-2xl font-bold tracking-tighter text-slate-900">bmv</div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Redefinindo o valor da natureza através de transparência financeira e inovação sustentável.
              </p>
            </div>
            
            <div className="flex flex-col md:items-end gap-4">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left md:text-right leading-loose">
                <p>&copy; {new Date().getFullYear()} UCS INDEX. TODOS OS DIREITOS RESERVADOS.</p>
                <p className="mt-1">
                  FONTE DOS DADOS: <a href="https://br.investing.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-500 transition-colors">INVESTING.COM.BR</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
