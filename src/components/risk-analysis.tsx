import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const riskData = [
  { asset: 'USD/BRL Histórico', volatility: 'Média', correlation: 'Positiva', sentiment: 'Neutro' },
  { asset: 'EUR/BRL Histórico', volatility: 'Média', correlation: 'Positiva', sentiment: 'Neutro' },
];

export function RiskAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Risco</CardTitle>
        <CardDescription>Visualização dos riscos de volatilidade, correlação e sentimento de mercado para cada ativo.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead>Volatilidade</TableHead>
              <TableHead>Correlação com Índice</TableHead>
              <TableHead className="text-right">Sentimento de Mercado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {riskData.map((item) => (
              <TableRow key={item.asset}>
                <TableCell className="font-medium">{item.asset}</TableCell>
                <TableCell>
                  <Badge variant={item.volatility === 'Alta' ? 'destructive' : item.volatility === 'Média' ? 'secondary' : 'default'} className="bg-opacity-50 ">
                    {item.volatility}
                  </Badge>
                </TableCell>
                <TableCell>{item.correlation}</TableCell>
                <TableCell className="text-right">{item.sentiment}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
