import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function MarketTrends() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendências de Mercado</CardTitle>
        <CardDescription>Análise histórica e projeções para os componentes do Índice UCS.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96 flex items-center justify-center text-muted-foreground">
            <p>Componente de gráfico de tendências de mercado em breve.</p>
        </div>
      </CardContent>
    </Card>
  );
}
