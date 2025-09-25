
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, CheckCircle, Globe, HandCoins, Landmark, Leaf, Repeat, Scale, ShieldCheck, TrendingUp, User, Euro, DollarSign } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { LogoUCS } from "@/components/logo-bvm";
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
        <section className="relative w-full flex items-center justify-center text-center py-24 lg:py-32">
          <Image
            src="https://picsum.photos/seed/deep-forest/1920/1080"
            alt="Floresta exuberante ao fundo"
            fill
            className="object-cover animate-zoom-in"
            data-ai-hint="lush forest"
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
                opts={{
                    align: "start",
                    loop: true,
                }}
                className="w-full max-w-xs sm:max-w-sm"
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

    
    
    

    

