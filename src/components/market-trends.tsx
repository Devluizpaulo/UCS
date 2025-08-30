import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ChartData } from '@/lib/types';


const chartData: ChartData[] = [
    { time: 'Jan', value: 186 },
    { time: 'Feb', value: 305 },
    { time: 'Mar', value: 237 },
    { time: 'Apr', value: 273 },
    { time: 'May', value: 209 },
    { time: 'Jun', value: 214 },
];

export function MarketTrends() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendências de Mercado</CardTitle>
        <CardDescription>Análise histórica e projeções para os componentes do Índice UCS.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{
            value: {
              label: 'Valor',
              color: 'hsl(var(--primary))',
            },
          }}
          className="h-[300px] w-full"
        >
          <AreaChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="value"
              type="natural"
              fill="var(--color-value)"
              fillOpacity={0.4}
              stroke="var(--color-value)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
