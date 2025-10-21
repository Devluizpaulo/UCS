'use client';

import * as React from 'react';
import { CompositionPieChart } from './composition-pie-chart';
import { CompositionBarChart } from './composition-bar-chart';
import { CompositionDonutChart } from './composition-donut-chart';
import { ChartType } from './chart-type-selector';

interface ChartDataItem {
  id: string;
  name: string;
  value: number;
}

interface DynamicCompositionChartProps {
  data: ChartDataItem[];
  chartType: ChartType;
}

export function DynamicCompositionChart({ data, chartType }: DynamicCompositionChartProps) {
  const renderChart = () => {
    switch (chartType) {
      case 'pie':
        return <CompositionPieChart data={data} />;
      case 'donut':
        return <CompositionDonutChart data={data} />;
      case 'bar':
        return <CompositionBarChart data={data} />;
      default:
        return <CompositionPieChart data={data} />;
    }
  };

  return (
    <div className="w-full h-full transition-all duration-500 ease-in-out">
      {renderChart()}
    </div>
  );
}
