import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function RiskAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Risco</CardTitle>
        <CardDescription>Visualização dos riscos de volatilidade e correlação entre os ativos.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96 flex items-center justify-center text-muted-foreground">
            <p>Componente de análise de risco em breve.</p>
        </div>
      </CardContent>
    </Card>
  );
}
