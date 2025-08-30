import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ScenarioAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Cenários</CardTitle>
        <CardDescription>Simule o impacto de diferentes cenários econômicos e de mercado no Índice UCS.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="asset">Ativo</Label>
            <Select>
              <SelectTrigger id="asset">
                <SelectValue placeholder="Selecione um ativo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="carbono">Créditos de Carbono</SelectItem>
                <SelectItem value="boi">Boi Gordo</SelectItem>
                <SelectItem value="milho">Milho</SelectItem>
                <SelectItem value="soja">Soja</SelectItem>
                <SelectItem value="madeira">Madeira</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="change-type">Tipo de Mudança</Label>
            <Select>
              <SelectTrigger id="change-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Variação Percentual</SelectItem>
                <SelectItem value="absolute">Valor Absoluto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="change-value">Valor</Label>
            <Input id="change-value" type="number" placeholder="ex: 10 ou -5" />
          </div>
        </div>
        <div className="flex justify-start">
            <Button>Simular Cenário</Button>
        </div>

        <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium">Resultado da Simulação</h3>
            <div className="mt-4 flex items-baseline gap-4">
                <p className="text-4xl font-bold text-primary">108.75</p>
                <p className="text-lg font-semibold text-green-400">(+3.58%)</p>
            </div>
             <p className="text-sm text-muted-foreground mt-2">
                Simulação baseada em uma alta de 10% no preço do Crédito de Carbono.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
