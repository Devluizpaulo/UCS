import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, CheckCircle, Globe, HandCoins, Landmark, Leaf, Repeat, Scale, ShieldCheck, TrendingUp, User, Euro, DollarSign } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { LogoBVM } from "@/components/logo-bvm";
import { LoginModal } from "@/components/login-modal";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getCommodityPrices } from "@/lib/data-service";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { formatCurrency } from "@/lib/formatters";

const services = [
  {
    title: 'Plataforma de Registro',
    description: 'Registro e gestão de UCS de forma segura e transparente.',
    icon: Landmark,
    aiHint: 'digital security',
  },
  {
    title: 'Custódia da UCS',
    description: 'A BMV DIGITAL mantém a informação de registro da UCS e do valor armazenado em um sistema padronizado.',
    icon: Briefcase,
    aiHint: 'financial data',
  },
  {
    title: 'Oferta de UCS',
    description: 'A BMV DIGITAL oferta as UCS no mercado por vendedor padrão ou credenciado, garantindo a rastreabilidade da operação.',
    icon: HandCoins,
    aiHint: 'global market',
  },
  {
    title: 'Liquidação da UCS',
    description: 'A BMV DIGITAL dará baixa no seu sistema na quantidade vendida e fará a transferência para o comprador.',
    icon: Repeat,
    aiHint: 'secure transaction',
  },
  {
    title: 'Certificação pelo uso das UCSs',
    description: 'A BMV DIGITAL verifica, valida e baixa no sistema a quantidade vendida, transfere as UCS para o comprador com emissão do Selo Sustentabilidade.',
    icon: CheckCircle,
    aiHint: 'sustainability certificate',
  },
   {
    title: 'Análise de Ativos',
    description: 'Plataforma completa para análise de performance, risco e cenários dos ativos ambientais.',
    icon: TrendingUp,
    aiHint: 'data analytics',
  },
];

const didYouKnow = [
    {
        icon: ShieldCheck,
        title: "Segurança e Futuro",
        description: "Que a UCS é um produto de necessidade real que assegura o futuro e reduz risco do mercado financeiro e climático?"
    },
    {
        icon: Scale,
        title: "Inovação Financeira Verde",
        description: "Que a CPR verde é uma modernização da arquitetura financeira que assegura o retorno financeiro do investidor com sustentabilidade, validada pelo Banco Central?"
    },
    {
        icon: Globe,
        title: "A Nova Economia Global",
        description: "Junte-se a nós nessa nova ordem econômica global, a do Capital Natural."
    }
];


export default async function LandingPage() {
  const allPrices = await getCommodityPrices();

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
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <LogoBVM />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <LoginModal>
              <Button variant="ghost">
                <User className="mr-2 h-4 w-4" />
                Acessar Plataforma
              </Button>
            </LoginModal>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full flex items-center justify-center text-center py-24 lg:py-40">
          <Image
            src="https://picsum.photos/seed/forest-path/1920/1080"
            alt="Floresta exuberante e sustentável"
            fill
            className="object-cover"
            data-ai-hint="lush forest path"
          />
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative z-10 flex flex-col items-center gap-6 px-4 md:px-6">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-white">
              O Futuro do Capital Natural é Digital
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-gray-300 md:text-xl">
              Transformamos ativos ambientais em oportunidades de investimento seguras e transparentes.
            </p>
            
             <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <LoginModal>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Acessar Plataforma <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </LoginModal>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10" asChild>
                <a href="https://bmvdigital.global/" target="_blank" rel="noopener noreferrer">
                  Conheça a BMV Digital
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section id="index-highlight" className="w-full bg-background py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                 <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="flex flex-col gap-4">
                         <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-primary">Índice UCS ASE</h2>
                         <p className="text-muted-foreground text-lg">
                            O principal indicador do mercado de ativos sustentáveis. O Índice de Unidade de Crédito de Sustentabilidade da Amazônia em Pé (UCS ASE) reflete o valor combinado dos ativos ambientais e agrícolas, criando uma referência sólida para o mercado de capitais naturais.
                         </p>
                         <ul className="grid gap-4 mt-4">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold">Transparência</h3>
                                    <p className="text-muted-foreground text-sm">Baseado em dados de mercado atualizados diariamente.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold">Credibilidade</h3>
                                    <p className="text-muted-foreground text-sm">Composto por ativos essenciais da economia verde e agrícola.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold">Oportunidade</h3>
                                    <p className="text-muted-foreground text-sm">Um novo horizonte para investimentos de impacto com retorno financeiro.</p>
                                </div>
                            </li>
                         </ul>
                    </div>
                    <div className="flex items-center justify-center">
                       <Carousel className="w-full max-w-sm" opts={{ loop: true }} plugins={[
                          // Autoplay({ delay: 4000 }),
                       ]}>
                          <CarouselContent>
                            {indexValues.map((item, index) => (
                              <CarouselItem key={index}>
                                <Card className="bg-secondary/30 border-primary/50 shadow-primary/20">
                                  <CardHeader className="items-center text-center">
                                      <div className="flex items-center gap-2">
                                        <item.icon className="h-6 w-6 text-primary" />
                                        <CardTitle className="text-xl">Índice UCS ASE</CardTitle>
                                      </div>
                                  </CardHeader>
                                  <CardContent className="text-center">
                                    <p className="text-5xl lg:text-6xl font-bold text-white font-mono">
                                      {item.value > 0 ? formatCurrency(item.value, item.currency) : '...'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{item.currency}</p>
                                    {item.conversionRate && (
                                        <p className="text-xs text-muted-foreground/70 mt-2">
                                            (1 {item.currency} = {formatCurrency(item.conversionRate, 'BRL', 'usd')})
                                        </p>
                                    )}
                                  </CardContent>
                                </Card>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                        </Carousel>
                    </div>
                </div>
            </div>
        </section>

        <section id="services" className="w-full bg-muted/20 py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Nossas Soluções</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                  Oferecemos um ecossistema completo para a gestão, negociação e certificação de Unidades de Crédito de Sustentabilidade.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-stretch gap-6 sm:grid-cols-2 md:max-w-none md:grid-cols-3">
              {services.map((service) => (
                <div key={service.title} className="group flex flex-col items-start gap-4 rounded-xl border border-white/10 bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-primary/20">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <service.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold">{service.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground flex-grow">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="did-you-know" className="w-full bg-background py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-primary">Você Sabia?</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                        Informações cruciais sobre o futuro do mercado financeiro e a economia sustentável.
                    </p>
                </div>
                </div>
                <div className="mx-auto grid max-w-3xl gap-10 py-12">
                    {didYouKnow.map((item) => (
                        <div key={item.title} className="flex items-start gap-6">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <item.icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                                <p className="text-muted-foreground">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

      </main>

      <footer className="border-t border-white/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
          <div className="flex flex-col items-center gap-2 text-center md:flex-row md:gap-4 md:text-left">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} BMV Digital. Todos os direitos reservados.</p>
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
