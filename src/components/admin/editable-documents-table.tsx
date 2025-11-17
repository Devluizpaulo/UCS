"use client";

import React, { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw, FileJson, History, PlusCircle } from "lucide-react";
import type { DocumentData } from "@/lib/firestore-admin-actions";
import { getDevAuditLogsForDocument, createDocument, revertDocumentFields } from "@/lib/firestore-admin-actions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AuditHistory } from "@/components/admin/audit-history";

type ChangesByDoc = Record<string, Record<string, any>>;

interface EditableDocumentsTableProps {
  collectionId: string;
  documents: DocumentData[];
  isLoading?: boolean;
  onSaveMany: (changes: ChangesByDoc) => Promise<void>;
  onAfterChange?: () => void;
}

function isPrimitive(v: any) {
  return (
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean" ||
    v === null
  );
}

function isMillisTimestamp(n: any, field?: string): boolean {
  if (typeof n !== 'number' || !isFinite(n)) return false;
  // heurística: >= 2001-09-09T01:46:40Z em millis
  if (n >= 1e12 && n <= 4102444800000) return true; // até ~2100
  if (field) {
    const f = field.toLowerCase();
    if ((f.includes('timestamp') || f.endsWith('_at') || f === 'data' || f === 'date') && n > 1e10) return true;
  }
  return false;
}

