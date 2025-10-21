'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { getComponentColor } from '@/lib/colors';

interface ChartDataItem {
  id: string;
  name: string;
  value: number;
}

interface CompositionDonutChartProps {
  data: ChartDataItem[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-xl border-2 border-white/20 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-sm p-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full shadow-lg"
            style={{ backgroundColor: data.payload.color }}
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800">
              {data.name}
            </span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(data.value, 'BRL')}
            </span>
            <span className="text-xs text-gray-600 font-medium">
              {(data.payload.percent * 100).toFixed(2)}% do total
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent < 0.05) return null; // Não mostrar labels para fatias muito pequenas
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-sm font-bold drop-shadow-lg"
      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function CompositionDonutChart({ data }: CompositionDonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Adicionar cores aos dados
  const dataWithColors = data.map(item => ({
    ...item,
    color: getComponentColor(item.id)
  }));

  return (
    <div className="relative w-full h-full">
      {/* Fundo com gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-green-50/30 rounded-2xl" />
      
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {dataWithColors.map((item, index) => (
              <linearGradient key={index} id={`donut-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={item.color} stopOpacity={0.9} />
                <stop offset="100%" stopColor={item.color} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          
          <Tooltip content={<CustomTooltip />} />
          
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius="80%"
            innerRadius="40%"
            fill="#8884d8"
            dataKey="value"
            label={<CustomLabel />}
            stroke="white"
            strokeWidth={1}
          >
            {dataWithColors.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#donut-gradient-${index})`}
                stroke="white"
                strokeWidth={1}
                style={{ 
                  filter: `drop-shadow(0px 4px 8px ${entry.color}40)`,
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </Pie>
          
          {/* Centro do donut com informações */}
          <text 
            x="50%" 
            y="45%" 
            textAnchor="middle" 
            dominantBaseline="middle" 
            className="text-2xl font-bold text-gray-800"
          >
            Total
          </text>
          <text 
            x="50%" 
            y="55%" 
            textAnchor="middle" 
            dominantBaseline="middle" 
            className="text-lg font-semibold text-gray-600"
          >
            {formatCurrency(total, 'BRL', { compact: true })}
          </text>
          
          <Legend 
            iconType="circle"
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value, entry, index) => (
              <span className="text-sm font-medium text-gray-700 px-2 py-1 rounded-lg bg-white/50 backdrop-blur-sm">
                {value}
              </span>
            )}
            iconSize={12}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Elementos decorativos */}
      <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-green-400/20 rounded-full blur-xl" />
      <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-lg" />
    </div>
  );
}