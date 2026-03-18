'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Loader2, Save, Edit, Search, TrendingUp, AlertTriangle, CheckCircle, BarChart3, SlidersHorizontal, Activity } from 'lucide-react';
import { getRawCommodityPricesByDate, clearCacheAndRefresh } from '@/lib/data-service';
import type { CommodityPriceData } from '@/lib/types';
import * as Calc from '@/lib/calculation-service';
import { triggerN8NRecalculation } from '@/lib/n8n-actions';
import { isValid, parseISO, format } from 'date-fns';
import { DateNavigator } from '@/components/date-navigator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import { AssetActions } from '@/components/admin/asset-actions';
import { AssetEditModal } from '@/components/admin/asset-edit-modal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuditHistory, type AuditLogEntry } from '@/components/admin/audit-history';
import { getAuditLogsForDate } from '@/lib/audit-log-service';
import { RecalculationProgress, type RecalculationStep } from '@/components/admin/recalculation-progress';
import { ValidationAlerts, generateValidationAlerts, type ValidationAlert } from '@/components/admin/validation-alerts';
import { AuditExport } from '@/components/admin/audit-export';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

const BASE_ASSET_IDS = ['usd', 'eur', 'milho', 'soja', 'boi_gordo', 'madeira', 'carbono'] as const;

type BaseAssetId = typeof BASE_ASSET_IDS[number];

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

