'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  getCollections, 
  getDocumentsPaged, 
  updateDocument, 
  createDocument, 
  deleteDocuments,
  type DocumentData,
  type OrderByEntry,
  type WhereEqEntry,
  type GetDocumentsPagedOptions,
} from '@/lib/firestore-admin-actions';
import { getCollectionSchema, validateAgainstSchema } from '@/lib/firestore-admin-schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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
import { 
  Loader2, 
  PlusCircle, 
  Trash2, 
  RefreshCw, 
  Database,
  FileJson,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentEditorModal } from './document-editor-modal';
import { EditableDocumentsTable } from './editable-documents-table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const DEFAULT_LIMIT = 50;

export function FirestoreAdmin() {
  const { toast } = useToast();
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState({ collections: false, docs: false });
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  // server-side listing controls (multi)
  const [limitOpt, setLimitOpt] = useState<number>(DEFAULT_LIMIT);
  const [orderBys, setOrderBys] = useState<OrderByEntry[]>([]);
  const [wheres, setWheres] = useState<WhereEqEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<any[] | undefined>(undefined);
  const [cursorStack, setCursorStack] = useState<any[][]>([]); // stack of startAfter cursors per page
  const [pageIndex, setPageIndex] = useState(0);
  // bulk edit
  const [bulkField, setBulkField] = useState('');
  const [bulkValueText, setBulkValueText] = useState('');
  // import/export
  const [importPreview, setImportPreview] = useState<Array<{index:number; id?:string; data:any; errors:string[]}> | null>(null);
  const [isCommittingImport, setIsCommittingImport] = useState(false);

  const fetchCollections = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, collections: true }));
    try {
      const colls = await getCollections();
      setCollections(colls);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao buscar coleções', description: e.message });
    } finally {
      setIsLoading(prev => ({ ...prev, collections: false }));
    }
  }, [toast]);

  const fetchDocuments = useCallback(async (collectionId: string, opts?: { startAfterValues?: any[]; pushCursor?: boolean }) => {
    if (!collectionId) return;
    setIsLoading(prev => ({ ...prev, docs: true }));
    try {
      const options: GetDocumentsPagedOptions = {
        limit: limitOpt || DEFAULT_LIMIT,
        orderBys: orderBys.length ? orderBys : undefined,
        wheres: wheres.length ? wheres : undefined,
        startAfterValues: opts?.startAfterValues,
      };
      const { docs, nextCursor } = await getDocumentsPaged(collectionId, options);
      setDocuments(docs);
      setNextCursor(nextCursor);
      setSelectedDocuments([]);
      if (opts?.pushCursor && options.orderBys && docs.length) {
        // push cursor for the page we just left (i.e., before fetching next page)
        setCursorStack(prev => [...prev, opts.startAfterValues || []]);
        setPageIndex(prev => prev + 1);
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao buscar documentos', description: e.message });
    } finally {
      setIsLoading(prev => ({ ...prev, docs: false }));
    }
  }, [toast, limitOpt, orderBys, wheres]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    if (selectedCollection) {
      // reset pagination when criteria changes
      setCursorStack([]);
      setPageIndex(0);
      fetchDocuments(selectedCollection, { startAfterValues: undefined });
    }
  }, [selectedCollection, fetchDocuments, limitOpt, orderBys, wheres]);

  const handleCreate = () => {
    setEditingDoc(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (doc: DocumentData) => {
    setEditingDoc(doc);
    setIsEditorOpen(true);
  };

  const handleSave = async (data: Record<string, any>, docId?: string) => {
    try {
      if (editingDoc) { // Update
        await updateDocument(selectedCollection, editingDoc.id, data);
        toast({ title: 'Sucesso', description: 'Documento atualizado.' });
      } else { // Create
        await createDocument(selectedCollection, data, docId);
        toast({ title: 'Sucesso', description: 'Documento criado.' });
      }
      setIsEditorOpen(false);
      fetchDocuments(selectedCollection);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: e.message });
    }
  };

  const handleDelete = async (docIds: string[]) => {
    if (docIds.length === 0) return;
    try {
      await deleteDocuments(selectedCollection, docIds);
      toast({ title: 'Sucesso', description: `${docIds.length} documento(s) excluído(s).` });
      fetchDocuments(selectedCollection);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: e.message });
    }
  };

  const filteredDocuments = React.useMemo(() => {
    if (!searchTerm) return documents;
    return documents.filter(doc => 
      JSON.stringify(doc).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [documents, searchTerm]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedDocuments(checked ? filteredDocuments.map(d => d.id) : []);
  };

  const handleSaveMany = async (changes: Record<string, Record<string, any>>) => {
    if (!selectedCollection) return;
    try {
      const entries = Object.entries(changes);
      for (const [docId, data] of entries) {
        await updateDocument(selectedCollection, docId, data);
      }
      toast({ title: 'Sucesso', description: `${entries.length} documento(s) atualizado(s).` });
      fetchDocuments(selectedCollection, { startAfterValues: cursorStack[pageIndex] });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar alterações', description: e.message });
      throw e;
    }
  };

  const handleNextPage = () => {
    if (!selectedCollection || !nextCursor || !nextCursor.length) return;
    // move forward: push the cursor of current page and fetch next
    fetchDocuments(selectedCollection, { startAfterValues: nextCursor, pushCursor: true });
  };

  const handlePrevPage = () => {
    if (!selectedCollection) return;
    if (cursorStack.length === 0) return;
    // go back one page: pop last cursor and use previous
    setCursorStack(prev => {
      const copy = [...prev];
      copy.pop();
      const startAfterValues = copy.length ? copy[copy.length - 1] : undefined;
      setPageIndex(Math.max(0, pageIndex - 1));
      fetchDocuments(selectedCollection, { startAfterValues });
      return copy;
    });
  };

  const addOrderBy = () => setOrderBys(ob => [...ob, { field: '', direction: 'asc' }]);
  const removeOrderBy = (idx: number) => setOrderBys(ob => ob.filter((_, i) => i !== idx));
  const updateOrderByField = (idx: number, field: string) => setOrderBys(ob => ob.map((e,i)=> i===idx? {...e, field}: e));
  const updateOrderByDir = (idx: number, direction: 'asc'|'desc') => setOrderBys(ob => ob.map((e,i)=> i===idx? {...e, direction}: e));

  const addWhere = () => setWheres(ws => [...ws, { field: '', value: '' }]);
  const removeWhere = (idx: number) => setWheres(ws => ws.filter((_, i) => i !== idx));
  const updateWhereField = (idx: number, field: string) => setWheres(ws => ws.map((e,i)=> i===idx? {...e, field}: e));
  const updateWhereValue = (idx: number, value: string) => setWheres(ws => ws.map((e,i)=> i===idx? {...e, value}: e));

  const handleBulkApply = async () => {
    if (!selectedCollection || !bulkField) {
      toast({ variant: 'destructive', title: 'Bulk edit', description: 'Informe o campo.' });
      return;
    }
    if (selectedDocuments.length === 0) {
      toast({ variant: 'destructive', title: 'Bulk edit', description: 'Selecione ao menos 1 documento.' });
      return;
    }
    let parsed: any = bulkValueText;
    try {
      parsed = JSON.parse(bulkValueText);
    } catch {}

    const schema = getCollectionSchema(selectedCollection);
    if (schema) {
      const res = validateAgainstSchema(schema, { [bulkField]: parsed }, { partial: true });
      if (!res.valid) {
        toast({ variant: 'destructive', title: 'Validação', description: res.errors.join('; ') });
        return;
      }
    }
    // confirm
    const changes: Record<string, Record<string, any>> = {};
    for (const id of selectedDocuments) changes[id] = { [bulkField]: parsed };
    await handleSaveMany(changes);
    setBulkField('');
    setBulkValueText('');
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(documents, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCollection || 'export'}.page${pageIndex + 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    let items: any[] = [];
    try {
      const parsed = JSON.parse(text);
      items = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      toast({ variant: 'destructive', title: 'Importação', description: 'JSON inválido' });
      return;
    }
    const schema = getCollectionSchema(selectedCollection);
    const preview: Array<{index:number; id?:string; data:any; errors:string[]}> = items.map((it, idx) => {
      const { id, ...data } = it || {};
      const errors: string[] = [];
      if (!data || typeof data !== 'object') errors.push('item deve ser objeto');
      if (schema) {
        const res = validateAgainstSchema(schema, data || {}, { partial: false });
        if (!res.valid) errors.push(...res.errors);
      }
      return { index: idx, id, data, errors };
    });
    setImportPreview(preview);
  };

  const commitImport = async () => {
    if (!importPreview || !selectedCollection) return;
    const errors = importPreview.filter(i => i.errors.length);
    if (errors.length) {
      toast({ variant: 'destructive', title: 'Importação', description: 'Corrija os erros antes do commit.' });
      return;
    }
    setIsCommittingImport(true);
    try {
      for (const item of importPreview) {
        if (item.id) await updateDocument(selectedCollection, item.id, item.data);
        else await createDocument(selectedCollection, item.data);
      }
      toast({ title: 'Importação', description: 'Itens importados com sucesso.' });
      setImportPreview(null);
      fetchDocuments(selectedCollection, { startAfterValues: cursorStack[pageIndex] });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Importação', description: e.message });
    } finally {
      setIsCommittingImport(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Firestore Admin
            </CardTitle>
            <CardDescription>
              Gerencie coleções e documentos do seu banco de dados Firestore.
            </CardDescription>
          </div>
          <Button onClick={() => fetchDocuments(selectedCollection)} variant="outline" size="icon" disabled={isLoading.docs || !selectedCollection}>
            <RefreshCw className={isLoading.docs ? 'animate-spin' : ''} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Collection Selector & Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select onValueChange={setSelectedCollection} value={selectedCollection} disabled={isLoading.collections}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={isLoading.collections ? "Carregando coleções..." : "Selecione uma coleção"} />
              </SelectTrigger>
              <SelectContent>
                {collections.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Buscar em documentos (JSON)..."
                className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!selectedCollection}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!selectedCollection}>
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Documento
              </Button>
              <Button variant="outline" onClick={handleExportJSON} disabled={!selectedCollection || documents.length===0}>
                <FileJson className="mr-2 h-4 w-4" /> Exportar JSON (página)
              </Button>
              <label className="px-3 py-2 border rounded-md text-sm cursor-pointer">
                Importar JSON
                <input type="file" accept="application/json" className="hidden" onChange={(e)=> e.target.files && e.target.files[0] && handleImportFile(e.target.files[0])} />
              </label>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={selectedDocuments.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir ({selectedDocuments.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação é irreversível e excluirá permanentemente {selectedDocuments.length} documento(s).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(selectedDocuments)}>
                      Sim, excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          {/* Server-side controls: limit, multiple orderBys, multiple wheres */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Limite</Label>
              <Input type="number" value={limitOpt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLimitOpt(Math.max(1, Number(e.target.value||DEFAULT_LIMIT)))} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Ordenações</Label>
                <Button size="sm" variant="outline" onClick={addOrderBy}>+ add</Button>
              </div>
              {orderBys.map((ob, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                  <Input className="col-span-3" placeholder="campo" value={ob.field} onChange={(e: React.ChangeEvent<HTMLInputElement>)=> updateOrderByField(idx, e.target.value)} />
                  <Select value={ob.direction} onValueChange={(v: 'asc'|'desc') => updateOrderByDir(idx, v)}>
                    <SelectTrigger><SelectValue placeholder="direção" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">asc</SelectItem>
                      <SelectItem value="desc">desc</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" onClick={()=> removeOrderBy(idx)}>remover</Button>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Filtros (==)</Label>
                <Button size="sm" variant="outline" onClick={addWhere}>+ add</Button>
              </div>
              {wheres.map((w, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                  <Input className="col-span-2" placeholder="campo" value={w.field} onChange={(e: React.ChangeEvent<HTMLInputElement>)=> updateWhereField(idx, e.target.value)} />
                  <Input className="col-span-2" placeholder="valor (string)" value={w.value as any} onChange={(e: React.ChangeEvent<HTMLInputElement>)=> updateWhereValue(idx, e.target.value)} />
                  <Button size="sm" variant="ghost" onClick={()=> removeWhere(idx)}>remover</Button>
                </div>
              ))}
            </div>
            <div>
              <Button variant="outline" onClick={() => selectedCollection && fetchDocuments(selectedCollection)} disabled={!selectedCollection}>
                <RefreshCw className="mr-2 h-4 w-4" /> Aplicar
              </Button>
            </div>
          </div>
        </div>
        {/* Documents Table (inline editable) */}
        {isLoading.docs ? (
          <div className="h-96 flex items-center justify-center border rounded-md">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* seleção em massa e exclusão permanecem acima via checkboxes e botões */}
            <div className="border rounded-md p-2 mb-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Página {pageIndex + 1} • {documents.length} documento(s)</div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0} onCheckedChange={handleSelectAll} />
                  <span className="text-sm">Selecionar página</span>
                </div>
              </div>
            </div>
            <EditableDocumentsTable 
              collectionId={selectedCollection}
              documents={filteredDocuments}
              isLoading={isLoading.docs}
              onSaveMany={handleSaveMany}
              onAfterChange={() => selectedCollection && fetchDocuments(selectedCollection)}
            />
            {/* Bulk edit */}
            <div className="mt-3 border rounded-md p-3 space-y-2">
              <div className="text-sm font-medium">Edição em massa</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                <Input placeholder="campo" value={bulkField} onChange={(e: React.ChangeEvent<HTMLInputElement>)=> setBulkField(e.target.value)} />
                <Input placeholder='valor (string ou JSON: 123, true, {"a":1})' value={bulkValueText} onChange={(e: React.ChangeEvent<HTMLInputElement>)=> setBulkValueText(e.target.value)} />
                <div className="text-xs text-muted-foreground">Selecionados: {selectedDocuments.length}</div>
                <Button size="sm" onClick={handleBulkApply} disabled={!selectedCollection || selectedDocuments.length===0}>Aplicar</Button>
              </div>
            </div>
          </>
        )}
        
        {/* Cursor Pagination */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Página {pageIndex + 1}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={pageIndex === 0}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={!nextCursor || nextCursor.length === 0}>
              Próxima <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
      {/* Import preview panel */}
      {importPreview && (
        <div className="border-t p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-medium">Prévia de importação (dry-run)</div>
            <div className="text-sm text-muted-foreground">{importPreview.length} item(s)</div>
          </div>
          <div className="max-h-64 overflow-auto text-xs bg-muted rounded p-2">
            {importPreview.map(row => (
              <div key={row.index} className="mb-2">
                <div>#{row.index} {row.id ? `(id: ${row.id})` : ''}</div>
                {row.errors.length ? (
                  <div className="text-red-600">Erros: {row.errors.join('; ')}</div>
                ) : (
                  <div className="text-green-700">OK</div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={()=> setImportPreview(null)}>Descartar</Button>
            <Button onClick={commitImport} disabled={isCommittingImport}>
              {isCommittingImport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar importação
            </Button>
          </div>
        </div>
      )}
      {isEditorOpen && (
        <DocumentEditorModal
          isOpen={isEditorOpen}
          onOpenChange={setIsEditorOpen}
          doc={editingDoc}
          onSave={handleSave}
          collectionId={selectedCollection}
        />
      )}
    </Card>
  );
}
