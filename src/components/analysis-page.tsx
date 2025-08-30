'use client';

import { PageHeader } from '@/components/page-header';
import { MarketTrends } from '@/components/market-trends';
import { RiskAnalysis } from '@/components/risk-analysis';
import { ScenarioAnalysis } from '@/components/scenario-analysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AnalysisPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <PageHeader title="Análise Estratégica" />
      <main className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="trends">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trends">Tendências de Mercado</TabsTrigger>
            <TabsTrigger value="risk">Análise de Risco</TabsTrigger>
            <TabsTrigger value="scenarios">Análise de Cenários</TabsTrigger>
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
        </Tabs>
      </main>
    </div>
  );
}
