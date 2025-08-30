import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function ScenarioAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Cenários</CardTitle>
        <CardDescription>Simule o impacto de diferentes cenários econômicos e de mercado no Índice UCS.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96 flex items-center justify-center text-muted-foreground">
            <p>Componente de análise de cenários em breve.</p>
        </div>
      </CardContent>
    </Card>
  );
}
