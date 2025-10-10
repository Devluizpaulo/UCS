
'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

interface ChartDataItem {
  id: string;
  name: string;
  value: number;
}

interface CompositionPieChartProps {
  data: ChartDataItem[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {data.name}
            </span>
            <span className="font-bold text-muted-foreground">
              {formatCurrency(data.value, 'BRL')}
            </span>
            <span className="text-xs text-muted-foreground">
              ({(data.payload.percent * 100).toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export function CompositionPieChart({ data }: CompositionPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip
          content={<CustomTooltip />}
        />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius="80%"
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]} 
              stroke={COLORS[index % COLORS.length]}
              style={{ filter: `drop-shadow(0px 2px 4px ${COLORS[index % COLORS.length]}90)` }}
            />
          ))}
        </Pie>
        <Legend 
            iconType="circle"
            formatter={(value, entry, index) => <span className="text-sm text-muted-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
