
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as ModalDescription,
} from '@/components/ui/dialog';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { UcsData, FormulaParameters } from '@/lib/types';
import { formatCurrency } from '@/lib/ucs-pricing-service';
import { useEffect, useState } from 'react';
import { Package, Leaf, Target, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getFormulaParameters } from '@/lib/formula-service';
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface IndexCompositionModalProps {
  data: UcsData;
  isOpen: boolean;
  onClose: () => void;
}

const COLORS_PDM = {
    VMAD: 'hsl(var(--chart-1))',
    VUS: 'hsl(var(--chart-3))',
    CRS: 'hsl(var(--chart-2))',
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

const StatCard = ({ title, value, subtext, icon: Icon, tooltipText }: { title:string; value: string; subtext?: string; icon: React.ElementType, tooltipText?: string }) => (
    <div className="flex-1 rounded-lg border bg-card p-4 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
                <TooltipProvider>
                    <UiTooltip>
                        <TooltipTrigger asChild>
                             <p className="text-sm font-medium text-muted-foreground cursor-help underline decoration-dashed">{title}</p>
                        </TooltipTrigger>
                        {tooltipText && (
                            <TooltipContent>
                                <p className="font-mono text-xs">{tooltipText}</p>
                            </TooltipContent>
                        )}
                    </UiTooltip>
                </TooltipProvider>
            </div>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </div>
);


const DetailListItem = ({ label, value, colorClass, tooltipText }: { label: string; value: string; colorClass: string; tooltipText?: string; }) => (
    <div className="flex items-center justify-between text-sm py-1.5">
        <div className="flex items-center gap-2">
            <div className={cn("h-2.5 w-2.5 rounded-full", colorClass)} />
            <TooltipProvider>
                <UiTooltip>
                    <TooltipTrigger asChild>
                         <span className="text-muted-foreground cursor-help underline decoration-dashed">{label}</span>
                    </TooltipTrigger>
                    {tooltipText && (
                        <TooltipContent>
                            <p className="font-mono text-xs">{tooltipText}</p>
                        </TooltipContent>
                    )}
                </UiTooltip>
            </TooltipProvider>
        </div>
        <span className="font-medium text-foreground font-mono">{value}</span>
    </div>
);


export function IndexCompositionModal({ data, isOpen, onClose }: IndexCompositionModalProps) {
    const { ucsCF, ucsASE, ivp, components, vusDetails } = data;
    const [params, setParams] = useState<Partial<FormulaParameters>>({});
    
    useEffect(() => {
      if (isOpen) {
        getFormulaParameters().then(setParams);
      }
    }, [isOpen]);
    
    const totalPdm = components.vm + components.vus + components.crs;
    const vusTotal = vusDetails.pecuaria + vusDetails.milho + vusDetails.soja;

    const carbonoEstocado = (params.produtividade_carbono || 0) * (params.area_total || 0);

    const pdmCompositionData = [
        { name: 'VMAD', value: components.vm, percent: totalPdm > 0 ? (components.vm / totalPdm) * 100 : 0, fill: COLORS_PDM.VMAD },
        { name: 'VUS', value: components.vus, percent: totalPdm > 0 ? (components.vus / totalPdm) * 100 : 0, fill: COLORS_PDM.VUS },
        { name: 'CRS', value: components.crs, percent: totalPdm > 0 ? (components.crs / totalPdm) * 100 : 0, fill: COLORS_PDM.CRS },
    ].filter(item => item.value > 0);
    
    const vusCompositionData = [
        { name: 'Pecuária', value: vusDetails.pecuaria, percent: vusTotal > 0 ? (vusDetails.pecuaria / vusTotal) * 100 : 0, fill: COLORS_VUS.Pecuaria },
        { name: 'Milho', value: vusDetails.milho, percent: vusTotal > 0 ? (vusDetails.milho / vusTotal) * 100 : 0, fill: COLORS_VUS.Milho },
        { name: 'Soja', value: vusDetails.soja, percent: vusTotal > 0 ? (vusDetails.soja / vusTotal) * 100 : 0, fill: COLORS_VUS.Soja },
    ].filter(item => item.value > 0);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
            <DialogTitle className="text-xl sm:text-2xl">Relatório Analítico da Composição do Índice UCS</DialogTitle>
            <ModalDescription>
                Análise detalhada dos componentes e KPIs que formam o valor final do índice.
            </ModalDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
             <Card className="text-center bg-muted/30">
                <CardHeader>
                    <TooltipProvider>
                      <UiTooltip>
                          <TooltipTrigger>
                            <CardTitle className="text-sm font-medium text-muted-foreground cursor-help underline decoration-dashed">
                                Valor Final (UCS Crédito de Floresta)
                            </CardTitle>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-mono text-xs">UCS CF = IVP / 2</p>
                          </TooltipContent>
                      </UiTooltip>
                    </TooltipProvider>
                </CardHeader>
                <CardContent className="-mt-4">
                    <p className="text-4xl sm:text-5xl font-bold text-primary tracking-tight">{formatCurrency(ucsCF, 'BRL')}</p>
                </CardContent>
            </Card>

            <div>
                <h3 className="text-lg font-semibold mb-3">KPIs da Fórmula</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="UCS ASE" value={formatCurrency(ucsASE, 'BRL')} icon={TrendingUp} tooltipText="UCS ASE = UCS CF * 2"/>
                    <StatCard title="Insumo UCS (IVP)" value={formatCurrency(ivp, 'BRL')} icon={Target} tooltipText="IVP = PDM / CE"/>
                    <StatCard title="PDM Total" value={formatCurrency(totalPdm, 'BRL')} icon={Package} tooltipText="PDM = VMAD + VUS + CRS"/>
                    <StatCard title="Carbono Estocado (CE)" value={`${carbonoEstocado.toLocaleString('pt-BR')} tCO₂e`} icon={Leaf} tooltipText="CE = Prod. Carbono * Área Total"/>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Detalhamento do PDM</CardTitle>
                        <CardDescription>Distribuição dos componentes que formam o Potencial Desflorestador Monetizado.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="order-2 md:order-1">
                            <DetailListItem label="Valor da Madeira (VMAD)" value={formatCurrency(components.vm, 'BRL')} colorClass="bg-chart-1" tooltipText="VMAD = Renda Madeira/ha * Área Total"/>
                            <DetailListItem label="Uso do Solo (VUS)" value={formatCurrency(components.vus, 'BRL')} colorClass="bg-chart-3" tooltipText="VUS = (Renda Ponderada/ha * Fator Arrend.) * Área"/>
                            <DetailListItem label="Custo Socioambiental (CRS)" value={formatCurrency(components.crs, 'BRL')} colorClass="bg-chart-2" tooltipText="CRS = Custo Carbono + Custo Água"/>
                        </div>
                        <div className="h-48 w-full order-1 md:order-2">
                             <ResponsiveContainer>
                                <PieChart>
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }}/>
                                    <Pie data={pdmCompositionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} stroke="hsl(var(--background))" strokeWidth={3}>
                                        {pdmCompositionData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>Detalhamento do VUS</CardTitle>
                        <CardDescription>Distribuição da renda ponderada pelo uso do solo.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                         <div className="order-2 md:order-1">
                            <DetailListItem label="Pecuária" value={formatCurrency(vusDetails.pecuaria, 'BRL')} colorClass="bg-chart-4" tooltipText="(Renda Pecuária/ha * Peso Pecuária)"/>
                            <DetailListItem label="Milho" value={formatCurrency(vusDetails.milho, 'BRL')} colorClass="bg-chart-5" tooltipText="(Renda Milho/ha * Peso Milho)"/>
                            <DetailListItem label="Soja" value={formatCurrency(vusDetails.soja, 'BRL')} colorClass="bg-chart-1" tooltipText="(Renda Soja/ha * Peso Soja)"/>
                        </div>
                        <div className="h-48 w-full order-1 md:order-2">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }}/>
                                    <Pie data={vusCompositionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} stroke="hsl(var(--background))" strokeWidth={3}>
                                        {vusCompositionData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
