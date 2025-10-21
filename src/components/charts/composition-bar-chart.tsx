'use client';

import * as React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { COLOR_ARRAY, getComponentColor } from '@/lib/colors';

interface ChartDataItem {
  id: string;
  name: string;
  value: number;
}

interface CompositionBarChartProps {
  data: ChartDataItem[];
}

// Usar cores padronizadas
const COLORS = COLOR_ARRAY;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-lg border bg-white p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800">
              {data.name}
            </span>
            <span className="text-base font-bold text-gray-900">
              {formatCurrency(data.value, 'BRL')}
            </span>
            <span className="text-xs text-gray-600">
              {data.percentage}% do total
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export function CompositionBarChart({ data }: CompositionBarChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...data.map(d => d.value));
  
  // Configurações do gráfico
  const chartWidth = 600;
  const chartHeight = 300;
  const margin = { top: 40, right: 80, bottom: 40, left: 120 };
  const barHeight = 35;
  const barSpacing = 15;
  
  // Calcular posições das barras
  const bars = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const barWidth = (item.value / maxValue) * (chartWidth - margin.left - margin.right);
    const y = margin.top + index * (barHeight + barSpacing);
    
    return {
      ...item,
      percentage: percentage.toFixed(0),
      barWidth,
      y,
      color: getComponentColor(item.id)
    };
  });

  return (
    <div className="relative w-full h-full bg-white rounded-lg p-4">
      {/* Título */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-black">
          Composição do Índice "Valor de Uso do Solo"
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Distribuição dos componentes
        </p>
      </div>

      <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {/* Grid lines horizontais */}
        {[0, 10, 20, 30, 40, 50, 60, 70, 80].map((value) => {
          const x = margin.left + (value / 80) * (chartWidth - margin.left - margin.right);
          return (
            <g key={value}>
              <line
                x1={x}
                y1={margin.top}
                x2={x}
                y2={chartHeight - margin.bottom}
                stroke="#e5e7eb"
                strokeWidth={1}
                opacity={0.3}
              />
              <text
                x={x}
                y={chartHeight - margin.bottom + 20}
                textAnchor="middle"
                fontSize="12"
                fill="#000000"
                fontFamily="sans-serif"
              >
                {value}%
              </text>
            </g>
          );
        })}

        {/* Barras */}
        {bars.map((bar, index) => (
          <g key={bar.id}>
            {/* Barra */}
            <rect
              x={margin.left}
              y={bar.y}
              width={bar.barWidth}
              height={barHeight}
              fill={bar.color}
              rx={0}
              ry={0}
              style={{ transition: 'all 0.3s ease' }}
            />
            
            {/* Label do componente (esquerda) */}
            <text
              x={margin.left - 10}
              y={bar.y + barHeight / 2}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="14"
              fill="#000000"
              fontFamily="sans-serif"
              fontWeight="normal"
            >
              {bar.name.length > 20 ? `${bar.name.substring(0, 20)}...` : bar.name}
            </text>
            
            {/* Percentual dentro da barra */}
            <text
              x={margin.left + bar.barWidth - 10}
              y={bar.y + barHeight / 2}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="14"
              fill="#000000"
              fontFamily="sans-serif"
              fontWeight="bold"
            >
              {bar.percentage}%
            </text>
          </g>
        ))}

        {/* Eixo Y */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={chartHeight - margin.bottom}
          stroke="#000000"
          strokeWidth={1}
        />

        {/* Eixo X */}
        <line
          x1={margin.left}
          y1={chartHeight - margin.bottom}
          x2={chartWidth - margin.right}
          y2={chartHeight - margin.bottom}
          stroke="#000000"
          strokeWidth={1}
        />
      </svg>

      {/* Tooltip customizado */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <div className="text-xs text-gray-600">
          Max: {formatCurrency(maxValue, 'BRL', { compact: true })}
        </div>
      </div>
    </div>
  );
}