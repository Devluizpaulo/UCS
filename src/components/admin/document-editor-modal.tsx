
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogBody,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import type { DocumentData } from '@/lib/firestore-admin-actions';
import { useToast } from '@/hooks/use-toast';

interface DocumentEditorModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  doc: DocumentData | null;
  onSave: (data: Record<string, any>, docId?: string) => Promise<void>;
  collectionId: string;
}

export function DocumentEditorModal({ 
  isOpen, 
  onOpenChange, 
  doc, 
  onSave, 
  collectionId 
}: DocumentEditorModalProps) {
  const { toast } = useToast();
  const [jsonString, setJsonString] = useState('');
  const [docId, setDocId] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (doc) {
      const { id, ...data } = doc;
      setJsonString(JSON.stringify(data, null, 2));
      setDocId(id);
    } else {
      setJsonString('{\n  "fieldName": "fieldValue"\n}');
      setDocId('');
    }
    setParseError(null);
  }, [doc, isOpen]);

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newJson = e.target.value;
    setJsonString(newJson);
    try {
      JSON.parse(newJson);
      setParseError(null);
    } catch (error) {
      setParseError('JSON inválido.');
    }
  };

  const handleSaveClick = async () => {
    if (parseError) {
      toast({ variant: 'destructive', title: 'Erro de Formato', description: 'Corrija o JSON antes de salvar.' });
      return;
    }

    setIsSaving(true);
    try {
      const data = JSON.parse(jsonString);
      await onSave(data, doc ? undefined : docId);
    } catch (e: any) {
      // O onSave já mostra um toast de erro, não precisa duplicar.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{doc ? 'Editar Documento' : 'Novo Documento'}</DialogTitle>
          <DialogDescription>
            {doc 
              ? `Editando documento com ID: ${doc.id}`
              : `Criando novo documento na coleção: ${collectionId}`}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex-grow flex flex-col gap-4">
          {!doc && (
            <div>
              <Label htmlFor="docId">ID do Documento (Opcional)</Label>
              <Input
                id="docId"
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
                placeholder="Deixe em branco para gerar ID automático"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se um ID for fornecido, a operação será um 'set' em vez de 'add'.
              </p>
            </div>
          )}
          <div className="flex-grow flex flex-col">
            <Label htmlFor="jsonEditor">Conteúdo do Documento (JSON)</Label>
            <textarea
              id="jsonEditor"
              value={jsonString}
              onChange={handleJsonChange}
              className="w-full flex-grow p-2 font-mono text-sm border rounded-md resize-none bg-muted/30 focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>
          {parseError && (
            <div className="flex items-center gap-2 text-sm text-destructive-foreground bg-destructive p-2 rounded-md">
              <AlertTriangle className="h-4 w-4" />
              {parseError}
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSaveClick} disabled={!!parseError || isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
