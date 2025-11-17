
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  getCollections, 
  getDocuments, 
  updateDocument, 
  createDocument, 
  deleteDocuments,
  type DocumentData 
} from '@/lib/firestore-admin-actions';
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

const ITEMS_PER_PAGE = 50;

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

  const fetchDocuments = useCallback(async (collectionId: string) => {
    if (!collectionId) return;
    setIsLoading(prev => ({ ...prev, docs: true }));
    try {
      const docs = await getDocuments(collectionId);
      setDocuments(docs);
      setSelectedDocuments([]);
      setCurrentPage(1);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao buscar documentos', description: e.message });
    } finally {
      setIsLoading(prev => ({ ...prev, docs: false }));
    }
  }, [toast]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    if (selectedCollection) {
      fetchDocuments(selectedCollection);
    }
  }, [selectedCollection, fetchDocuments]);

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

  const paginatedDocuments = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDocuments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDocuments, currentPage]);
  
  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);

  const handleSelectAll = (checked: boolean) => {
    setSelectedDocuments(checked ? paginatedDocuments.map(d => d.id) : []);
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

        {/* Documents Table */}
        <div className="border rounded-md">
          {isLoading.docs ? (
            <div className="h-96 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedDocuments.length === paginatedDocuments.length && paginatedDocuments.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>ID do Documento</TableHead>
                  <TableHead className="w-[120px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocuments.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedDocuments.includes(doc.id)}
                        onCheckedChange={(checked) => {
                          setSelectedDocuments(prev => 
                            checked ? [...prev, doc.id] : prev.filter(id => id !== doc.id)
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{doc.id}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(doc)}>
                        <FileJson className="mr-2 h-4 w-4" />
                        Ver / Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedDocuments.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            {selectedCollection ? 'Nenhum documento encontrado.' : 'Selecione uma coleção para começar.'}
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                        <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                        Próxima <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        )}
      </CardContent>
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
