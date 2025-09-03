
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { ReportPreviewData } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Download, File as FileIcon, FileSpreadsheet, Share2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onShare: () => Promise<void>;
  previewData: ReportPreviewData;
  format: 'pdf' | 'xlsx';
  isSharing: boolean;
}

export function ReportPreviewModal({
  isOpen,
  onClose,
  onDownload,
  onShare,
  previewData,
  format,
  isSharing,
}: ReportPreviewModalProps) {
  const { reportTitle, periodTitle, analysisText, ucsHistory, assets } = previewData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{reportTitle}</DialogTitle>
          <DialogDescription>{periodTitle}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-6 -mr-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                    <h3 className="font-semibold text-lg mb-2 border-b pb-2">Análise Executiva da IA</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {analysisText}
                    </p>
                </div>
                 <div className="flex flex-col">
                    <h3 className="font-semibold text-lg mb-2">Histórico do Índice UCS</h3>
                    <div className="border rounded-md flex-1">
                        <ScrollArea className="h-72">
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10">
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead className="text-right">Valor (R$)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ucsHistory.slice().reverse().map(item => (
                                        <TableRow key={item.time}>
                                            <TableCell>{item.time}</TableCell>
                                            <TableCell className="text-right font-mono">{item.value.toFixed(4)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </div>

                <div className="flex flex-col">
                    <h3 className="font-semibold text-lg mb-2">Performance dos Ativos</h3>
                    <div className="border rounded-md flex-1">
                        <ScrollArea className="h-72">
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10">
                                    <TableRow>
                                        <TableHead>Ativo</TableHead>
                                        <TableHead className="text-right">Preço</TableHead>
                                        <TableHead className="text-right">Variação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assets.map(asset => (
                                        <TableRow key={asset.name}>
                                            <TableCell className="font-medium text-xs">{asset.name}</TableCell>
                                            <TableCell className="text-right font-mono text-xs">
                                                {asset.currency === 'BRL' ? 'R$ ' : '$ '}
                                                {asset.price.toFixed(2)}
                                            </TableCell>
                                            <TableCell className={`text-right font-mono text-xs ${asset.change >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                                {asset.change.toFixed(2)}%
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </div>
            </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t sm:justify-between">
            <Button
              variant="outline"
              onClick={onShare}
              disabled={isSharing}
            >
              <Share2 className="mr-2 h-4 w-4" />
              {isSharing ? 'Compartilhando...' : 'Compartilhar'}
            </Button>
            <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={onClose}>
                    Cancelar
                </Button>
                <Button onClick={onDownload}>
                    {format === 'pdf' ? <FileIcon className="mr-2 h-4 w-4" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
                    Baixar Relatório .{format}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
