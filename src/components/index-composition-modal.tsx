'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { UcsData } from '@/lib/types';
import { Separator } from './ui/separator';

interface IndexCompositionModalProps {
  data: UcsData;
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatPercentage = (value: number, total: number) =>
    `${((value / total) * 100).toFixed(2)}%`;


const COLORS = {
    VM: 'hsl(var(--chart-1))',
    VUS: 'hsl(var(--chart-2))',
    CRS: 'hsl(var(--primary))',
    Pecuaria: 'hsl(var(--chart-1))',
    Milho: 'hsl(var(--chart-2))',
    Soja: 'hsl(var(--primary))',
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-2 text-sm shadow-sm">
          <p className="font-bold">{`${data.name}`}</p>
          <p className="text-muted-foreground">{`${formatCurrency(data.value)} (${data.percent})`}</p>
        </div>
      );
    }
    return null;
};


export function IndexCompositionModal({ data, isOpen, onClose }: IndexCompositionModalProps) {
    const { indexValue, components, vusDetails } = data;

    const ucsCompositionData = [
        { name: 'Valor da Madeira (VM)', value: components.vm, percent: formatPercentage(components.vm, indexValue), fill: COLORS.VM },
        { name: 'Valor de Uso do Solo (VUS)', value: components.vus, percent: formatPercentage(components.vus, indexValue), fill: COLORS.VUS },
        { name: 'Custo Socioambiental (CRS)', value: components.crs, percent: formatPercentage(components.crs, indexValue), fill: COLORS.CRS },
    ];
    
    const vusTotal = vusDetails.pecuaria + vusDetails.milho + vusDetails.soja;
    const vusCompositionData = [
        { name: 'Pecuária', value: vusDetails.pecuaria, percent: formatPercentage(vusDetails.pecuaria, vusTotal), fill: COLORS.Pecuaria },
        { name: 'Milho', value: vusDetails.milho, percent: formatPercentage(vusDetails.milho, vusTotal), fill: COLORS.Milho },
        { name: 'Soja', value: vusDetails.soja, percent: formatPercentage(vusDetails.soja, vusTotal), fill: COLORS.Soja },
    ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
            <DialogTitle className="text-2xl">Composição do Índice UCS</DialogTitle>
            <DialogDescription>
                Análise detalhada dos componentes que formam o valor do índice.
            </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
            {/* Left Side: Details & Legend */}
            <div className="flex flex-col space-y-6">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Valor Total do Índice</h3>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(indexValue)}</p>
                </div>
                <Separator />
                <div className="space-y-4">
                    <h4 className="font-semibold">Componentes Principais</h4>
                    {ucsCompositionData.map(item => (
                        <div key={item.name} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                <span>{item.name}</span>
                            </div>
                            <div className="text-right">
                                <p className="font-medium">{formatCurrency(item.value)}</p>
                                <p className="text-xs text-muted-foreground">{item.percent}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <Separator />
                 <div className="space-y-4">
                    <h4 className="font-semibold">Detalhes do VUS</h4>
                     {vusCompositionData.map(item => (
                        <div key={item.name} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                <span>{item.name}</span>
                            </div>
                            <div className="text-right">
                                <p className="font-medium">{formatCurrency(item.value)}</p>
                                <p className="text-xs text-muted-foreground">{item.percent}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Right Side: Charts */}
            <div className="flex flex-col space-y-2">
                <div className="w-full h-[250px]">
                    <h4 className="text-center font-semibold text-muted-foreground mb-2">Composição UCS</h4>
                    <ChartContainer config={{}} className="h-full w-full">
                        <PieChart>
                             <Tooltip content={<CustomTooltip />} />
                            <Pie
                                data={ucsCompositionData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                innerRadius={50}
                                labelLine={false}
                                stroke="hsl(var(--background))"
                                strokeWidth={2}
                            >
                                {ucsCompositionData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                </div>
                <div className="w-full h-[250px] pt-4">
                     <h4 className="text-center font-semibold text-muted-foreground mb-2">Composição VUS</h4>
                     <ChartContainer config={{}} className="h-full w-full">
                        <PieChart>
                            <Tooltip content={<CustomTooltip />} />
                            <Pie
                                data={vusCompositionData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                innerRadius={50}
                                labelLine={false}
                                stroke="hsl(var(--background))"
                                strokeWidth={2}
                            >
                                {vusCompositionData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
