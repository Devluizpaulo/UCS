"use client";

import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartData } from '@/lib/types';

interface UcsIndexChartProps {
  data: ChartData[];
}

export function UcsIndexChart({ data }: UcsIndexChartProps) {
  const latestValue = data.length > 0 ? data[data.length - 1].value.toFixed(2) : '...';
  
  return (
    <>
      <CardHeader>
        <CardTitle>Índice UCS</CardTitle>
        <CardDescription>Valor do índice em tempo real com base em dados de commodities.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <span className="text-4xl font-bold text-primary">{latestValue}</span>
          <span className="text-sm text-muted-foreground"> UCS</span>
        </div>
        <ChartContainer
          config={{
            value: {
              label: 'UCS',
              color: 'hsl(var(--primary))',
            },
          }}
          className="h-[300px] w-full"
        >
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value}
            />
            <YAxis
              domain={['dataMin - 5', 'dataMax + 5']}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={80}
            />
            <Tooltip
              cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 2, strokeDasharray: '3 3' }}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Line
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              strokeWidth={3}
              dot={false}
              isAnimationActive={true}
              animationDuration={200}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </>
  );
}
