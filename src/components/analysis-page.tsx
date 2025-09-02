
'use client';

import { PageHeader } from '@/components/page-header';
import { MarketTrends } from '@/components/market-trends';
import { RiskAnalysis } from '@/components/risk-analysis';
import { ScenarioAnalysis } from '@/components/scenario-analysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnderlyingAssetsCard } from './underlying-assets-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Accordion } from './ui/accordion';

export function AnalysisPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader title="Análise Estratégica" />
      <main className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="trends">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends">Tendências de Mercado</TabsTrigger>
            <TabsTrigger value="risk">Análise de Risco</TabsTrigger>
            <TabsTrigger value="scenarios">Análise de Cenários</TabsTrigger>
            <TabsTrigger value="assets">Ativos Subjacentes</TabsTrigger>
          </TabsList>
          <TabsContent value="trends">
            <MarketTrends />
          </TabsContent>
          <TabsContent value="risk">
            <RiskAnalysis />
          </TabsContent>
          <TabsContent value="scenarios">
            <ScenarioAnalysis />
          </TabsContent>
           <TabsContent value="assets">
            <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-1">
                <UnderlyingAssetsCard onDataChange={() => {}} />
            </Accordion>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