function BulkBaseEditModal({
  isOpen,
  onOpenChange,
  baseAssets,
  targetDate,
  onApply,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  baseAssets: CommodityPriceData[];
  targetDate: Date;
  onApply: (values: Record<BaseAssetId, number>) => void;
}) {
  const [values, setValues] = useState<Record<BaseAssetId, string>>({
    usd: '0',
    eur: '0',
    milho: '0',
    soja: '0',
    boi_gordo: '0',
    madeira: '0',
    carbono: '0',
  });
  const [error, setError] = useState('');

  const targetDateFormatted = format(targetDate, 'dd/MM/yyyy');

  const formatNumberForInput = (value: number) => {
    if (!Number.isFinite(value)) return '0';

    const fixed = value.toFixed(4);
    const [intPartRaw, decPartRaw] = fixed.split('.');
    const intPart = intPartRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decPart = decPartRaw.replace(/0+$/, '');

    return decPart.length > 0 ? `${intPart},${decPart}` : intPart;
  };

  const applyPtBrMask = (raw: string) => {
    if (typeof raw !== 'string') return '0';

    const cleaned = raw.replace(/[^\d,]/g, '');
    const firstCommaIndex = cleaned.indexOf(',');

    const integerRaw = firstCommaIndex >= 0 ? cleaned.slice(0, firstCommaIndex) : cleaned;
    const decimalRaw = firstCommaIndex >= 0 ? cleaned.slice(firstCommaIndex + 1).replace(/,/g, '') : '';

    const integerNormalized = integerRaw.replace(/^0+(?=\d)/, '') || '0';
    const integerMasked = integerNormalized.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    if (firstCommaIndex < 0) {
      return integerMasked;
    }

    const decimalMasked = decimalRaw.slice(0, 4);
    return `${integerMasked},${decimalMasked}`;
  };

  const parseNumber = (raw: string) => {
    if (typeof raw !== 'string') return NaN;
    return Number(raw.replace(/\./g, '').replace(',', '.'));
  };

  const isNewQuoteDate = useMemo(() => {
    return BASE_ASSET_IDS.every((id) => {
      const asset = baseAssets.find((item) => item.id === id);
      return !asset || asset.lastUpdated !== targetDateFormatted;
    });
  }, [baseAssets, targetDateFormatted]);

  useEffect(() => {
    if (!isOpen) return;

    const initialValues = BASE_ASSET_IDS.reduce<Record<BaseAssetId, string>>((acc, id) => {
      const asset = baseAssets.find((item) => item.id === id);
      const hasExactDateValue = asset && asset.lastUpdated === targetDateFormatted;
      const initialValue = hasExactDateValue ? asset.price : 0;

      acc[id] = formatNumberForInput(Number(initialValue || 0));
      return acc;
    }, {
      usd: '0',
      eur: '0',
      milho: '0',
      soja: '0',
      boi_gordo: '0',
      madeira: '0',
      carbono: '0',
    });

    setValues(initialValues);
    setError('');
  }, [isOpen, baseAssets, targetDateFormatted]);

  const handleApply = () => {
    const parsed = BASE_ASSET_IDS.reduce<Record<BaseAssetId, number>>((acc, id) => {
      acc[id] = parseNumber(values[id]);
      return acc;
    }, {
      usd: 0,
      eur: 0,
      milho: 0,
      soja: 0,
      boi_gordo: 0,
      madeira: 0,
      carbono: 0,
    });

    const hasInvalid = BASE_ASSET_IDS.some((id) => Number.isNaN(parsed[id]) || parsed[id] < 0);
    if (hasInvalid) {
      setError('Existem valores inválidos. Informe apenas números maiores ou iguais a zero.');
      return;
    }

    if (isNewQuoteDate) {
      const hasMissingValue = BASE_ASSET_IDS.some((id) => parsed[id] <= 0);
      if (hasMissingValue) {
        setError('Para criar cotação nova nesta data, preencha todas as cotações base com valor maior que zero.');
        return;
      }
    }

    onApply(parsed);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Cotações Base</DialogTitle>
          <DialogDescription>
            Ajuste apenas os ativos necessários ou todos os 7 ativos base para {targetDateFormatted}.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="mb-4 rounded-md border bg-muted/40 p-3 text-sm">
            {isNewQuoteDate
              ? 'Não há cotações base exatas para esta data. Os campos foram iniciados em zero para criação manual completa.'
              : 'Os campos foram preenchidos com as cotações já existentes da data selecionada.'}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {BASE_ASSET_IDS.map((id) => {
              const asset = baseAssets.find((item) => item.id === id);
              const label = asset?.name || id;
              return (
                <div key={id} className="space-y-1">
                  <label className="text-sm font-medium">{label}</label>
                  <Input
                    value={values[id]}
                    onChange={(e) => {
                      setValues((prev) => ({ ...prev, [id]: applyPtBrMask(e.target.value) }));
                      setError('');
                    }}
                    placeholder="0,0000"
                    className="font-mono"
                  />
                </div>
              );
            })}
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleApply}>Aplicar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
  targetDate,
}: { 
    assets: (CommodityPriceData & { rentMediaCalculada?: number })[];
    onEdit: (asset: CommodityPriceData) => void;
    editedValues: Record<string, number>;
    onInlineChange: (assetId: string, value: number) => void;
    onRevert: (assetId: string) => void;
    onSort: (key: 'custom' | 'name' | 'id' | 'price' | 'change' | 'status') => void;
    sortKey: 'custom' | 'name' | 'id' | 'price' | 'change' | 'status';
    sortDir: 'asc' | 'desc';
    targetDate: Date;
}) => {
  if (assets.length === 0) {
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
  const targetDateFormatted = format(targetDate, 'dd/MM/yyyy');

  const parseNumber = (s: string) => {
    if (typeof s !== 'string') return NaN;
    const v = s.replace(/\./g, '').replace(',', '.');
    return Number(v);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setInputValue('');
    setErrorMsg('');
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
          <TableHead>Data da Cotação</TableHead>
          {hasRentMedia && <TableHead className="text-right">Rentabilidade Média</TableHead>}
          <TableHead className="text-center w-[200px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => {
          const status = getAssetStatus(asset, editedValues);
          const isEdited = editedValues[asset.id] !== undefined;
          const quoteDate = isEdited ? targetDateFormatted : (asset.lastUpdated || targetDateFormatted);
          const isFallbackDate = !isEdited && quoteDate !== targetDateFormatted;
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
                <span>{formatCurrency(
                    editedValues[asset.id] ?? asset.price,
                    asset.id === 'madeira' ? 'USD' : asset.currency,
                    asset.id
                  )}
                </span>
              )}
              {editingId === asset.id && errorMsg && (
                <div className="text-xs text-red-600 mt-1">{errorMsg}</div>
              )}
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-sm">{quoteDate}</span>
                {isEdited ? (
                  <Badge variant="secondary" className="w-fit bg-yellow-100 text-yellow-800">Aplicada na data selecionada</Badge>
                ) : isFallbackDate ? (
                  <Badge variant="outline" className="w-fit bg-amber-50 text-amber-800 border-amber-200">Usando data anterior</Badge>
                ) : (
                  <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-200">Data exata</Badge>
                )}
              </div>
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

const IndexTable = ({ indices, onEdit }: { indices: CommodityPriceData[]; onEdit: (asset: CommodityPriceData) => void }) => {
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

  const renderIndexRow = (asset: CommodityPriceData | undefined, indent: string, badge?: React.ReactNode) => {
    if (!asset) return null;
    return (
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
          <AssetActions asset={asset} onEdit={onEdit} />
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Table>
      <TableBody>
        {renderIndexRow(ch2oAgua, '')}
        {renderIndexRow(custoAgua, '')}
        {renderIndexRow(valorUsoSolo, '')}
        {valorUsoSoloSubIndices.map(subIndex =>
          renderIndexRow(subIndex, '└─', <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Sub-índice</Badge>)
        )}
        {renderIndexRow(pdm, '')}
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
  );
};

function AuditPageContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const { toast } = useToast();

  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [data, setData] = useState<CommodityPriceData[]>([]);
  const [originalData, setOriginalData] = useState<Map<string, CommodityPriceData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [editingAsset, setEditingAsset] = useState<CommodityPriceData | null>(null);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<'custom' | 'name' | 'id' | 'price' | 'change' | 'status'>('custom');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  
  const [basePage, setBasePage] = useState(1);
  const [basePageSize, setBasePageSize] = useState(50);
  const [idxPage, setIdxPage] = useState(1);
  const [idxPageSize, setIdxPageSize] = useState(50);
  
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  
  const [recalculationSteps, setRecalculationSteps] = useState<RecalculationStep[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [recalculationProgress, setRecalculationProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  
  const [validationAlerts, setValidationAlerts] = useState<ValidationAlert[]>([]);
  const targetDateFormatted = format(targetDate, 'dd/MM/yyyy');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const newDate = getValidatedDate(dateParam);
    setTargetDate(newDate);
    setEditedValues({});
    
    setIsLoading(true);
    setIsLoadingLogs(true);
    
    getRawCommodityPricesByDate(newDate)
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
        description: `O valor de ${assetId} foi atualizado localmente.`,
    });
  }
  
  const handleInlineChange = (assetId: string, value: number) => {
    const newEdited = { ...editedValues, [assetId]: value };
    setEditedValues(newEdited);
    const updatedData = data.map((a: CommodityPriceData) => a.id === assetId ? { ...a, price: value } : a);
    setData(updatedData);
    setValidationAlerts(generateValidationAlerts(updatedData, newEdited));
  };

  const handleRevertInline = (assetId: string) => {
    const copy = { ...editedValues };
    delete copy[assetId];
    setEditedValues(copy);
    const original = originalData.get(assetId);
    if (original) {
      const restored = data.map((a: CommodityPriceData) => a.id === assetId ? { ...a, price: original.price } : a);
      setData(restored);
      setValidationAlerts(generateValidationAlerts(restored, copy));
    }
  };

  const handleApplyBulkBaseEdit = (values: Record<BaseAssetId, number>) => {
    const updatedData = data.map((asset) => {
      if (!(BASE_ASSET_IDS as readonly string[]).includes(asset.id)) return asset;
      return { ...asset, price: values[asset.id as BaseAssetId] };
    });

    const nextEditedValues: Record<string, number> = { ...editedValues };

    BASE_ASSET_IDS.forEach((id) => {
      const originalPrice = originalData.get(id)?.price;
      const newPrice = values[id];

      if (typeof originalPrice === 'number' && Math.abs(newPrice - originalPrice) < 0.000001) {
        delete nextEditedValues[id];
      } else {
        nextEditedValues[id] = newPrice;
      }
    });

    setData(updatedData);
    setEditedValues(nextEditedValues);
    setValidationAlerts(generateValidationAlerts(updatedData, nextEditedValues));

    toast({
      title: 'Edição em lote aplicada',
      description: 'As cotações base foram atualizadas localmente. Clique em Salvar e Recalcular para enviar ao webhook.',
    });
  };

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
        const baseAssetIds = ['usd', 'eur', 'milho', 'soja', 'boi_gordo', 'madeira', 'carbono'] as const;
        const allAssetsSnapshot = baseAssetIds.reduce<Record<string, number>>((acc, assetId) => {
          const asset = data.find((item) => item.id === assetId);
          if (!asset) return acc;

          const resolvedValue = editedValues[assetId] ?? asset.price;
          if (typeof resolvedValue !== 'number' || Number.isNaN(resolvedValue)) return acc;

          acc[assetId] = resolvedValue;
          return acc;
        }, {});

        const missingAssets = baseAssetIds.filter((assetId) => allAssetsSnapshot[assetId] === undefined);
        if (missingAssets.length > 0) {
          throw new Error(`Snapshot incompleto para o webhook. Ativos ausentes: ${missingAssets.join(', ')}`);
        }

        const result = await triggerN8NRecalculation(targetDate, allAssetsSnapshot);

        if (result.success) {
          toast({
            title: "Snapshot completo enviado",
            description: result.message || "O N8N está reprocessando os dados.",
          });
          try { await clearCacheAndRefresh(); } catch {}
          setEditedValues({});
          setValidationAlerts([]);
          // Refresh data after a few seconds
          setTimeout(async () => {
            const [freshData, freshLogs] = await Promise.all([
              getRawCommodityPricesByDate(targetDate),
              getAuditLogsForDate(targetDate),
            ]);
            setData(freshData);
            setAuditLogs(freshLogs);
          }, 5000);
        } else {
          throw new Error(result.message || 'Falha ao contatar o N8N');
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
    
    const sortOrder = ['usd', 'eur', 'boi_gordo', 'soja', 'milho', 'madeira', 'carbono'];
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

    const toStatus = (a: CommodityPriceData) => getAssetStatus(a, editedValues);
    const dir = sortDir === 'asc' ? 1 : -1;
    const cmp = (a: CommodityPriceData, b: CommodityPriceData) => {
      switch (sortKey) {
        case 'custom': return 0;
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
  }, [data, debouncedSearchTerm, categoryFilter, statusFilter, editedValues, sortKey, sortDir, searchTerm]);

  const fallbackBaseAssets = useMemo(() => {
    return baseAssets.filter((asset) => {
      const isEdited = editedValues[asset.id] !== undefined;
      if (isEdited) return false;
      return asset.lastUpdated !== targetDateFormatted;
    });
  }, [baseAssets, editedValues, targetDateFormatted]);

  const baseTotalPages = Math.max(1, Math.ceil(filteredBaseAssets.length / basePageSize));
  const idxTotalPages = Math.max(1, Math.ceil(filteredIndices.length / idxPageSize));
  const pagedBaseAssets = filteredBaseAssets.slice((basePage - 1) * basePageSize, basePage * basePageSize);
  const pagedIndices = filteredIndices.slice((idxPage - 1) * idxPageSize, idxPage * idxPageSize);

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
        description: `O valor de ${alert.assetName} foi atualizado.`,
      });
    }
  };

  const handleSort = (key: 'custom' | 'name' | 'id' | 'price' | 'change' | 'status') => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <>
      <div className="flex min-h-screen w-full flex-col">
        <PageHeader
          title="Auditoria de Dados"
          description="Verifique, corrija e recalcule os dados históricos da plataforma."
          icon={<History className="h-5 w-5 text-primary hidden sm:block" />}
        />
        <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleRecalculate} disabled={!hasEdits || isPending} className="bg-green-600 hover:bg-green-700">
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar e Recalcular
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Envia alterações para o N8N.</p>
                    </TooltipContent>
                  </Tooltip>
                  <Button variant="outline" onClick={() => setIsBulkEditOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Cotações Base
                  </Button>
                  <div className="ml-auto flex items-center gap-4">
                    <div className="hidden md:block">
                      <DateNavigator targetDate={targetDate} />
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm text-gray-600">
                      <Activity className="h-4 w-4 text-green-600" />
                      <span className="hidden lg:inline">Edições pendentes:</span>
                      <Badge variant={hasEdits ? 'destructive' : 'secondary'} className="font-medium">
                        {Object.keys(editedValues).length}
                      </Badge>
                      <span className="hidden lg:inline">Data:</span>
                      <Badge variant="outline" className="font-mono text-[10px] md:text-xs">
                        {format(targetDate, 'dd/MM/yyyy')}
                      </Badge>
                    </div>
                  </div>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
          
          <RecalculationProgress
            isVisible={showProgress}
            steps={recalculationSteps}
            currentStep={currentStep}
            progress={recalculationProgress}
            estimatedTimeRemaining={estimatedTimeRemaining}
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

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-blue-900">
                  Referência de data da auditoria: {targetDateFormatted}
                </p>
                <p className="text-sm text-blue-800">
                  As cotações exibidas na tabela mostram explicitamente a data de origem em cada ativo.
                </p>
                {fallbackBaseAssets.length > 0 ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    Não há cotação exata em {targetDateFormatted} para {fallbackBaseAssets.length} ativo(s). 
                    Estamos exibindo a data anterior disponível para: {fallbackBaseAssets.map((a) => `${a.name} (${a.lastUpdated})`).join(', ')}.
                  </div>
                ) : (
                  <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                    Todas as cotações base exibidas correspondem à data selecionada ({targetDateFormatted}).
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="text-gray-600">Carregando dados para auditoria...</p>
            </div>
          ) : data.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold">Nenhum Dado Encontrado</h3>
                <p className="text-gray-600">Não há dados para a data {format(targetDate, 'dd/MM/yyyy')}</p>
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
                </CardHeader>
                <CardContent className="p-6">
                  <AssetActionTable 
                    assets={pagedBaseAssets} 
                    onEdit={handleEdit} 
                    editedValues={editedValues} 
                    onInlineChange={handleInlineChange}
                    onRevert={handleRevertInline}
                    onSort={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    targetDate={targetDate}
                  />
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      Página {basePage} de {baseTotalPages}
                      <Button size="sm" variant="outline" disabled={basePage<=1} onClick={() => setBasePage(p => Math.max(1, p-1))}>Anterior</Button>
                      <Button size="sm" variant="outline" disabled={basePage>=baseTotalPages} onClick={() => setBasePage(p => Math.min(baseTotalPages, p+1))}>Próxima</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <BarChart3 className="h-6 w-6" />
                    Índices Calculados
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <IndexTable indices={pagedIndices} onEdit={handleEdit} />
                </CardContent>
              </Card>
              
              <AuditExport currentDate={targetDate} />

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
          currentUser="Administrador"
        />
      )}
      <BulkBaseEditModal
        isOpen={isBulkEditOpen}
        onOpenChange={setIsBulkEditOpen}
        baseAssets={data.filter((asset) => (BASE_ASSET_IDS as readonly string[]).includes(asset.id))}
        targetDate={targetDate}
        onApply={handleApplyBulkBaseEdit}
      />
    </>
  );
}

export default function AuditPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        if (user) {
            const checkAdmin = async () => {
                const adminRef = doc(firestore, `roles_admin/${user.uid}`);
                const adminSnap = await getDoc(adminRef);
                setIsAdmin(adminSnap.exists());
            };
            checkAdmin();
        } else if (!isUserLoading) {
            setIsAdmin(false);
        }
    }, [user, firestore, isUserLoading]);

    if (isUserLoading || isAdmin === null) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!isAdmin) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
                <Card className="max-w-lg">
                    <CardHeader className="items-center text-center">
                        <SlidersHorizontal className="h-10 w-10 text-destructive mb-4" />
                        <CardTitle>Acesso Restrito</CardTitle>
                        <CardDescription>
                            Esta página está disponível apenas para administradores.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return <AuditPageContent />;
}
