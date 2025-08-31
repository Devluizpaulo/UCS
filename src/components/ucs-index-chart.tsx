'use client';

import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartData } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

interface UcsIndexChartProps {
  data: ChartData[];
  loading: boolean;
}

export function UcsIndexChart({ data, loading }: UcsIndexChartProps) {

  return (
    <ChartContainer
      config={{
        value: {
          label: 'UCS',
          color: 'hsl(var(--primary))',
        },
      }}
      className="h-[300px] w-full"
    >
      {loading && data.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center">
            <Skeleton className="h-[250px] w-full" />
          </div>
      ) : (
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
            cursor={{
              stroke: 'hsl(var(--accent))',
              strokeWidth: 2,
              strokeDasharray: '3 3',
            }}
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
      )}
    </ChartContainer>
  );
}
