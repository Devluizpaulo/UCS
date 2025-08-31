'use client';

import { PageHeader } from '@/components/page-header';
import { MarketTrends } from '@/components/market-trends';
import { RiskAnalysis } from '@/components/risk-analysis';
import { ScenarioAnalysis } from '@/components/scenario-analysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnderlyingAssetsTable } from './underlying-assets-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

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
            <Card>
                <CardHeader>
                    <CardTitle>Ativos Subjacentes do Índice</CardTitle>
                    <CardDescription>Preços e variações diárias das commodities que compõem o índice UCS.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UnderlyingAssetsTable />
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
