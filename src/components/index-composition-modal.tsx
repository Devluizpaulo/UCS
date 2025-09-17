
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { UcsData, FormulaParameters } from '@/lib/types';
import { formatCurrency } from '@/lib/ucs-pricing-service';
import { useEffect, useState } from 'react';
import { TreePine, LandPlot, Droplets, Divide, Target, Wand } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from './ui/separator';
import { getFormulaParameters } from '@/lib/formula-service'; 

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
    const [params, setParams] = useState<Partial<FormulaParameters>>({});
    
    const totalPdm = components.vm + components.vus + components.crs;
    const carbonoEstocado = (params.produtividade_carbono || 0) * (params.area_total || 0);
    const ivp = carbonoEstocado > 0 ? (totalPdm / carbonoEstocado) / 2 : 0;
    const pdmPorCarbono = carbonoEstocado > 0 ? totalPdm / carbonoEstocado : 0;

    const vusTotal = vusDetails.pecuaria + vusDetails.milho + vusDetails.soja;

    const [formattedIndex, setFormattedIndex] = useState('');

    useEffect(() => {
      if (isOpen) {
        const fetchParams = async () => {
          const fetchedParams = await getFormulaParameters();
          setParams(fetchedParams);
        }
        fetchParams();
      }
      if (data) {
        setFormattedIndex(formatCurrency(indexValue, 'BRL'));
      }
    }, [data, indexValue, isOpen]);

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
            <div className="flex justify-between items-center mb-1 text-xs">
                <div className="flex items-center gap-2 font-medium text-muted-foreground">
                    {Icon && <Icon className={cn("h-4 w-4", colorClass)} />}
                    <span>{label}</span>
                </div>
                <div className="font-semibold text-foreground">{formatCurrency(value, 'BRL')}</div>
            </div>
            <div className="flex items-center gap-2">
                <Progress value={percent} className="h-1 flex-1" indicatorClassName={colorClass} />
                <span className="text-xs font-mono text-muted-foreground w-10 text-right">{percent.toFixed(0)}%</span>
            </div>
        </div>
    );
    
    const KpiCard = ({ title, value, icon: Icon, subtext }: { title:string; value: string; icon: React.ElementType; subtext?: string }) => (
        <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3 flex-1">
            <Icon className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
                <p className="text-xs text-muted-foreground">{title}</p>
                <p className="text-base font-bold text-foreground">{value}</p>
                {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
            </div>
        </div>
    );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] w-[95vw] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
            <DialogTitle className="text-xl sm:text-2xl">Composição do Índice UCS</DialogTitle>
            <DialogDescription>
                Análise detalhada dos componentes e KPIs que formam o valor do índice.
            </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground text-center">
                            Valor Final do Índice UCS
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center -mt-4">
                        <p className="text-4xl font-bold text-primary tracking-tight">{formattedIndex}</p>
                    </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-3">
                    <KpiCard title="PDM / Carbono" value={`${formatCurrency(pdmPorCarbono, 'BRL')}/tCO₂`} icon={Divide} subtext="Relação desmatamento/estoque" />
                    <KpiCard title="IVP" value={formatCurrency(ivp, 'BRL')} icon={Target} subtext="Índice de Viabilidade" />
                    <KpiCard title="Fator Multiplicador" value={`${params.fator_ucs?.toFixed(2) || '1.00'}x`} icon={Wand} subtext="Ajuste final do índice"/>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <Card className="w-full">
                         <CardHeader>
                            <CardTitle>Análise de Componentes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <h4 className="text-sm font-semibold text-muted-foreground">Composição do PDM</h4>
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
                            <Separator className="my-4"/>
                            <h4 className="text-sm font-semibold text-muted-foreground">Detalhes do VUS</h4>
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
                        </CardContent>
                    </Card>
                    
                    <div className="flex flex-col gap-6 min-h-[250px]">
                        <Card className="flex-1 flex flex-col">
                           <CardHeader className="py-3">
                               <CardTitle className="text-center text-sm font-medium">Composição PDM</CardTitle>
                           </CardHeader>
                           <CardContent className="flex-1 flex items-center justify-center -mt-4">
                                <ResponsiveContainer width="100%" height={150}>
                                    <PieChart>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Pie data={ucsCompositionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} stroke="hsl(var(--background))" strokeWidth={2}>
                                            {ucsCompositionData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                           </CardContent>
                        </Card>
                        <Card className="flex-1 flex flex-col">
                           <CardHeader className="py-3">
                               <CardTitle className="text-center text-sm font-medium">Composição VUS</CardTitle>
                           </CardHeader>
                           <CardContent className="flex-1 flex items-center justify-center -mt-4">
                               <ResponsiveContainer width="100%" height={150}>
                                    <PieChart>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Pie data={vusCompositionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} stroke="hsl(var(--background))" strokeWidth={2}>
                                            {vusCompositionData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                           </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
        <DialogFooter className="p-6 pt-4 border-t sticky bottom-0 bg-background z-10">
          {/* Footer content can go here if needed */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

