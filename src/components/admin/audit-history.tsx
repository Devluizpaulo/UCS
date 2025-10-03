'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User, Edit, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/formatters';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: 'edit' | 'recalculate' | 'create' | 'delete';
  assetId: string;
  assetName: string;
  oldValue?: number;
  newValue?: number;
  user: string;
  details?: string;
  affectedAssets?: string[];
}

interface AuditHistoryProps {
  targetDate: Date;
  logs: AuditLogEntry[];
  isLoading?: boolean;
}

function getActionIcon(action: string) {
  switch (action) {
    case 'edit':
      return <Edit className="h-4 w-4 text-blue-600" />;
    case 'recalculate':
      return <RefreshCw className="h-4 w-4 text-green-600" />;
    case 'create':
      return <AlertCircle className="h-4 w-4 text-purple-600" />;
    case 'delete':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
}

function getActionBadge(action: string) {
  switch (action) {
    case 'edit':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700">Edição</Badge>;
    case 'recalculate':
      return <Badge variant="outline" className="bg-green-50 text-green-700">Recálculo</Badge>;
    case 'create':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700">Criação</Badge>;
    case 'delete':
      return <Badge variant="destructive">Exclusão</Badge>;
    default:
      return <Badge variant="secondary">Desconhecido</Badge>;
  }
}

export function AuditHistory({ targetDate, logs, isLoading = false }: AuditHistoryProps) {
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Auditoria
          </CardTitle>
          <CardDescription>
            Carregando histórico de alterações para {format(targetDate, 'dd/MM/yyyy', { locale: ptBR })}...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Auditoria
          </CardTitle>
          <CardDescription>
            Histórico de alterações para {format(targetDate, 'dd/MM/yyyy', { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground p-8">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Nenhuma alteração registrada para esta data.</p>
            <p className="text-xs mt-2">As alterações aparecerão aqui após edições ou recálculos.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de Auditoria
        </CardTitle>
        <CardDescription>
          {logs.length} alteração(ões) registrada(s) para {format(targetDate, 'dd/MM/yyyy', { locale: ptBR })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead>Alteração</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead className="w-[100px]">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <>
                  <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      {format(log.timestamp, 'HH:mm:ss', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        {getActionBadge(log.action)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.assetName}
                      <div className="text-xs text-muted-foreground">{log.assetId}</div>
                    </TableCell>
                    <TableCell>
                      {log.action === 'edit' && log.oldValue !== undefined && log.newValue !== undefined ? (
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="text-red-600 line-through">
                              {formatCurrency(log.oldValue, 'BRL', log.assetId)}
                            </span>
                            {' → '}
                            <span className="text-green-600 font-semibold">
                              {formatCurrency(log.newValue, 'BRL', log.assetId)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Variação: {((log.newValue - log.oldValue) / (log.oldValue || 1) * 100).toFixed(2)}%
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {log.details || 'Sem detalhes'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{log.user}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.affectedAssets && log.affectedAssets.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        >
                          {expandedLog === log.id ? 'Ocultar' : 'Ver mais'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedLog === log.id && log.affectedAssets && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/30">
                        <div className="p-4">
                          <h4 className="font-semibold mb-2">Ativos Afetados pelo Recálculo:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {log.affectedAssets.map((assetId) => (
                              <Badge key={assetId} variant="outline" className="text-xs">
                                {assetId}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
