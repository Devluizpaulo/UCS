
'use client';

import * as React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import type { CommodityPriceData } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { useTheme } from 'next-themes';

const MultiLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="text-sm font-semibold mb-2">{`Data: ${label}`}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-sm">{`${entry.name}: `}</span>
            <span className="text-sm font-mono font-semibold">
              {formatCurrency(entry.value, 'BRL', entry.dataKey)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const DefaultTooltip = ({ active, payload, label, asset }: any) => {
  if (active && payload && payload.length && asset) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="text-sm font-semibold mb-2">{`Data: ${label}`}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm">{`Preço: `}</span>
          <span className="text-sm font-mono font-semibold">
            {formatCurrency(payload[0].value, asset.currency, asset.id)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const ChartSkeleton = () => (
    <div className="h-full w-full">
      <Skeleton className="h-full w-full" />
    </div>
);

interface HistoricalAnalysisChartProps {
    isLoading: boolean;
    chartData: any[];
    isMultiLine: boolean;
    mainAssetData: CommodityPriceData | null;
    visibleAssets: Record<string, boolean>;
    lineColors: Record<string, string>;
    assetNames: Record<string, string>;
}

export function HistoricalAnalysisChart({ 
    isLoading, 
    chartData, 
    isMultiLine, 
    mainAssetData,
    visibleAssets,
    lineColors,
    assetNames
}: HistoricalAnalysisChartProps) {
  const { resolvedTheme } = useTheme();
  const [activeLegend, setActiveLegend] = React.useState<string | null>(null);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!chartData || chartData.length < 2) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
          <AlertCircle className="h-6 w-6 mr-2" />
          <p>Sem dados históricos suficientes para exibir o gráfico.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <defs>
            <linearGradient id="chart-bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={resolvedTheme === 'dark' ? "hsl(var(--chart-1) / 0.1)" : "hsl(var(--chart-1) / 0.05)"} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={resolvedTheme === 'dark' ? "hsl(var(--chart-1) / 0.01)" : "hsl(var(--chart-1) / 0.01)"} stopOpacity={0}/>
            </linearGradient>
        </defs>
        <CartesianGrid vertical={true} stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis
          dataKey="date"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          domain={['dataMin', 'dataMax']}
          tickFormatter={(value) => formatCurrency(value as number, mainAssetData?.currency || 'BRL', mainAssetData?.id)}
          yAxisId="left"
        />
        <Tooltip
          content={isMultiLine ? <MultiLineTooltip /> : <DefaultTooltip asset={mainAssetData} />}
        />
        
        {isMultiLine && (
            <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ right: -10, top: -5 }}
                onMouseEnter={(props) => setActiveLegend(props.dataKey as string)}
                onMouseLeave={() => setActiveLegend(null)}
            />
        )}
        
        {isMultiLine ? (
          Object.keys(visibleAssets)
            .filter(key => visibleAssets[key])
            .map(key => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={assetNames[key] || key.toUpperCase()}
                stroke={lineColors[key]}
                strokeWidth={activeLegend === key ? 4 : 2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2 }}
                yAxisId="left"
                strokeOpacity={activeLegend && activeLegend !== key ? 0.3 : 1}
              />
            ))
        ) : (
          <>
            {mainAssetData?.price && <ReferenceLine y={mainAssetData.price} stroke="hsl(var(--primary))" strokeDasharray="3 3" opacity={0.8} />}
            <Line type="monotone" dataKey="value" name="Preço" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} yAxisId="left" />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
