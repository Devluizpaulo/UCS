
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCommodityPrices } from "@/lib/data-service";
import type { CommodityPriceData } from "@/lib/types";
import { formatCurrency } from "@/lib/formatters";
import { ArrowRight, Briefcase, CheckCircle, Globe, HandCoins, Landmark, Repeat, Scale, ShieldCheck, TrendingUp, User, Euro } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { LogoBVM } from "@/components/logo-bvm";
import { LoginModal } from "@/components/login-modal";
import { getIconForCategory } from "@/lib/icons";
import { LanguageSwitcher } from "@/components/language-switcher";

const services = [
  {
    title: 'Plataforma de Registro',
    description: 'Registro e gestão de UCS de forma segura e transparente.',
    icon: Landmark,
    aiHint: 'forest preservation',
  },
  {
    title: 'Custódia da UCS',
    description: 'A BMV DIGITAL mantém a informação de registro da UCS e do valor armazenado em um sistema padronizado.',
    icon: Briefcase,
    aiHint: 'sustainable agriculture',
  },
  {
    title: 'Oferta de UCS',
    description: 'A BMV DIGITAL oferta as UCS no mercado por vendedor padrão ou credenciado, garantindo a rastreabilidade da operação.',
    icon: HandCoins,
    aiHint: 'renewable energy',
  },
  {
    title: 'Liquidação da UCS',
    description: 'A BMV DIGITAL dará baixa no seu sistema na quantidade vendida e fará a transferência para o comprador.',
    icon: Repeat,
    aiHint: 'water resources',
  },
  {
    title: 'Certificação pelo uso das UCSs',
    description: 'A BMV DIGITAL verifica, valida e baixa no sistema a quantidade vendida, transfere as UCS para o comprador com emissão do Selo Sustentabilidade.',
    icon: CheckCircle,
    aiHint: 'environmental certificate',
  },
   {
    title: 'Análise de Ativos',
    description: 'Plataforma completa para análise de performance, risco e cenários dos ativos ambientais.',
    icon: TrendingUp,
    aiHint: 'green economy',
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
  const commodityData: CommodityPriceData[] = await getCommodityPrices();
  const ucsAse = commodityData.find(asset => asset.id === 'ucs_ase');
  const ucsAsePrice = ucsAse ? formatCurrency(ucsAse.price, ucsAse.currency, ucsAse.id) : '-';
  const IconUcsAse = getIconForCategory(ucsAse);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <LogoBVM />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <LoginModal>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">Login</span>
              </Button>
            </LoginModal>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full flex items-center justify-center text-center text-white py-20 lg:py-28">
          <Image
            src="https://picsum.photos/seed/forest/1920/1080"
            alt="Floresta exuberante"
            fill
            className="object-cover"
            data-ai-hint="rainforest canopy"
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 flex flex-col items-center gap-6 px-4 md:px-6">
            <div className="flex items-center gap-3 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
              <IconUcsAse className="h-5 w-5 text-primary" />
              <span>Índice de Unidade de Conservação Sustentável</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-6xl">
              UCS - Unidade de Crédito de Sustentabilidade
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-gray-200 md:text-lg">
              Acompanhe a performance econômica de ativos ambientais e agrícolas em tempo real.
            </p>
            
            <Card className="w-full max-w-sm animate-fade-in bg-background/50 text-foreground backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-lg">Cotação Atual - Índice UCS ASE</CardTitle>
                <CardDescription className="text-gray-300">Valor atualizado do principal índice da plataforma.</CardDescription>
              </CardHeader>
              <CardContent>
                  <p className="text-5xl font-bold text-primary">{ucsAsePrice}</p>
              </CardContent>
            </Card>

             <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <LoginModal>
                <Button size="lg">
                  Acessar Painel <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </LoginModal>
              <Button size="lg" variant="secondary" asChild>
                <a href="https://bmvdigital.global/" target="_blank" rel="noopener noreferrer">
                  Conheça a BMV Digital
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section id="services" className="w-full bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">A BMV DIGITAL oferece serviços:</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Soluções completas para a gestão, negociação e certificação de Unidades de Crédito de Sustentabilidade.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 md:max-w-none md:grid-cols-3">
              {services.map((service, index) => (
                <div key={service.title} className="group flex flex-col items-start gap-4 rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-primary/20">
                  <div className="relative h-48 w-full overflow-hidden rounded-lg">
                     <Image
                        src={`https://picsum.photos/seed/${index+10}/600/400`}
                        alt={service.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={service.aiHint}
                      />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <service.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold">{service.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
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

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} BMV Digital. Todos os direitos reservados.</p>
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
