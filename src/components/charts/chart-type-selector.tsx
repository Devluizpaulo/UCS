'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { 
  PieChartIcon, 
  BarChart3Icon, 
  CircleIcon
} from 'lucide-react';

export type ChartType = 'pie' | 'bar' | 'donut';

interface ChartTypeSelectorProps {
  selectedType: ChartType;
  onTypeChange: (type: ChartType) => void;
}

const chartTypes = [
  {
    id: 'pie' as ChartType,
    name: 'Pizza',
    icon: PieChartIcon,
    description: 'Gráfico de pizza clássico'
  },
  {
    id: 'donut' as ChartType,
    name: 'Donut',
    icon: CircleIcon,
    description: 'Gráfico de donut com centro vazio'
  },
  {
    id: 'bar' as ChartType,
    name: 'Barras',
    icon: BarChart3Icon,
    description: 'Gráfico de barras horizontal'
  }
];

export function ChartTypeSelector({ selectedType, onTypeChange }: ChartTypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
      <div className="w-full mb-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Tipo de Gráfico</h3>
        <p className="text-xs text-gray-500">Escolha o estilo de visualização</p>
      </div>
      
      {chartTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = selectedType === type.id;
        
        return (
          <Button
            key={type.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onTypeChange(type.id)}
            className={`
              flex items-center gap-2 px-3 py-2 h-auto transition-all duration-200
              ${isSelected 
                ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg hover:shadow-xl' 
                : 'bg-white hover:bg-gray-50 border-gray-300 hover:border-blue-400'
              }
            `}
            title={type.description}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{type.name}</span>
          </Button>
        );
      })}
    </div>
  );
}
