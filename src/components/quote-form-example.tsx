'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useQuoteOperationValidation } from '@/hooks/use-business-day-validation';
import { createOrUpdateQuoteWithValidation } from '@/lib/data-service';
import { useToast } from '@/hooks/use-toast';

/**
 * Exemplo de formulário de cotação com validação de dias úteis integrada
 * Este componente demonstra como usar o sistema de validação em formulários
 */

interface QuoteFormData {
  assetId: string;
  date: Date;
  price: string;
  source: string;
}

const ASSETS = [
  { id: 'milho', name: 'Milho' },
  { id: 'soja', name: 'Soja' },
  { id: 'boi_gordo', name: 'Boi Gordo' },
  { id: 'madeira', name: 'Madeira' },
  { id: 'carbono', name: 'Carbono' },
];

export function QuoteFormExample() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<QuoteFormData>({
    assetId: '',
    date: new Date(),
    price: '',
    source: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const {
    canCreateQuote,
    validateQuoteOperation,
    getOperationMessage,
    loading: validationLoading,
    currentStatus
  } = useQuoteOperationValidation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.assetId || !formData.price || !formData.source) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Validação de dia útil
      const validation = await validateQuoteOperation(formData.date);
      
      if (!validation.canProceed) {
        toast({
          variant: 'destructive',
          title: 'Operação não permitida',
          description: validation.message
        });
        return;
      }

      // Criar cotação
      const result = await createOrUpdateQuoteWithValidation(
        formData.assetId,
        formData.date,
        {
          valor: parseFloat(formData.price),
          fonte: formData.source,
          tipo: 'manual'
        }
      );

      if (result.success) {
        toast({
          title: 'Cotação salva',
          description: result.message
        });
        
        // Reset form
        setFormData({
          assetId: '',
          date: new Date(),
          price: '',
          source: ''
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: result.message
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro inesperado',
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, date }));
      setDatePickerOpen(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Criar Cotação
          {validationLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Status de Validação */}
        <Alert className={cn(
          "mb-4",
          currentStatus?.allowed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
        )}>
          {currentStatus?.allowed ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={cn(
            currentStatus?.allowed ? "text-green-800" : "text-red-800"
          )}>
            {getOperationMessage('Criação de cotação')}
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ativo */}
          <div className="space-y-2">
            <Label htmlFor="asset">Ativo *</Label>
            <Select
              value={formData.assetId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assetId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um ativo" />
              </SelectTrigger>
              <SelectContent>
                {ASSETS.map(asset => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label>Data *</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? (
                    format(formData.date, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    "Selecione uma data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={handleDateChange}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Preço */}
          <div className="space-y-2">
            <Label htmlFor="price">Preço *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            />
          </div>

          {/* Fonte */}
          <div className="space-y-2">
            <Label htmlFor="source">Fonte *</Label>
            <Input
              id="source"
              placeholder="Ex: Bloomberg, Reuters, Manual"
              value={formData.source}
              onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
            />
          </div>

          {/* Botão de Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={!canCreateQuote || isSubmitting || validationLoading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Cotação'
            )}
          </Button>

          {/* Informações adicionais */}
          {!canCreateQuote && currentStatus && (
            <div className="text-sm text-muted-foreground">
              {currentStatus.suggestedDate && (
                <p>
                  Próximo dia útil: {format(currentStatus.suggestedDate, 'dd/MM/yyyy (EEEE)', { locale: ptBR })}
                </p>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

// Componente de demonstração para mostrar diferentes cenários
export function QuoteValidationDemo() {
  const [testDate, setTestDate] = useState<Date>(new Date());
  const [validationResult, setValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testValidation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/business-day-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: testDate.toISOString() })
      });
      
      const result = await response.json();
      setValidationResult(result);
    } catch (error) {
      console.error('Erro no teste:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Teste de Validação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Data para testar</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(testDate, "dd/MM/yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={testDate}
                onSelect={(date) => date && setTestDate(date)}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button onClick={testValidation} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testando...
            </>
          ) : (
            'Testar Validação'
          )}
        </Button>

        {validationResult && (
          <Alert className={cn(
            validationResult.allowed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
          )}>
            {validationResult.allowed ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Status:</strong> {validationResult.allowed ? 'Permitido' : 'Bloqueado'}</p>
                <p><strong>Mensagem:</strong> {validationResult.message}</p>
                {validationResult.holidayName && (
                  <p><strong>Motivo:</strong> {validationResult.holidayName}</p>
                )}
                {validationResult.suggestedDate && (
                  <p><strong>Próximo dia útil:</strong> {format(new Date(validationResult.suggestedDate), 'dd/MM/yyyy')}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
