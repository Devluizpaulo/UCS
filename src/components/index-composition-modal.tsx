
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { UcsData } from '@/lib/types';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { formatCurrency } from '@/lib/ucs-pricing-service';
import { useEffect, useState } from 'react';

interface IndexCompositionModalProps {
  data: UcsData;
  isOpen: boolean;
  onClose: () => void;
}

const formatPercentage = (value: number, total: number) =>
    `${total > 0 ? ((value / total) * 100).toFixed(2) : '0.00'}%`;


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
      const formattedValue = formatCurrency(payload[0].value, 'BRL');
      return (
        <div className="rounded-lg border bg-background p-2 text-sm shadow-sm">
          <p className="font-bold">{`${data.name}`}</p>
          <p className="text-muted-foreground">{`${formattedValue} (${data.percent})`}</p>
        </div>
      );
    }
    return null;
};


export function IndexCompositionModal({ data, isOpen, onClose }: IndexCompositionModalProps) {
    const { indexValue, components, vusDetails } = data;
    const totalPdm = components.vm + components.vus + components.crs;
    const [formattedIndex, setFormattedIndex] = useState('');
    const [formattedPdm, setFormattedPdm] = useState('');

    useEffect(() => {
      if (data) {
        setFormattedIndex(formatCurrency(indexValue, 'BRL'));
        setFormattedPdm(formatCurrency(totalPdm, 'BRL'));
      }
    }, [data, indexValue, totalPdm]);

    const ucsCompositionData = [
        { name: 'Valor da Madeira (VMAD)', value: components.vm, percent: formatPercentage(components.vm, totalPdm), fill: COLORS.VM },
        { name: 'Valor de Uso do Solo (VUS)', value: components.vus, percent: formatPercentage(components.vus, totalPdm), fill: COLORS.VUS },
        { name: 'Custo Socioambiental (CRS)', value: components.crs, percent: formatPercentage(components.crs, totalPdm), fill: COLORS.CRS },
    ];
    
    const vusTotal = vusDetails.pecuaria + vusDetails.milho + vusDetails.soja;
    const vusCompositionData = [
        { name: 'Pecuária', value: vusDetails.pecuaria, percent: formatPercentage(vusDetails.pecuaria, vusTotal), fill: COLORS.Pecuaria },
        { name: 'Milho', value: vusDetails.milho, percent: formatPercentage(vusDetails.milho, vusTotal), fill: COLORS.Milho },
        { name: 'Soja', value: vusDetails.soja, percent: formatPercentage(vusDetails.soja, vusTotal), fill: COLORS.Soja },
    ];

    const FormattedItem = ({label, value}: {label: string, value: number}) => {
        const formatted = formatCurrency(value, 'BRL');
        return (
            <p className="font-medium">{formatted}</p>
        )
    }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
            <DialogTitle className="text-2xl">Composição do Índice UCS</DialogTitle>
            <DialogDescription>
                Análise detalhada dos componentes que formam o valor do índice.
            </DialogDescription>
        </DialogHeader>
        <ScrollArea className="pr-6 -mr-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                {/* Left Side: Details & Legend */}
                <div className="flex flex-col space-y-6">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Valor Final do Índice UCS</h3>
                        <p className="text-3xl font-bold text-primary">{formattedIndex}</p>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <h4 className="font-semibold">Componentes do PDM (Potencial Desflorestador Monetizado)</h4>
                        {ucsCompositionData.map(item => (
                            <div key={item.name} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                    <span>{item.name}</span>
                                </div>
                                <div className="text-right">
                                    <FormattedItem label={item.name} value={item.value} />
                                    <p className="text-xs text-muted-foreground">{item.percent}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <h4 className="font-semibold">Detalhes do VUS (Valor de Uso do Solo)</h4>
                        {vusCompositionData.map(item => (
                            <div key={item.name} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                    <span>{item.name}</span>
                                </div>
                                <div className="text-right">
                                     <FormattedItem label={item.name} value={item.value} />
                                    <p className="text-xs text-muted-foreground">{item.percent}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Right Side: Charts */}
                <div className="flex flex-col space-y-2">
                    <div className="w-full h-[250px]">
                        <h4 className="text-center font-semibold text-muted-foreground mb-2">Composição PDM</h4>
                        <ResponsiveContainer width="100%" height="100%">
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
                        </ResponsiveContainer>
                    </div>
                    <div className="w-full h-[250px] pt-4">
                        <h4 className="text-center font-semibold text-muted-foreground mb-2">Composição VUS</h4>
                        <ResponsiveContainer width="100%" height="100%">
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
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
