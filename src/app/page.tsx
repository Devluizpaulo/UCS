
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCommodityPrices } from "@/lib/data-service";
import type { CommodityPriceData } from "@/lib/types";
import { formatCurrency } from "@/lib/formatters";
import { ArrowRight, Briefcase, CheckCircle, HandCoins, Landmark, Repeat, TrendingUp } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { LogoBVM } from "@/components/logo-bvm";
import { LoginModal } from "@/components/login-modal";
import { getIconForCategory } from "@/lib/icons";

const services = [
  {
    title: 'Plataforma de Registro',
    description: 'Registro e gestão de UCS de forma segura e transparente.',
    icon: Landmark,
    aiHint: 'blockchain technology',
  },
  {
    title: 'Custódia da UCS',
    description: 'A BMV DIGITAL mantém a informação de registro da UCS e do valor armazenado em um sistema padronizado.',
    icon: Briefcase,
    aiHint: 'secure data',
  },
  {
    title: 'Oferta de UCS',
    description: 'A BMV DIGITAL oferta as UCS no mercado por vendedor padrão ou credenciado, garantindo a rastreabilidade da operação.',
    icon: HandCoins,
    aiHint: 'digital currency',
  },
  {
    title: 'Liquidação da UCS',
    description: 'A BMV DIGITAL dará baixa no seu sistema na quantidade vendida e fará a transferência para o comprador.',
    icon: Repeat,
    aiHint: 'financial transaction',
  },
  {
    title: 'Certificação pelo uso das UCSs',
    description: 'A BMV DIGITAL verifica, valida e baixa no sistema a quantidade vendida, transfere as UCS para o comprador com emissão do Selo Sustentabilidade.',
    icon: CheckCircle,
    aiHint: 'certificate seal',
  },
   {
    title: 'Análise de Ativos',
    description: 'Plataforma completa para análise de performance, risco e cenários dos ativos ambientais.',
    icon: TrendingUp,
    aiHint: 'financial charts',
  },
];


export default async function LandingPage() {
  const commodityData: CommodityPriceData[] = await getCommodityPrices();
  const ucsAse = commodityData.find(asset => asset.id === 'ucs_ase');
  const ucsAsePrice = ucsAse ? formatCurrency(ucsAse.price, ucsAse.currency, ucsAse.id) : '-';
  const IconUcsAse = getIconForCategory(ucsAse);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <LogoBVM />
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#services" className="transition-colors hover:text-primary">Serviços</a>
            <a href="https://bmvdigital.global/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">Site Institucional</a>
          </nav>
          <LoginModal>
            <Button>
              Acessar Painel <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </LoginModal>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto flex flex-col items-center justify-center gap-8 px-4 py-20 text-center md:px-6 md:py-32">
          <div className="flex items-center gap-3 rounded-full border bg-muted px-4 py-2 text-sm text-muted-foreground">
             <IconUcsAse className="h-5 w-5 text-primary" />
            <span>Índice de Unidade de Conservação Sustentável</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            UCS - Unidade de Crédito de Sustentabilidade
          </h1>
          <div className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
             <p>Acompanhe a performance econômica de ativos ambientais e agrícolas em tempo real.</p>
          </div>
          
          <Card className="w-full max-w-md animate-fade-in shadow-lg shadow-primary/10">
            <CardHeader className="text-left">
              <CardTitle className="text-lg">Cotação Atual - Índice UCS ASE</CardTitle>
              <CardDescription>Valor atualizado do principal índice da plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-5xl font-bold text-primary">{ucsAsePrice}</p>
            </CardContent>
          </Card>
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
