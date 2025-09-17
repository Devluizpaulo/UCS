
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFormulaParameters } from '@/lib/formula-service'; 
import { Separator } from '@/components/ui/separator';

interface IndexCompositionModalProps {
  data: UcsData;
  isOpen: boolean;
  onClose: () => void;
}

const COLORS_PDM = {
    VMAD: 'hsl(var(--chart-1))', // Green
    VUS: 'hsl(var(--chart-3))',  // Lighter Green
    CRS: 'hsl(var(--chart-2))',  // Muted/Gray
};

const COLORS_VUS = {
    Pecuaria: 'hsl(var(--chart-4))', // Light gray/accent
    Milho: 'hsl(var(--chart-5))',    // Darker gray
    Soja: 'hsl(var(--chart-1))',     // Green (matches VMAD for consistency)
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const formattedValue = formatCurrency(payload[0].value, 'BRL');
      return (
        <div className="rounded-lg border bg-background/90 backdrop-blur-sm p-2.5 text-sm shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.fill }}/>
            <p className="font-bold text-foreground">{data.name}</p>
          </div>
          <p className="text-muted-foreground pl-4">{`${formattedValue} (${data.percent.toFixed(1)}%)`}</p>
        </div>
      );
    }
    return null;
};

const StatCard = ({ title, value, subtext, icon: Icon }: { title:string; value: string; subtext?: string; icon: React.ElementType }) => (
    <div className="flex-1 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </div>
);

const DetailListItem = ({ label, value, colorClass }: { label: string; value: string; colorClass: string; }) => (
    <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", colorClass)} />
            <span className="text-muted-foreground">{label}</span>
        </div>
        <span className="font-medium text-foreground">{value}</span>
    </div>
);


export function IndexCompositionModal({ data, isOpen, onClose }: IndexCompositionModalProps) {
    const { indexValue, components, vusDetails } = data;
    const [params, setParams] = useState<Partial<FormulaParameters>>({});
    
    const totalPdm = components.vm + components.vus + components.crs;
    const vusTotal = vusDetails.pecuaria + vusDetails.milho + vusDetails.soja;

    const carbonoEstocado = (params.produtividade_carbono || 0) * (params.area_total || 0);
    const pdmPorCarbono = carbonoEstocado > 0 ? totalPdm / carbonoEstocado : 0;
    const ivp = pdmPorCarbono / 2;

    const ucsCompositionData = [
        { name: 'VMAD', value: components.vm, percent: totalPdm > 0 ? (components.vm / totalPdm) * 100 : 0, fill: COLORS_PDM.VMAD },
        { name: 'VUS', value: components.vus, percent: totalPdm > 0 ? (components.vus / totalPdm) * 100 : 0, fill: COLORS_PDM.VUS },
        { name: 'CRS', value: components.crs, percent: totalPdm > 0 ? (components.crs / totalPdm) * 100 : 0, fill: COLORS_PDM.CRS },
    ];
    
    const vusCompositionData = [
        { name: 'Pecuária', value: vusDetails.pecuaria, percent: vusTotal > 0 ? (vusDetails.pecuaria / vusTotal) * 100 : 0, fill: COLORS_VUS.Pecuaria },
        { name: 'Milho', value: vusDetails.milho, percent: vusTotal > 0 ? (vusDetails.milho / vusTotal) * 100 : 0, fill: COLORS_VUS.Milho },
        { name: 'Soja', value: vusDetails.soja, percent: vusTotal > 0 ? (vusDetails.soja / vusTotal) * 100 : 0, fill: COLORS_VUS.Soja },
    ];

    useEffect(() => {
      if (isOpen) {
        getFormulaParameters().then(setParams);
      }
    }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
            <DialogTitle className="text-xl sm:text-2xl">Composição do Índice UCS</DialogTitle>
            <DialogDescription>
                Análise detalhada dos componentes e KPIs que formam o valor do índice.
            </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground text-center">
                        Valor Final do Índice UCS
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center -mt-4">
                    <p className="text-4xl font-bold text-primary tracking-tight">{formatCurrency(indexValue, 'BRL')}</p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title="PDM / Carbono" value={`${formatCurrency(pdmPorCarbono, 'BRL')}/tCO₂e`} icon={Divide} subtext="Relação desmatamento/estoque" />
                <StatCard title="IVP (Viabilidade)" value={formatCurrency(ivp, 'BRL')} icon={Target} subtext="Índice pré-multiplicador" />
                <StatCard title="Fator Multiplicador" value={`${params.fator_ucs?.toFixed(2) || '1.00'}x`} icon={Wand} subtext="Ajuste final do índice"/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Composição do PDM (Potencial Desflorestador)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <DetailListItem label="Valor da Madeira (VMAD)" value={formatCurrency(components.vm, 'BRL')} colorClass="bg-chart-1" />
                            <DetailListItem label="Valor de Uso do Solo (VUS)" value={formatCurrency(components.vus, 'BRL')} colorClass="bg-chart-3" />
                            <DetailListItem label="Custo Socioambiental (CRS)" value={formatCurrency(components.crs, 'BRL')} colorClass="bg-chart-2" />
                            <Separator className="my-3"/>
                            <div className="flex items-center justify-between text-sm font-bold">
                                <span>Total PDM</span>
                                <span>{formatCurrency(totalPdm, 'BRL')}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                         <CardHeader>
                            <CardTitle>Detalhes do VUS (Valor de Uso do Solo)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <DetailListItem label="Pecuária" value={formatCurrency(vusDetails.pecuaria, 'BRL')} colorClass="bg-chart-4" />
                            <DetailListItem label="Milho" value={formatCurrency(vusDetails.milho, 'BRL')} colorClass="bg-chart-5" />
                            <DetailListItem label="Soja" value={formatCurrency(vusDetails.soja, 'BRL')} colorClass="bg-chart-1" />
                        </CardContent>
                    </Card>
                </div>
                
                <div className="flex flex-col gap-6">
                     <Card className="flex-1 flex flex-col items-center justify-center p-4 min-h-[250px]">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Composição do PDM</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }}/>
                                <Pie data={ucsCompositionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="hsl(var(--background))" strokeWidth={3}>
                                    {ucsCompositionData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                     <Card className="flex-1 flex flex-col items-center justify-center p-4 min-h-[250px]">
                         <p className="text-sm font-medium text-muted-foreground mb-2">Composição do VUS</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }}/>
                                <Pie data={vusCompositionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="hsl(var(--background))" strokeWidth={3}>
                                    {vusCompositionData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            </div>
        </div>

        <DialogFooter className="p-4 border-t sticky bottom-0 bg-background z-10">
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

