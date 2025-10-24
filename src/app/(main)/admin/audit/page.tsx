
'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Loader2, Save, ExternalLink, Edit, Search, Filter, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Zap, RefreshCw, Calendar, Activity, BarChart3 } from 'lucide-react';
import { getCommodityPricesByDate } from '@/lib/data-service';
import type { CommodityPriceData } from '@/lib/types';
import * as Calc from '@/lib/calculation-service';
import { triggerN8NRecalculation } from '@/lib/n8n-actions'; // Import the N8N action
import { 
  executeAdvancedRecalculation, 
  type RecalculationProgress as AdvancedRecalculationProgress 
} from '@/lib/advanced-recalculation-service';
import { 
  calculateAffectedAssets, 
  estimateRecalculationTime,
  getAssetDependency 
} from '@/lib/dependency-service';
import { updateCalculatedValuesDirectly } from '@/lib/direct-update-service';
import { isValid, parseISO, format } from 'date-fns';
import { DateNavigator } from '@/components/date-navigator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import { AssetActions } from '@/components/admin/asset-actions';
import { AssetEditModal } from '@/components/admin/asset-edit-modal';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuditHistory, type AuditLogEntry } from '@/components/admin/audit-history';
import { getAuditLogsForDate } from '@/lib/audit-log-service';
import { RecalculationProgress, type RecalculationStep } from '@/components/admin/recalculation-progress';
import { ValidationAlerts, generateValidationAlerts, type ValidationAlert } from '@/components/admin/validation-alerts';
import { DateComparison } from '@/components/admin/date-comparison';
import { AuditExport } from '@/components/admin/audit-export';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


function getValidatedDate(dateString?: string | null): Date {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return new Date();
}

function getAssetStatus(asset: CommodityPriceData, editedValues: Record<string, number>) {
  if (editedValues[asset.id] !== undefined) {
    return 'edited';
  }
  if (asset.price === 0) {
    return 'zero';
  }
  const calculatedCategories = ['index', 'sub-index', 'vus', 'vmad', 'crs'];
  if (calculatedCategories.includes(asset.category)) {
      return 'calculated';
  }
  return 'normal';
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'edited':
      return <Edit className="h-4 w-4 text-yellow-600" />;
    case 'zero':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case 'calculated':
      return <CheckCircle className="h-4 w-4 text-blue-600" />;
    default:
      return <CheckCircle className="h-4 w-4 text-green-600" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'edited':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Editado</Badge>;
    case 'zero':
      return <Badge variant="destructive">Valor Zero</Badge>;
    case 'calculated':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700">Calculado</Badge>;
    default:
      return <Badge variant="default" className="bg-green-100 text-green-800">Normal</Badge>;
  }
}

