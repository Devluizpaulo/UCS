
'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/lib/language-context';
import imageData from '@/lib/placeholder-images.json';

const getImage = (id: string) => imageData.find(img => img.id === id);

function IndexDetailsContent() {
  const { t } = useLanguage();

  const heroImage = getImage('forest-overhead');
  const vmadImage = getImage('logging-truck');
  const vusImage = getImage('farmland');
  const crsImage = getImage('clean-river');
  const applicationsImages = {
    'environmental-compensation': getImage('applications-environmental-compensation'),
    'carbon-markets': getImage('applications-carbon-markets'),
    'strategic-decisions': getImage('applications-strategic-decisions'),
    'sustainable-investments': getImage('applications-sustainable-investments')
  };
  const caseStudyChartImage = getImage('case-study-chart');
  const newEconomyImage = getImage('new-economy-balance');

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50 text-gray-800 animate-fade-in">
      {/* Header Section */}
      <header className="relative text-white py-20 md:py-32 text-center overflow-hidden">
        {heroImage && (
          <div className="absolute inset-0 z-0">
            <Image
              src={heroImage.src}
              alt={heroImage.alt}
              fill
              className="object-cover"
              data-ai-hint={heroImage.hint}
              priority
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          </div>
        )}
        <div className="relative z-10 container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-md animate-fade-in-down">
            PDM – Potencial Desflorestador Monetizado
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto opacity-90 drop-shadow-sm animate-fade-in-up">
            Transformando o valor da floresta em ativos econômicos mensuráveis
          </p>
        </div>
      </header>
      
      <main className="container mx-auto py-12 md:py-16 px-4 md:px-6 space-y-16">

        {/* Intro Section */}
        <section className="max-w-4xl mx-auto text-center animate-fade-in-up animation-delay-200">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
            Revolucionando a Forma Como Enxergamos as Florestas
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Imagine poder traduzir em números precisos o verdadeiro valor de uma floresta - não apenas a madeira que pode ser cortada, mas todo o ecossistema vivo que sustenta economias e comunidades. O <strong>Potencial Desflorestador Monetizado (PDM)</strong> faz exatamente isso.
          </p>
          <Card className="bg-primary-foreground text-left shadow-lg border-l-4 border-green-600">
            <CardContent className="p-6">
              <p className="text-base font-semibold text-primary">
                O PDM transforma a floresta em um ativo financeiro mensurável - uma linguagem universal que ambientalistas, economistas e investidores podem compreender e utilizar.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Components Section */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 animate-fade-in-up animation-delay-400">
            Os Três Pilares do Valor da Floresta
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* VMAD Card */}
            <Card className="flex flex-col animate-fade-in-up animation-delay-600">
              {vmadImage && <Image src={vmadImage.src} alt={vmadImage.alt} width={800} height={600} className="rounded-t-lg object-cover h-48 w-full" data-ai-hint={vmadImage.hint} />}
              <CardHeader>
                <CardTitle>VMAD – Valor da Madeira</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">O potencial econômico direto, traduzindo árvores em números concretos. Responde à pergunta: "Quanto vale esta floresta se for explorada hoje?"</p>
              </CardContent>
            </Card>
            {/* VUS Card */}
            <Card className="flex flex-col animate-fade-in-up animation-delay-800">
              {vusImage && <Image src={vusImage.src} alt={vusImage.alt} width={800} height={600} className="rounded-t-lg object-cover h-48 w-full" data-ai-hint={vusImage.hint} />}
              <CardHeader>
                <CardTitle>VUS – Valor de Uso do Solo</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">O custo de oportunidade da preservação. Revela o que se deixaria de ganhar ao manter a floresta em pé, convertendo a área para agricultura ou outros usos.</p>
              </CardContent>
            </Card>
            {/* CRS Card */}
            <Card className="flex flex-col animate-fade-in-up animation-delay-1000">
              {crsImage && <Image src={crsImage.src} alt={crsImage.alt} width={800} height={600} className="rounded-t-lg object-cover h-48 w-full" data-ai-hint={crsImage.hint} />}
              <CardHeader>
                <CardTitle>CRS – Custo da Responsabilidade Socioambiental</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">O valor dos serviços invisíveis que a floresta presta. Quantifica quanto custaria substituir artificialmente a purificação da água, o ar limpo e a regulação climática.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Impact Section */}
        <section className="relative rounded-lg overflow-hidden py-20 text-center text-white animate-fade-in">
          {getImage('impact-stats') && <Image src={getImage('impact-stats')?.src || ''} alt={getImage('impact-stats')?.alt || ''} layout="fill" className="object-cover" data-ai-hint={getImage('impact-stats')?.hint} />}
          <div className="absolute inset-0 bg-primary/80"></div>
          <div className="relative z-10 container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">O Impacto Transformador do PDM</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-4xl font-bold">+47%</p>
                <p className="text-sm opacity-80">de precisão na valoração de ativos</p>
              </div>
              <div>
                <p className="text-4xl font-bold">3.2x</p>
                <p className="text-sm opacity-80">maior retorno em projetos de conservação</p>
              </div>
              <div>
                <p className="text-4xl font-bold">89%</p>
                <p className="text-sm opacity-80">dos investidores consideram decisivo</p>
              </div>
              <div>
                <p className="text-4xl font-bold">R$ 2,1bi</p>
                <p className="text-sm opacity-80">em ativos ambientais já valorados</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Applications Section */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Onde o PDM está Transformando Realidades</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Object.entries(applicationsImages).map(([key, img], index) => (
              <Card key={key} className="text-center animate-fade-in-up" style={{ animationDelay: `${index * 150}ms` }}>
                {img && <Image src={img.src} alt={img.alt} width={600} height={400} className="rounded-t-lg object-cover h-40 w-full" data-ai-hint={img.hint} />}
                <CardHeader>
                  <CardTitle className="text-lg">{key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
        
        {/* Case Study Section */}
        <section>
          <Card className="bg-primary-foreground overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-primary mb-4">Caso Real: A Floresta que Valia Mais em Pé</h3>
                <p className="text-muted-foreground mb-4">Na Amazônia, uma área de 1.000 hectares estava sob pressão para conversão. Após aplicar o PDM, os resultados foram reveladores: o valor dos serviços ambientais (CRS) superou o da exploração (VMAD) em 56%.</p>
                <p className="font-semibold">A descoberta foi impactante: preservar a floresta gerava mais valor econômico. O proprietário, antes cético, tornou-se um defensor da conservação ao ver os números.</p>
              </div>
              <div className="p-8 flex items-center justify-center bg-muted/30">
                {caseStudyChartImage && <Image src={caseStudyChartImage.src} alt={caseStudyChartImage.alt} width={600} height={400} className="rounded-lg shadow-md" data-ai-hint={caseStudyChartImage.hint} />}
              </div>
            </div>
          </Card>
        </section>
        
        {/* New Economy Section */}
        <section>
          <Card className="bg-primary-foreground overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="p-8">
                <h2 className="text-3xl font-bold text-primary mb-4">Uma Nova Economia para as Florestas</h2>
                <p className="text-muted-foreground">O PDM está na vanguarda de uma transformação silenciosa: a que reconhece que preservar vale mais do que destruir. Ao atribuir valor econômico aos serviços ecossistêmicos, criamos incentivos financeiros poderosos para a conservação.</p>
              </div>
              {newEconomyImage && <Image src={newEconomyImage.src} alt={newEconomyImage.alt} width={800} height={600} className="object-cover h-full w-full" data-ai-hint={newEconomyImage.hint} />}
            </div>
          </Card>
        </section>

      </main>
    </div>
  )
}

export default function IndexDetailsPage() {
  return (
    <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    }>
      <IndexDetailsContent />
    </Suspense>
  );
}