function toLocalDatetimeInputValue(ms: number): string {
  try {
    const d = new Date(ms);
    const pad = (x: number) => String(x).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${y}-${m}-${day}T${hh}:${mm}`;
  } catch {
    return '';
  }
}

function fromLocalDatetimeInputValue(value: string): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return isNaN(ms) ? null : ms;
}

export function EditableDocumentsTable({ collectionId, documents, isLoading = false, onSaveMany, onAfterChange }: EditableDocumentsTableProps) {
  const [edited, setEdited] = useState<ChangesByDoc>({});
  const [jsonFieldModal, setJsonFieldModal] = useState<{
    open: boolean;
    docId: string | null;
    field: string | null;
    value: string;
    parseError: string | null;
  }>({ open: false, docId: null, field: null, value: "", parseError: null });
  const [savingDocId, setSavingDocId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    changes: ChangesByDoc;
  }>({ open: false, changes: {} });
  const [historyDrawer, setHistoryDrawer] = useState<{ open: boolean; docId: string | null; logs: any[]; loading: boolean }>({ open: false, docId: null, logs: [], loading: false });
  const [createRow, setCreateRow] = useState<{ enabled: boolean; docId: string; dataText: string; parseError: string | null }>({ enabled: false, docId: "", dataText: '{\n  "field": "value"\n}', parseError: null });
  const [typeErrors, setTypeErrors] = useState<Record<string, Record<string, string>>>({});

  const columns = useMemo(() => {
    const keys = new Set<string>();
    for (const d of documents) {
      Object.keys(d).forEach((k) => { if (k !== "id") keys.add(k); });
    }
    return Array.from(keys).sort();
  }, [documents]);

  const hasChanges = useMemo(() => Object.keys(edited).length > 0, [edited]);

  const openJsonEditor = (docId: string, field: string, value: any) => {
    setJsonFieldModal({
      open: true,
      docId,
      field,
      value: JSON.stringify(value ?? null, null, 2),
      parseError: null,
    });
  };

  const applyJsonEditor = () => {
    if (!jsonFieldModal.docId || !jsonFieldModal.field) return;
    if (jsonFieldModal.parseError) return;
    try {
      const parsed = JSON.parse(jsonFieldModal.value);
      setEdited((prev) => ({
        ...prev,
        [jsonFieldModal.docId!]: {
          ...(prev[jsonFieldModal.docId!] || {}),
          [jsonFieldModal.field!]: parsed,
        },
      }));
      setJsonFieldModal({ open: false, docId: null, field: null, value: "", parseError: null });
    } catch (e) {
      setJsonFieldModal((p) => ({ ...p, parseError: "JSON inválido" }));
    }
  };

  const setField = (docId: string, field: string, value: any) => {
    setEdited((prev) => ({
      ...prev,
      [docId]: {
        ...(prev[docId] || {}),
        [field]: value,
      },
    }));
    // validação básica: se original é number e novo não é number, marca erro
    const originalDoc = documents.find(d => d.id === docId) as any;
    const origVal = originalDoc ? originalDoc[field] : undefined;
    setTypeErrors((prev) => {
      const clone = { ...prev };
      if (typeof origVal === 'number' && typeof value !== 'number') {
        clone[docId] = { ...(clone[docId] || {}), [field]: 'Esperado número' };
      } else {
        if (clone[docId]) {
          const inner = { ...clone[docId] };
          delete inner[field];
          if (Object.keys(inner).length === 0) delete clone[docId]; else clone[docId] = inner;
        }
      }
      return clone;
    });
  };

  const discardRow = (docId: string) => {
    setEdited((prev) => {
      const { [docId]: _, ...rest } = prev;
      return rest;
    });
  };

  const saveRow = async (docId: string) => {
    if (!edited[docId]) return;
    setConfirmModal({ open: true, changes: { [docId]: edited[docId] } });
  };

  const saveAll = async () => {
    if (!hasChanges) return;
    setConfirmModal({ open: true, changes: edited });
  };

  const proceedSave = async () => {
    // bloqueia se houver erros de tipo
    if (Object.keys(typeErrors).length > 0) return;
    const isSingle = Object.keys(confirmModal.changes).length === 1;
    const docId = isSingle ? Object.keys(confirmModal.changes)[0] : null;
    if (isSingle && docId) setSavingDocId(docId);
    if (!isSingle) setSavingAll(true);
    try {
      await onSaveMany(confirmModal.changes);
      // limpar edits aplicados
      if (isSingle && docId) {
        discardRow(docId);
      } else {
        setEdited({});
      }
      setConfirmModal({ open: false, changes: {} });
      onAfterChange && onAfterChange();
    } finally {
      if (isSingle) setSavingDocId(null);
      if (!isSingle) setSavingAll(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {hasChanges ? <Badge variant="outline">Alterações pendentes</Badge> : "Sem alterações"}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEdited({})} disabled={!hasChanges || savingAll}>
            <RotateCcw className="mr-2 h-4 w-4" /> Descartar tudo
          </Button>
          <Button size="sm" onClick={saveAll} disabled={!hasChanges || savingAll}>
            {savingAll ? <span className="animate-pulse">Salvando...</span> : (<><Save className="mr-2 h-4 w-4" /> Salvar tudo</>)}
          </Button>
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px]">Documento</TableHead>
              {columns.map((c) => (
                <TableHead key={c} className="min-w-[180px]">{c}</TableHead>
              ))}
              <TableHead className="w-[160px] text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => {
              const rowChanges = edited[doc.id] || {};
              return (
                <TableRow key={doc.id}>
                  <TableCell className="font-mono text-xs align-top">
                    {doc.id}
                    {rowChanges && Object.keys(rowChanges).length > 0 && (
                      <div className="text-[10px] text-amber-700">{Object.keys(rowChanges).length} campo(s) editado(s)</div>
                    )}
                  </TableCell>
                  {columns.map((field) => {
                    const original = (doc as any)[field];
                    const value = field in rowChanges ? rowChanges[field] : original;
                    const changed = field in rowChanges;

                    // render por tipo
                    let control: React.ReactNode;
                    if (isPrimitive(original) || isPrimitive(value)) {
                      if (typeof value === "boolean" || typeof original === "boolean") {
                        control = (
                          <div className="flex items-center gap-2">
                            <Switch checked={!!value} onCheckedChange={(v) => setField(doc.id, field, !!v)} />
                            {changed && <Badge variant="secondary">editado</Badge>}
                          </div>
                        );
                      } else if (typeof value === 'number' || typeof original === 'number') {
                        const numeric = typeof value === 'number' ? value : (typeof original === 'number' ? original : 0);
                        const looksMillis = isMillisTimestamp(numeric, field);
                        control = (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Input
                                value={String(value ?? '')}
                                onChange={(e) => {
                                  const raw = e.target.value.trim();
                                  const asNum = Number(raw);
                                  setField(doc.id, field, isNaN(asNum) ? raw : asNum);
                                }}
                                className={changed ? "border-amber-500" : ""}
                              />
                              {changed && <Badge variant="secondary">editado</Badge>}
                            </div>
                            {looksMillis && (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="datetime-local"
                                  value={toLocalDatetimeInputValue(numeric)}
                                  onChange={(e) => {
                                    const ms = fromLocalDatetimeInputValue(e.target.value);
                                    if (ms !== null) setField(doc.id, field, ms);
                                  }}
                                />
                                <span className="text-xs text-muted-foreground">ms</span>
                              </div>
                            )}
                          </div>
                        );
                      } else {
                        control = (
                          <div className="flex items-center gap-2">
                            <Input
                              value={value ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                // tenta preservar número se original for número
                                if (typeof original === "number") {
                                  const asNum = Number(raw);
                                  setField(doc.id, field, isNaN(asNum) ? raw : asNum);
                                } else {
                                  setField(doc.id, field, raw);
                                }
                              }}
                              className={changed ? "border-amber-500" : ""}
                            />
                            {changed && <Badge variant="secondary">editado</Badge>}
                          </div>
                        );
                      }
                    } else {
                      control = (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openJsonEditor(doc.id, field, value)}>
                            <FileJson className="mr-2 h-4 w-4" /> Editar JSON
                          </Button>
                          {changed && <Badge variant="secondary">editado</Badge>}
                        </div>
                      );
                    }

                    return (
                      <TableCell key={field} className="align-top">
                        {control}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center align-top">
                    <div className="flex justify-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => discardRow(doc.id)} disabled={!edited[doc.id] || savingDocId === doc.id}>
                        Descartar
                      </Button>
                      <Button size="sm" onClick={() => saveRow(doc.id)} disabled={!edited[doc.id] || savingDocId === doc.id}>
                        {savingDocId === doc.id ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={async () => {
                        setHistoryDrawer({ open: true, docId: doc.id, logs: [], loading: true });
                        const logs = await getDevAuditLogsForDocument(collectionId, doc.id, 100);
                        setHistoryDrawer({ open: true, docId: doc.id, logs, loading: false });
                      }}>
                        <History className="mr-2 h-4 w-4" /> Ver histórico
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Inline create row */}
            <TableRow>
              <TableCell className="align-top" colSpan={1}>
                <Button size="sm" variant={createRow.enabled ? "outline" : "default"} onClick={() => setCreateRow((p) => ({ ...p, enabled: !p.enabled }))}>
                  <PlusCircle className="mr-2 h-4 w-4" /> {createRow.enabled ? "Cancelar novo" : "+ Novo"}
                </Button>
              </TableCell>
              {columns.map((field) => (
                <TableCell key={`new-${field}`} className="align-top">
                  <span className="text-xs text-muted-foreground">Preencha no JSON</span>
                </TableCell>
              ))}
              <TableCell className="text-center align-top">
                {createRow.enabled && (
                  <div className="space-y-2">
                    <Input placeholder="ID opcional" value={createRow.docId} onChange={(e) => setCreateRow((p) => ({ ...p, docId: e.target.value }))} />
                    <textarea
                      className="w-full h-28 p-2 font-mono text-sm border rounded-md"
                      value={createRow.dataText}
                      onChange={(e) => {
                        const txt = e.target.value;
                        let err: string | null = null;
                        try { JSON.parse(txt); } catch { err = "JSON inválido"; }
                        setCreateRow((p) => ({ ...p, dataText: txt, parseError: err }));
                      }}
                    />
                    {createRow.parseError && <div className="text-xs text-destructive">{createRow.parseError}</div>}
                    <Button size="sm" disabled={!!createRow.parseError} onClick={async () => {
                      const data = JSON.parse(createRow.dataText || '{}');
                      await createDocument(collectionId, data, createRow.docId || undefined);
                      setCreateRow({ enabled: false, docId: "", dataText: '{\n  "field": "value"\n}', parseError: null });
                      // não temos fetch aqui; pai recarrega ao salvar via onSaveMany ou podemos emitir evento
                      // estratégia simples: no admin pai, após create modal, já refaz fetch.
                      // aqui deixamos o fluxo com feedback visual mínimo.
                      onAfterChange && onAfterChange();
                    }}>
                      <Save className="mr-2 h-4 w-4" /> Criar documento
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
            {documents.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="h-24 text-center">
                  Nenhum documento para exibir.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={jsonFieldModal.open} onOpenChange={(o) => setJsonFieldModal((p) => ({ ...p, open: o }))}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar JSON {jsonFieldModal.field ? `(${jsonFieldModal.field})` : ""}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <textarea
              value={jsonFieldModal.value}
              onChange={(e) => {
                const val = e.target.value;
                let err: string | null = null;
                try { JSON.parse(val); } catch { err = "JSON inválido"; }
                setJsonFieldModal((p) => ({ ...p, value: val, parseError: err }));
              }}
              className="w-full h-72 p-2 font-mono text-sm border rounded-md"
            />
            {jsonFieldModal.parseError && (
              <div className="text-sm text-destructive mt-2">{jsonFieldModal.parseError}</div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJsonFieldModal({ open: false, docId: null, field: null, value: "", parseError: null })}>Cancelar</Button>
            <Button onClick={applyJsonEditor} disabled={!!jsonFieldModal.parseError}>
              <Save className="mr-2 h-4 w-4" /> Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm diff modal */}
      <Dialog open={confirmModal.open} onOpenChange={(o) => setConfirmModal((p) => ({ ...p, open: o }))}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Confirmar salvamento</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="text-sm text-muted-foreground mb-3">
              {Object.keys(confirmModal.changes).length} documento(s) serão atualizados.
            </div>
            <div className="max-h-[420px] overflow-auto border rounded-md p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Campo</TableHead>
                    <TableHead>De</TableHead>
                    <TableHead>Para</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(confirmModal.changes).map(([docId, fields]) => {
                    const original = documents.find(d => d.id === docId) || { id: docId } as any;
                    return Object.entries(fields).map(([field, newVal], idx) => {
                      const oldVal = (original as any)[field];
                      return (
                        <TableRow key={`${docId}-${field}-${idx}`}>
                          <TableCell className="font-mono text-xs">{docId}</TableCell>
                          <TableCell className="font-mono text-xs">{field}</TableCell>
                          <TableCell className="text-xs">{renderValue(oldVal)}</TableCell>
                          <TableCell className="text-xs">{renderValue(newVal)}</TableCell>
                        </TableRow>
                      );
                    });
                  })}
                </TableBody>
              </Table>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModal({ open: false, changes: {} })}>Cancelar</Button>
            <Button onClick={proceedSave}>
              <Save className="mr-2 h-4 w-4" /> Confirmar e salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History drawer */}
      <Sheet open={historyDrawer.open} onOpenChange={(o) => setHistoryDrawer((p) => ({ ...p, open: o }))}>
        <SheetContent side="right" className="w-[480px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Histórico de alterações</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {historyDrawer.loading ? (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : historyDrawer.logs.length === 0 ? (
              <div className="text-sm text-muted-foreground">Sem registros</div>
            ) : (
              <div className="space-y-3">
                {historyDrawer.logs.map((log) => (
                  <div key={log.id} className="border rounded-md p-2 text-sm">
                    <div className="flex justify-between">
                      <div><b>Ação:</b> {log.action}</div>
                      <div className="font-mono">{new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                    {log.changes && (
                      <pre className="text-[10px] bg-muted/40 p-2 rounded mt-2 overflow-auto">{JSON.stringify(log.changes, null, 2)}</pre>
                    )}
                    {log.user && <div className="mt-1 text-xs text-muted-foreground">por {log.user}</div>}
                    {/* Reverter se tiver diff */}
                    {log.changes && log.changes.diff && historyDrawer.docId && (
                      <div className="mt-2">
                        <Button size="sm" variant="outline" onClick={async () => {
                          const beforeValues: Record<string, any> = {};
                          for (const k of Object.keys(log.changes.diff)) {
                            beforeValues[k] = log.changes.diff[k].before;
                          }
                          await revertDocumentFields(collectionId, historyDrawer.docId!, beforeValues);
                          onAfterChange && onAfterChange();
                        }}>Reverter</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function renderValue(v: any): React.ReactNode {
  if (v === null || v === undefined) return <span className="text-muted-foreground">—</span>;
  if (typeof v === 'boolean') return <Badge variant={v ? 'secondary' : 'outline'}>{String(v)}</Badge>;
  if (typeof v === 'number') return <span className="font-mono">{v}</span>;
  if (typeof v === 'string') return <span className="font-mono break-all">{v}</span>;
  try { return <pre className="text-[10px] bg-muted/40 p-1 rounded">{JSON.stringify(v, null, 2)}</pre>; } catch { return String(v); }
}