const AssetActionTable = ({ 
    assets, 
    onEdit, 
    editedValues,
    onInlineChange,
    onRevert,
    onSort,
    sortKey,
    sortDir,
}: { 
    assets: (CommodityPriceData & { rentMediaCalculada?: number })[];
    onEdit: (asset: CommodityPriceData) => void;
    editedValues: Record<string, number>;
    onInlineChange: (assetId: string, value: number) => void;
    onRevert: (assetId: string) => void;
    onSort: (key: 'name' | 'id' | 'price' | 'change' | 'status') => void;
    sortKey: 'name' | 'id' | 'price' | 'change' | 'status';
    sortDir: 'asc' | 'desc';
}) => {
  if (assets.length === 0) {
    const onSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
      <div className="text-center text-sm text-muted-foreground p-4">
        Nenhum ativo nesta categoria.
      </div>
    );
  }

  const hasRentMedia = assets.some(a => a.rentMediaCalculada !== undefined);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const startEdit = (asset: CommodityPriceData) => {
    setEditingId(asset.id);
    setInputValue(String(editedValues[asset.id] ?? asset.price));
    setErrorMsg('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setInputValue('');
    setErrorMsg('');
  };

  const parseNumber = (s: string) => {
    if (typeof s !== 'string') return NaN;
    const v = s.replace(/\./g, '').replace(',', '.');
    return Number(v);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>
            <button className="flex items-center gap-1" onClick={() => onSort('name')}>
              Ativo {sortKey==='name' ? (sortDir==='asc'?'▲':'▼') : ''}
            </button>
          </TableHead>
          <TableHead className="text-right">
            <button className="flex items-center gap-1 ml-auto" onClick={() => onSort('price')}>
              Valor {sortKey==='price' ? (sortDir==='asc'?'▲':'▼') : ''}
            </button>
          </TableHead>
          {hasRentMedia && <TableHead className="text-right">Rentabilidade Média</TableHead>}
          <TableHead className="text-center w-[200px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => {
          const status = getAssetStatus(asset, editedValues);
          return (
          <TableRow 
            key={asset.id} 
            className={cn(editedValues[asset.id] !== undefined && 'bg-yellow-500/10 hover:bg-yellow-500/20')}
          >
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  {getStatusBadge(status)}
                </div>
              </TableCell>
            <TableCell className="font-medium">{asset.name}</TableCell>
            <TableCell className="text-right font-mono">
              {editingId === asset.id ? (
                <div className="flex items-center justify-end gap-2">
                  <input
                    className="w-32 border rounded px-2 py-1 text-right font-mono"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      const num = parseNumber(e.target.value);
                      if (isNaN(num) || num < 0) setErrorMsg('Valor inválido'); else setErrorMsg('');
                    }}
                    placeholder="0,00"
                  />
                </div>
              ) : (
                <span>{formatCurrency(editedValues[asset.id] ?? asset.price, asset.currency, asset.id)}</span>
              )}
              {editingId === asset.id && errorMsg && (
                <div className="text-xs text-red-600 mt-1">{errorMsg}</div>
              )}
            </TableCell>
            {hasRentMedia && (
                <TableCell className="text-right font-mono">
                    {asset.rentMediaCalculada !== undefined 
                        ? formatCurrency(asset.rentMediaCalculada, 'BRL', 'rentabilidade') 
                        : 'N/A'
                    }
                </TableCell>
            )}
            <TableCell className="flex justify-center gap-2">
                {editingId === asset.id ? (
                  <>
                    <Button size="sm" disabled={!!errorMsg} onClick={() => {
                      const num = parseNumber(inputValue);
                      if (isNaN(num) || num < 0) return;
                      onInlineChange(asset.id, num);
                      cancelEdit();
                    }}>Salvar</Button>
                    <Button size="sm" variant="outline" onClick={() => { onRevert(asset.id); cancelEdit(); }}>Reverter</Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancelar</Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <AssetActions asset={asset} onEdit={onEdit} />
                    <Button size="sm" variant="secondary" onClick={() => startEdit(asset)}>Editar</Button>
                    {editedValues[asset.id] !== undefined && (
                      <Button size="sm" variant="outline" onClick={() => onRevert(asset.id)}>Voltar ao original</Button>
                    )}
                  </div>
                )}
            </TableCell>
          </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

const IndexTable = ({ indices, editedValues }: { indices: CommodityPriceData[], editedValues: Record<string, number> }) => {
  if (indices.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground p-4">
        Nenhum índice nesta categoria.
      </div>
    );
  }

  const getAsset = (id: string) => indices.find(i => i.id === id);

  const valorUsoSolo = getAsset('valor_uso_solo');
  const valorUsoSoloSubIndices = ['vus', 'vmad', 'carbono_crs', 'Agua_CRS']
    .map(getAsset)
    .filter((a): a is CommodityPriceData => !!a);

  const ch2oAgua = getAsset('ch2o_agua');
  const custoAgua = getAsset('custo_agua');
  
  const pdm = getAsset('pdm');
  const ucs = getAsset('ucs');
  const ucsAse = getAsset('ucs_ase');
  
  const pdmHierarchy = [ucs, ucsAse].filter((a): a is CommodityPriceData => !!a);

  const renderIndexRow = (asset: CommodityPriceData, indent: string, badge?: React.ReactNode) => (
    <TableRow key={asset.id}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {indent && <span className="text-muted-foreground">{indent}</span>}
          <span>{asset.name}</span>
          {badge}
        </div>
      </TableCell>
      <TableCell className="text-right font-mono">{formatCurrency(asset.price, asset.currency, asset.id)}</TableCell>
      <TableCell className="text-right">
        <Badge variant="outline" className={cn(
          asset.change > 0 && "text-green-600 bg-green-50",
          asset.change < 0 && "text-red-600 bg-red-50",
        )}>
          {asset.change ? `${asset.change.toFixed(2)}%` : 'N/A'}
        </Badge>
      </TableCell>
      <TableCell className="flex justify-center">
        <AssetActions asset={asset} onEdit={() => {}} />
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <Table>
        <TableBody>
          {ch2oAgua && renderIndexRow(ch2oAgua, '')}
          {custoAgua && renderIndexRow(custoAgua, '')}
        </TableBody>
      </Table>
      <Accordion type="multiple" defaultValue={['valor_uso_solo', 'pdm_hierarchy']} className="w-full">
        {/* Grupo Valor Uso Solo */}
        {valorUsoSolo && (
          <AccordionItem value="valor_uso_solo">
            <AccordionTrigger className="hover:no-underline font-semibold text-base px-4 py-3 bg-muted/30 rounded-t-lg">
              <div className="flex justify-between items-center w-full">
                <span className="flex items-center gap-2">{valorUsoSolo.name}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-lg">{formatCurrency(valorUsoSolo.price, valorUsoSolo.currency, valorUsoSolo.id)}</span>
                  <Badge variant="outline" className={cn(
                    valorUsoSolo.change > 0 && "text-green-600 bg-green-50",
                    valorUsoSolo.change < 0 && "text-red-600 bg-red-50",
                  )}>
                    {valorUsoSolo.change ? `${valorUsoSolo.change.toFixed(2)}%` : 'N/A'}
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableBody>
                  {valorUsoSoloSubIndices.map(subIndex =>
                    renderIndexRow(subIndex, '└─', <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Sub-índice</Badge>)
                  )}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        )}
        
        {/* Grupo PDM, UCS, UCS ASE */}
        {pdm && (
          <AccordionItem value="pdm_hierarchy">
            <AccordionTrigger className="hover:no-underline font-semibold text-base px-4 py-3 bg-muted/30">
              <div className="flex justify-between items-center w-full">
                <span className="flex items-center gap-2">{pdm.name}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-lg">{formatCurrency(pdm.price, pdm.currency, pdm.id)}</span>
                  <Badge variant="outline" className={cn(
                    pdm.change > 0 && "text-green-600 bg-green-50",
                    pdm.change < 0 && "text-red-600 bg-red-50",
                  )}>
                    {pdm.change ? `${pdm.change.toFixed(2)}%` : 'N/A'}
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableBody>
                  {pdmHierarchy.map(item =>
                    renderIndexRow(
                      item,
                      item.id === 'ucs' ? '├─' : '└─',
                      item.id === 'ucs'
                        ? <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Base UCS</Badge>
                        : <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">Índice Final</Badge>
                    )
                  )}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </>
  );
};


export default function AuditPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const { toast } = useToast();

  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [data, setData] = useState<CommodityPriceData[]>([]);
  const [originalData, setOriginalData] = useState<Map<string, CommodityPriceData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [editingAsset, setEditingAsset] = useState<CommodityPriceData | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<'name' | 'id' | 'price' | 'change' | 'status'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  // Paginação
  const [basePage, setBasePage] = useState(1);
  const [basePageSize, setBasePageSize] = useState(50);
  const [idxPage, setIdxPage] = useState(1);
  const [idxPageSize, setIdxPageSize] = useState(50);
  
  // Estados para histórico de auditoria
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  
  // Estados para progresso de recálculo
  const [recalculationSteps, setRecalculationSteps] = useState<RecalculationStep[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [recalculationProgress, setRecalculationProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  
  // Estados para alertas de validação
  const [validationAlerts, setValidationAlerts] = useState<ValidationAlert[]>([]);
  
  // Estados para recálculo avançado
  const [useAdvancedRecalculation, setUseAdvancedRecalculation] = useState<boolean | null>(null);
  const [showDependencyInfo, setShowDependencyInfo] = useState(false);

  // Debounce para busca
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Persistir filtros/ordenação no localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('auditPrefs');
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.searchTerm === 'string') setSearchTerm(p.searchTerm);
        if (typeof p.categoryFilter === 'string') setCategoryFilter(p.categoryFilter);
        if (typeof p.statusFilter === 'string') setStatusFilter(p.statusFilter);
        if (typeof p.sortKey === 'string') setSortKey(p.sortKey);
        if (typeof p.sortDir === 'string') setSortDir(p.sortDir);
        if (typeof p.basePageSize === 'number') setBasePageSize(p.basePageSize);
        if (typeof p.idxPageSize === 'number') setIdxPageSize(p.idxPageSize);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('auditPrefs', JSON.stringify({
        searchTerm,
        categoryFilter,
        statusFilter,
        sortKey,
        sortDir,
        basePageSize,
        idxPageSize,
      }));
    } catch {}
  }, [searchTerm, categoryFilter, statusFilter, sortKey, sortDir, basePageSize, idxPageSize]);

  // Export CSV util
  const exportToCsv = (rows: any[], filename: string) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(',') , ...rows.map(r => headers.map(h => JSON.stringify((r as any)[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJson = (rows: any[], filename: string) => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const newDate = getValidatedDate(dateParam);
    setTargetDate(newDate);
    setEditedValues({});
    
    setIsLoading(true);
    setIsLoadingLogs(true);
    
    getCommodityPricesByDate(newDate)
      .then((fetchedData) => {
        const dataMap = new Map(fetchedData.map(item => [item.id, item]));
        setData(fetchedData);
        setOriginalData(dataMap);
        setValidationAlerts(generateValidationAlerts(fetchedData, {}));
      })
      .catch((err) => {
        console.error(err);
        setData([]);
        setOriginalData(new Map());
        setValidationAlerts([]);
      })
      .finally(() => setIsLoading(false));

    getAuditLogsForDate(newDate)
      .then((logs) => {
        setAuditLogs(logs);
      })
      .catch((err) => {
        console.error('Error loading audit logs:', err);
        setAuditLogs([]);
      })
      .finally(() => setIsLoadingLogs(false));
  }, [dateParam]);


  const handleEdit = (asset: CommodityPriceData) => {
    setEditingAsset(asset);
  };
  
  const handleSaveEdit = async (assetId: string, newPrice: number) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newEditedValues = { ...editedValues, [assetId]: newPrice };
    setEditedValues(newEditedValues);
    setEditingAsset(null);

    const updatedData = data.map(asset => 
      asset.id === assetId ? { ...asset, price: newPrice } : asset
    );
    setData(updatedData);
    
    setValidationAlerts(generateValidationAlerts(updatedData, newEditedValues));
    
    toast({
        title: "Valor Alterado",
        description: `O valor de ${assetId} foi atualizado localmente. Clique em 'Salvar e Recalcular' para persistir.`,
    });
  }


  const handleRecalculate = async () => {
    if (Object.keys(editedValues).length === 0) {
      toast({
        title: "Nenhuma alteração",
        description: "Não há valores editados para recalcular.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        // Enviar para N8N Webhook
        const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '';
        const API_KEY = process.env.NEXT_PUBLIC_N8N_AUDIT_API_KEY || '';
        if (!WEBHOOK_URL || !API_KEY) {
          throw new Error('Configuração do N8N ausente: defina NEXT_PUBLIC_N8N_WEBHOOK_URL e NEXT_PUBLIC_N8N_AUDIT_API_KEY');
        }

        const url = `${WEBHOOK_URL}?key=${encodeURIComponent(API_KEY)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-audit-token': API_KEY,
          },
          body: JSON.stringify(n8nPayload),
        });

        if (res.ok) {
          toast({
            title: "Solicitação Enviada",
            description: "O N8N está reprocessando os dados. Atualizando dados em seguida...",
          });
          setEditedValues({});
          setValidationAlerts([]);
          // Poll leve (3 tentativas, 3s intervalo) para atualizar dados/logs
          const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
          for (let attempt = 0; attempt < 3; attempt++) {
            await sleep(3000);
            try {
              const [freshData, freshLogs] = await Promise.all([
                getCommodityPricesByDate(targetDate),
                getAuditLogsForDate(targetDate),
              ]);
              setData(freshData);
              setAuditLogs(freshLogs);
              break;
            } catch {}
          }
        } else {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.msg || `Falha no Webhook (${res.status})`);
        }
      } catch (error: any) {
        toast({
          title: "Erro no Recálculo",
          description: error?.message || "Ocorreu um erro ao contatar o N8N.",
          variant: "destructive",
        });
      }
    });
  };

  const { baseAssets, indices, filteredBaseAssets, filteredIndices } = useMemo(() => {
    const dataWithEdits = data.map(asset => ({
        ...asset,
        price: editedValues[asset.id] ?? asset.price,
    }));
    
    const calculatedAssetIds = new Set(['vus', 'vmad', 'carbono_crs', 'Agua_CRS', 'valor_uso_solo', 'pdm', 'ucs', 'ucs_ase', 'ch2o_agua', 'custo_agua']);
    
    const allBaseAssets = dataWithEdits.filter(asset => !calculatedAssetIds.has(asset.id));
    const calculatedAssets = dataWithEdits.filter(asset => calculatedAssetIds.has(asset.id));
    
    const sortOrder = ['usd', 'eur'];
    allBaseAssets.sort((a, b) => {
      const aIndex = sortOrder.indexOf(a.id);
      const bIndex = sortOrder.indexOf(b.id);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    const dataMap = new Map(dataWithEdits.map(item => [item.id, item.price]));
    const usdPrice = dataMap.get('usd') || 0;
    const eurPrice = dataMap.get('eur') || 0;
    
    const enrichedBaseAssets = allBaseAssets
        .map(asset => {
            let rentMediaCalculada: number | undefined;
            switch(asset.id) {
                case 'soja': rentMediaCalculada = Calc.calculateRentMediaSoja(asset.price, usdPrice); break;
                case 'milho': rentMediaCalculada = Calc.calculateRentMediaMilho(asset.price); break;
                case 'boi_gordo': rentMediaCalculada = Calc.calculateRentMediaBoi(asset.price); break;
                case 'madeira': rentMediaCalculada = Calc.calculateRentMediaMadeira(asset.price, usdPrice); break;
                case 'carbono': rentMediaCalculada = Calc.calculateRentMediaCarbono(asset.price, eurPrice); break;
                default: rentMediaCalculada = undefined;
            }
            return { ...asset, rentMediaCalculada };
        });

    const filterAssets = (assets: typeof enrichedBaseAssets) => {
      return assets.filter(asset => {
        const term = debouncedSearchTerm.trim().toLowerCase();
        const matchesSearch = term === '' || 
          asset.name.toLowerCase().includes(term) ||
          asset.id.toLowerCase().includes(term);
        const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
        const assetStatus = getAssetStatus(asset, editedValues);
        const matchesStatus = statusFilter === 'all' || assetStatus === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
      });
    };

    const filteredBaseAssets = filterAssets(enrichedBaseAssets);
    const filteredIndices = calculatedAssets.filter(asset => {
      const matchesSearch = searchTerm === '' || 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
      const assetStatus = getAssetStatus(asset, editedValues);
      const matchesStatus = statusFilter === 'all' || assetStatus === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sorting
    const toStatus = (a: CommodityPriceData) => getAssetStatus(a, editedValues);
    const dir = sortDir === 'asc' ? 1 : -1;
    const cmp = (a: CommodityPriceData, b: CommodityPriceData) => {
      switch (sortKey) {
        case 'name': return a.name.localeCompare(b.name) * dir;
        case 'id': return a.id.localeCompare(b.id) * dir;
        case 'price': return ((a.price || 0) - (b.price || 0)) * dir;
        case 'change': return ((a.change || 0) - (b.change || 0)) * dir;
        case 'status': return toStatus(a).localeCompare(toStatus(b)) * dir;
        default: return 0;
      }
    };
    filteredBaseAssets.sort(cmp);
    filteredIndices.sort(cmp);

    return { 
      baseAssets: enrichedBaseAssets, 
      indices: calculatedAssets,
      filteredBaseAssets,
      filteredIndices
    };
  }, [data, debouncedSearchTerm, categoryFilter, statusFilter, editedValues, sortKey, sortDir]);

  // Paginação: fatias
  const baseTotalPages = Math.max(1, Math.ceil(filteredBaseAssets.length / basePageSize));
  const idxTotalPages = Math.max(1, Math.ceil(filteredIndices.length / idxPageSize));
  const pagedBaseAssets = filteredBaseAssets.slice((basePage - 1) * basePageSize, basePage * basePageSize);
  const pagedIndices = filteredIndices.slice((idxPage - 1) * idxPageSize, idxPage * idxPageSize);

  useEffect(() => { setBasePage(1); }, [debouncedSearchTerm, categoryFilter, statusFilter, sortKey, sortDir, basePageSize]);
  useEffect(() => { setIdxPage(1); }, [debouncedSearchTerm, categoryFilter, statusFilter, sortKey, sortDir, idxPageSize]);

  const hasEdits = Object.keys(editedValues).length > 0;

  const handleDismissAlert = (alertId: string) => {
    setValidationAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleAcceptSuggestion = (alertId: string, suggestedValue: number) => {
    const alert = validationAlerts.find(a => a.id === alertId);
    if (alert && alert.assetId) {
      const newEditedValues = { ...editedValues, [alert.assetId]: suggestedValue };
      setEditedValues(newEditedValues);
      
      const updatedData = data.map(asset => 
        asset.id === alert.assetId ? { ...asset, price: suggestedValue } : asset
      );
      setData(updatedData);
      
      const newAlerts = generateValidationAlerts(updatedData, newEditedValues);
      setValidationAlerts(newAlerts);
      
      toast({
        title: "Sugestão Aceita",
        description: `O valor de ${alert.assetName} foi atualizado para ${suggestedValue}.`,
      });
    }
  };
  
  const reviewChanges = useMemo(() => {
    return Object.entries(editedValues).map(([id, newValue]) => {
      const originalAsset = originalData.get(id);
      return {
        id,
        name: originalAsset?.name || id,
        oldValue: originalAsset?.price ?? 0,
        newValue,
        currency: originalAsset?.currency ?? 'BRL'
      };
    });
  }, [editedValues, originalData]);

  // Edição inline (escopo AuditPage)
  const handleInlineChange = (assetId: string, value: number) => {
    const newEdited = { ...editedValues, [assetId]: value };
    setEditedValues(newEdited);
    const updatedData = data.map((a) => a.id === assetId ? { ...a, price: value } : a);
    setData(updatedData);
    setValidationAlerts(generateValidationAlerts(updatedData, newEdited));
  };

  const handleRevertInline = (assetId: string) => {
    const copy = { ...editedValues };
    delete copy[assetId];
    setEditedValues(copy);
    const original = originalData.get(assetId);
    if (original) {
      const restored = data.map((a) => a.id === assetId ? { ...a, price: original.price } : a);
      setData(restored);
      setValidationAlerts(generateValidationAlerts(restored, copy));
    }
  };

  const n8nPayload = useMemo(() => {
    const transformedAssets: Record<string, any> = {};
    for (const [key, value] of Object.entries(editedValues)) {
        const newKey = key === 'boi_gordo' ? 'boi' : key;
        transformedAssets[newKey] = { preco: value };
    }
    return {
      origem: 'painel_auditoria',
      data_especifica: format(targetDate, 'yyyy-MM-dd'),
      ativos: transformedAssets,
    };
  }, [editedValues, targetDate]);

  return (
    <>
      <div className="flex min-h-screen w-full flex-col">
        <PageHeader
          title="Auditoria de Dados"
          description="Verifique, corrija e recalcule os dados históricos da plataforma."
          icon={History}
        />
        <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={() => hasEdits ? handleRecalculate() : toast({ title: 'Nenhuma alteração', description: 'Edite algum valor antes de recalcular.', variant: 'destructive' })} className="bg-green-600 hover:bg-green-700">
                        <Save className="mr-2 h-4 w-4" /> Salvar e Recalcular
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Envia alterações para o N8N</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={() => {
                        exportToCsv(
                          [...filteredBaseAssets, ...filteredIndices].map(a => ({ id: a.id, name: a.name, price: a.price, change: a.change, category: a.category })),
                          `auditoria_${format(targetDate, 'yyyyMMdd')}.csv`
                        )
                      }}>
                        <BarChart3 className="mr-2 h-4 w-4" /> Exportar CSV
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Exporta os dados filtrados</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={() => exportToJson(reviewChanges, `alteracoes_${format(targetDate, 'yyyyMMdd')}.json`)}>
                        <FileDown className="mr-2 h-4 w-4" /> Exportar JSON (Alterações)
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Exporta as alterações pendentes</TooltipContent>
                  </Tooltip>
                  <div className="ml-auto flex items-center gap-2">
                    <Badge variant={hasEdits ? 'destructive' : 'secondary'}>{Object.keys(editedValues).length} alterações</Badge>
                    <Button variant="ghost" onClick={() => { setSearchTerm(''); setCategoryFilter('all'); setStatusFilter('all'); }}>Limpar filtros</Button>
                  </div>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Seleção de Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DateNavigator 
                  targetDate={targetDate} 
                />
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Edições pendentes:</span>
                  <Badge variant={hasEdits ? "destructive" : "secondary"} className="font-medium">
                    {Object.keys(editedValues).length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Data selecionada:</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {format(targetDate, 'dd/MM/yyyy')}
                  </Badge>
                </div>
                {isLoading && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Carregando dados...</span>
                  </div>
                )}
                 {hasEdits && (
                  <div className="pt-2">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button disabled={isPending} className="w-full bg-green-600 hover:bg-green-700">
                                <Save className="mr-2 h-4 w-4" />
                                Salvar e Recalcular ({Object.keys(editedValues).length})
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-blue-600" />
                                    Revisar e Confirmar Recálculo via N8N
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Confirme os novos valores que serão enviados ao N8N para o dia <span className="font-bold">{format(targetDate, 'dd/MM/yyyy')}</span>.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                                <div className="p-4 border rounded-lg">
                                  <h3 className="font-semibold mb-2">Alterações a serem enviadas:</h3>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Ativo</TableHead>
                                        <TableHead className="text-right">Valor Anterior</TableHead>
                                        <TableHead className="text-right">Novo Valor</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {reviewChanges.map(change => (
                                        <TableRow key={change.id}>
                                          <TableCell className="font-medium">{change.name}</TableCell>
                                          <TableCell className="text-right font-mono text-muted-foreground line-through">
                                            {formatCurrency(change.oldValue, change.currency, change.id)}
                                          </TableCell>
                                          <TableCell className="text-right font-mono font-bold text-green-600">
                                            {formatCurrency(change.newValue, change.currency, change.id)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                                <div className="p-4 border rounded-lg bg-muted/50">
                                  <h3 className="font-semibold mb-2">Payload para Webhook N8N:</h3>
                                  <pre className="text-xs bg-background p-3 rounded-md overflow-x-auto">
                                    <code>
                                      {JSON.stringify(n8nPayload, null, 2)}
                                    </code>
                                  </pre>
                                </div>
                            </div>

                            <AlertDialogFooter className="mt-4">
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRecalculate} disabled={isPending}>
                                   {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    Confirmar e Enviar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
                <CardTitle className="text-xl font-bold flex items-center gap-3 text-gray-800 dark:text-gray-200">
                    <Filter className="h-6 w-6 text-primary" />
                    Filtros e Busca
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                    Use os filtros abaixo para encontrar ativos específicos ou filtrar por status.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label htmlFor="search" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Buscar Ativo</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="search"
                                placeholder="Digite o nome ou ID do ativo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-primary"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="category-filter" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Categoria</label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-primary">
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as categorias</SelectItem>
                                <SelectItem value="exchange">Moedas</SelectItem>
                                <SelectItem value="agricultural">Commodities</SelectItem>
                                <SelectItem value="material">Materiais</SelectItem>
                                <SelectItem value="index">Índices</SelectItem>
                                <SelectItem value="sub-index">Sub-índices</SelectItem>
                                <SelectItem value="crs">CRS</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="status-filter" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-primary">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="edited">Editado</SelectItem>
                                <SelectItem value="zero">Valor Zero</SelectItem>
                                <SelectItem value="calculated">Calculado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ordenar por</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
                            <SelectTrigger className="border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-primary">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="name">Nome</SelectItem>
                              <SelectItem value="id">ID</SelectItem>
                              <SelectItem value="price">Preço</SelectItem>
                              <SelectItem value="change">Variação</SelectItem>
                              <SelectItem value="status">Status</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={sortDir} onValueChange={(v) => setSortDir(v as any)}>
                            <SelectTrigger className="border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-primary">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asc">Asc</SelectItem>
                              <SelectItem value="desc">Desc</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                    </div>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 flex items-center">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchTerm('');
                            setCategoryFilter('all');
                            setStatusFilter('all');
                          }}
                          className="w-full"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Limpar Filtros
                        </Button>
                    </div>
                    <div className="md:col-span-1 flex items-center">
                      <Button 
                        variant="secondary" 
                        className="w-full"
                        onClick={() => exportToCsv(
                          filteredBaseAssets.map(a => ({ id: a.id, name: a.name, price: a.price, change: a.change, category: a.category })),
                          `ativos_${format(targetDate, 'yyyyMMdd')}.csv`
                        )}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Exportar CSV (Ativos)
                      </Button>
                    </div>
                    <div className="md:col-span-1 flex items-center">
                      <Button 
                        variant="secondary" 
                        className="w-full"
                        onClick={() => exportToCsv(
                          filteredIndices.map(a => ({ id: a.id, name: a.name, price: a.price, change: a.change, category: a.category })),
                          `indices_${format(targetDate, 'yyyyMMdd')}.csv`
                        )}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Exportar CSV (Índices)
                      </Button>
                    </div>
                    <div className="md:col-span-1 flex items-center">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => exportToJson(
                          reviewChanges,
                          `alteracoes_${format(targetDate, 'yyyyMMdd')}.json`
                        )}
                      >
                        Exportar JSON (Alterações)
                      </Button>
                    </div>
                </div>
                {([ ...filteredBaseAssets, ...filteredIndices ].length > 0) && (
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-600">
                        {[...filteredBaseAssets, ...filteredIndices].filter(a => getAssetStatus(a, editedValues) === 'edited').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Editados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {[...filteredBaseAssets, ...filteredIndices].filter(a => getAssetStatus(a, editedValues) === 'zero').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Valor Zero</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {[...filteredBaseAssets, ...filteredIndices].filter(a => getAssetStatus(a, editedValues) === 'normal').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Normais</div>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          <RecalculationProgress
            isVisible={showProgress}
            steps={recalculationSteps}
            currentStep={currentStep}
            progress={recalculationProgress}
            estimatedTimeRemaining={estimatedTimeRemaining}
            onComplete={() => {
              setShowProgress(false);
              setRecalculationSteps([]);
              setCurrentStep('');
              setRecalculationProgress(0);
              setEstimatedTimeRemaining(0);
            }}
            onCancel={() => {
              setShowProgress(false);
              setRecalculationSteps([]);
              setCurrentStep('');
              setRecalculationProgress(0);
              setEstimatedTimeRemaining(0);
            }}
          />

          {validationAlerts.length > 0 && (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl border-l-4 border-l-yellow-500">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardTitle className="flex items-center gap-3 text-yellow-800">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  Alertas de Validação
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {validationAlerts.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-yellow-700">
                  Foram detectados possíveis problemas com os valores editados. Revise os alertas abaixo.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ValidationAlerts
                  alerts={validationAlerts}
                  onDismiss={handleDismissAlert}
                  onAcceptSuggestion={handleAcceptSuggestion}
                />
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                    <div className="absolute inset-0 h-12 w-12 border-2 border-blue-200 rounded-full"></div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">Carregando Dados</h3>
                    <p className="text-sm text-gray-600">Buscando informações para {format(targetDate, 'dd/MM/yyyy')}</p>
                  </div>
            </div>
              </CardContent>
            </Card>
          ) : data.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">Nenhum Dado Encontrado</h3>
                    <p className="text-sm text-gray-600">
                      Não há dados disponíveis para a data {format(targetDate, 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <TrendingUp className="h-6 w-6" />
                    Moedas e Ativos Base
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Cotações de câmbio e commodities primárias que servem de entrada para os cálculos. 
                    <span className="font-semibold text-yellow-200 ml-1">Estes são os únicos valores editáveis.</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <AssetActionTable 
                    assets={pagedBaseAssets} 
                    onEdit={handleEdit} 
                    editedValues={editedValues} 
                    onInlineChange={handleInlineChange}
                    onRevert={handleRevertInline}
                  />
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      Página {basePage} de {baseTotalPages}
                      <Button size="sm" variant="outline" disabled={basePage<=1} onClick={() => setBasePage(p => Math.max(1, p-1))}>Anterior</Button>
                      <Button size="sm" variant="outline" disabled={basePage>=baseTotalPages} onClick={() => setBasePage(p => Math.min(baseTotalPages, p+1))}>Próxima</Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      Itens por página
                      <Select value={String(basePageSize)} onValueChange={(v) => setBasePageSize(Number(v))}>
                        <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {filteredBaseAssets.length === 0 && baseAssets.length > 0 && (
                    <div className="text-center text-sm text-muted-foreground p-6 bg-gray-50 rounded-lg">
                      Nenhum ativo encontrado com os filtros aplicados. 
                      <Button variant="link" onClick={() => {
                        setSearchTerm('');
                        setCategoryFilter('all');
                        setStatusFilter('all');
                      }} className="ml-2">
                        Limpar filtros
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <BarChart3 className="h-6 w-6" />
                    Índices Calculados
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    Resultados dos índices e sub-índices da plataforma. Estes valores são recalculados automaticamente com base nos ativos base.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <IndexTable indices={pagedIndices} editedValues={editedValues} />
                  <div className="flex items-center justify-between mt-4 px-6 pb-4">
                    <div className="flex items-center gap-2 text-sm">
                      Página {idxPage} de {idxTotalPages}
                      <Button size="sm" variant="outline" disabled={idxPage<=1} onClick={() => setIdxPage(p => Math.max(1, p-1))}>Anterior</Button>
                      <Button size="sm" variant="outline" disabled={idxPage>=idxTotalPages} onClick={() => setIdxPage(p => Math.min(idxTotalPages, p+1))}>Próxima</Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      Itens por página
                      <Select value={String(idxPageSize)} onValueChange={(v) => setIdxPageSize(Number(v))}>
                        <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {filteredIndices.length === 0 && indices.length > 0 && (
                    <div className="text-center text-sm text-muted-foreground p-4">
                      Nenhum índice encontrado com os filtros aplicados.
                      <Button variant="link" onClick={() => {
                        setSearchTerm('');
                        setCategoryFilter('all');
                        setStatusFilter('all');
                      }}>
                        Limpar filtros
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <DateComparison 
                currentDate={targetDate}
                currentData={data}
              />

              <AuditExport 
                currentDate={targetDate}
              />

              <AuditHistory 
                targetDate={targetDate}
                logs={auditLogs}
                isLoading={isLoadingLogs}
              />
            </div>
          )}
        </main>
      </div>
      {editingAsset && (
        <AssetEditModal
          asset={editingAsset as CommodityPriceData}
          isOpen={!!editingAsset}
          onOpenChange={() => setEditingAsset(null)}
          onSave={handleSaveEdit}
          allAssets={data}
          currentUser="Administrador" // TODO: Integrar com sistema de autenticação
        />
      )}
    </>
  );
}


    