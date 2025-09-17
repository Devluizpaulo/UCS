
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
import { ScrollArea } from './ui/scroll-area';
import { formatCurrency } from '@/lib/ucs-pricing-service';
import { useEffect, useState } from 'react';
import { TreePine, LandPlot, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';

interface IndexCompositionModalProps {
  data: UcsData;
  isOpen: boolean;
  onClose: () => void;
}

const formatPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return (value / total) * 100;
};

const COLORS_PDM = {
    VMAD: 'hsl(var(--chart-1))',
    VUS: 'hsl(var(--chart-2))',
    CRS: 'hsl(var(--chart-3))',
};

const COLORS_VUS = {
    Pecuaria: 'hsl(var(--chart-4))',
    Milho: 'hsl(var(--chart-5))',
    Soja: 'hsl(var(--chart-1))',
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const formattedValue = formatCurrency(payload[0].value, 'BRL');
      return (
        <div className="rounded-lg border bg-background p-2.5 text-sm shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.fill }}/>
            <p className="font-bold text-foreground">{data.name}</p>
          </div>
          <p className="text-muted-foreground pl-4">{`${formattedValue} (${data.percent.toFixed(2)}%)`}</p>
        </div>
      );
    }
    return null;
};


export function IndexCompositionModal({ data, isOpen, onClose }: IndexCompositionModalProps) {
    const { indexValue, components, vusDetails } = data;
    const totalPdm = components.vm + components.vus + components.crs;
    const vusTotal = vusDetails.pecuaria + vusDetails.milho + vusDetails.soja;

    const [formattedIndex, setFormattedIndex] = useState('');

    useEffect(() => {
      if (data) {
        setFormattedIndex(formatCurrency(indexValue, 'BRL'));
      }
    }, [data, indexValue]);

    const ucsCompositionData = [
        { name: 'Valor da Madeira (VMAD)', value: components.vm, percent: formatPercentage(components.vm, totalPdm), fill: COLORS_PDM.VMAD, icon: TreePine },
        { name: 'Valor de Uso do Solo (VUS)', value: components.vus, percent: formatPercentage(components.vus, totalPdm), fill: COLORS_PDM.VUS, icon: LandPlot },
        { name: 'Custo Socioambiental (CRS)', value: components.crs, percent: formatPercentage(components.crs, totalPdm), fill: COLORS_PDM.CRS, icon: Droplets },
    ];
    
    const vusCompositionData = [
        { name: 'Pecuária', value: vusDetails.pecuaria, percent: formatPercentage(vusDetails.pecuaria, vusTotal), fill: COLORS_VUS.Pecuaria },
        { name: 'Milho', value: vusDetails.milho, percent: formatPercentage(vusDetails.milho, vusTotal), fill: COLORS_VUS.Milho },
        { name: 'Soja', value: vusDetails.soja, percent: formatPercentage(vusDetails.soja, vusTotal), fill: COLORS_VUS.Soja },
    ];

    const DetailItem = ({ label, value, percent, icon: Icon, colorClass }: { label: string; value: number; percent: number; icon?: React.ElementType; colorClass?: string }) => (
        <div>
            <div className="flex justify-between items-center mb-1.5 text-sm">
                <div className="flex items-center gap-2 font-medium text-muted-foreground">
                    {Icon && <Icon className={cn("h-4 w-4", colorClass)} />}
                    <span>{label}</span>
                </div>
                <div className="font-semibold text-foreground">{formatCurrency(value, 'BRL')}</div>
            </div>
            <div className="flex items-center gap-3">
                <Progress value={percent} className="h-1.5 flex-1" indicatorClassName={colorClass} />
                <span className="text-xs font-mono text-muted-foreground w-12 text-right">{percent.toFixed(1)}%</span>
            </div>
        </div>
    );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="text-xl sm:text-2xl">Composição do Índice UCS</DialogTitle>
            <DialogDescription>
                Análise detalhada dos componentes que formam o valor do índice.
            </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1">
            <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Coluna de Detalhes (Esquerda) */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <h3 className="text-sm font-medium text-muted-foreground">Valor Final do Índice UCS</h3>
                        <p className="text-4xl font-bold text-primary tracking-tight">{formattedIndex}</p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold">Componentes do PDM</h4>
                        {ucsCompositionData.map(item => (
                            <DetailItem
                                key={item.name}
                                label={item.name}
                                value={item.value}
                                percent={item.percent}
                                icon={item.icon}
                                colorClass={
                                    item.name.includes('VMAD') ? 'bg-chart-1' :
                                    item.name.includes('VUS') ? 'bg-chart-2' : 'bg-chart-3'
                                }
                            />
                        ))}
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-semibold">Detalhes do VUS (Valor de Uso do Solo)</h4>
                        {vusCompositionData.map(item => (
                           <DetailItem
                                key={item.name}
                                label={item.name}
                                value={item.value}
                                percent={item.percent}
                                colorClass={
                                    item.name.includes('Pecuária') ? 'bg-chart-4' :
                                    item.name.includes('Milho') ? 'bg-chart-5' : 'bg-chart-1'
                                }
                            />
                        ))}
                    </div>
                </div>
                
                {/* Coluna de Gráficos (Direita) */}
                <div className="lg:col-span-2 flex flex-col gap-4 min-h-[250px] lg:min-h-0">
                    <div className="flex-1 w-full h-full">
                        <h4 className="text-center font-semibold text-muted-foreground mb-2 text-sm">Composição PDM</h4>
                         <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Tooltip content={<CustomTooltip />} />
                                <Pie data={ucsCompositionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} stroke="hsl(var(--background))" strokeWidth={2}>
                                    {ucsCompositionData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                     <div className="flex-1 w-full h-full pt-4 border-t">
                        <h4 className="text-center font-semibold text-muted-foreground mb-2 text-sm">Composição VUS</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Tooltip content={<CustomTooltip />} />
                                <Pie data={vusCompositionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} stroke="hsl(var(--background))" strokeWidth={2}>
                                    {vusCompositionData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
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
