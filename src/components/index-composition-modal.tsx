
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
    VUS: 'hsl(var(--chart-1))',
    VMAD: 'hsl(var(--chart-3))',
    CRS: 'hsl(var(--chart-2))',
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
    const { ucs, pdm, ivp, components } = data;
    
    const pdmCompositionData = [
        { name: 'vUS', value: components.vus, percent: pdm > 0 ? (components.vus / pdm) * 100 : 0, fill: COLORS_PDM.VUS },
        { name: 'vMAD', value: components.vmad, percent: pdm > 0 ? (components.vmad / pdm) * 100 : 0, fill: COLORS_PDM.VMAD },
        { name: 'cRS', value: components.crs, percent: pdm > 0 ? (components.crs / pdm) * 100 : 0, fill: COLORS_PDM.CRS },
    ].filter(item => item.value > 0);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0">
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
                                Unidade de Crédito de Sustentabilidade (UCS)
                            </CardTitle>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-mono text-xs">UCS = IVP * Fator_UCS (7%)</p>
                          </TooltipContent>
                      </UiTooltip>
                    </TooltipProvider>
                </CardHeader>
                <CardContent className="-mt-4">
                    <p className="text-4xl sm:text-5xl font-bold text-primary tracking-tight">{formatCurrency(ucs, 'BRL')}</p>
                </CardContent>
            </Card>

            <div>
                <h3 className="text-lg font-semibold mb-3">KPIs da Fórmula</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    <StatCard title="Índice de Viabilidade (IVP)" value={ivp.toFixed(4)} icon={Target} tooltipText="IVP = PDM / Preço_Carbono"/>
                    <StatCard title="PDM Total" value={formatCurrency(pdm, 'BRL')} icon={Package} tooltipText="PDM = vUS + vMAD + cRS"/>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Detalhamento do PDM</CardTitle>
                        <CardDescription>Distribuição dos componentes que formam o Potencial Desflorestador Monetizado.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="order-2 md:order-1">
                            <DetailListItem label="Valor de Uso da Terra (vUS)" value={formatCurrency(components.vus, 'BRL')} colorClass="bg-chart-1" tooltipText="((Preço_Boi*18) + (Preço_Milho*7.2) + (Preço_Soja*3.3)) * 35%"/>
                            <DetailListItem label="Valor da Madeira (vMAD)" value={formatCurrency(components.vmad, 'BRL')} colorClass="bg-chart-3" tooltipText="Preço_Madeira_m³ * 120"/>
                            <DetailListItem label="Custo Socioambiental (cRS)" value={formatCurrency(components.crs, 'BRL')} colorClass="bg-chart-2" tooltipText="(Preço_Carbono * Param) + (Preço_Água * Param)"/>
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
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
