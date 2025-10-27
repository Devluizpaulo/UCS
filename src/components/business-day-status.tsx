'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BusinessDayStatus {
  currentTime: Date;
  isBusinessDay: boolean;
  allowedOperations: string[];
  restrictions: string[];
  nextBusinessDay?: Date;
}

interface BusinessDayStatusProps {
  onRefresh?: () => void;
  showDetails?: boolean;
}

export function BusinessDayStatus({ onRefresh, showDetails = true }: BusinessDayStatusProps) {
  const [status, setStatus] = useState<BusinessDayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simula chamada para o servidor - você deve implementar a rota correspondente
      const response = await fetch('/api/business-day-status');
      if (!response.ok) {
        throw new Error('Erro ao buscar status de dias úteis');
      }
      
      const data = await response.json();
      setStatus({
        ...data,
        currentTime: new Date(data.currentTime),
        nextBusinessDay: data.nextBusinessDay ? new Date(data.nextBusinessDay) : undefined
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao buscar status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Atualiza a cada minuto
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchStatus();
    onRefresh?.();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="mt-2 w-full"
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Status do Sistema
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            className="h-6 w-6 p-0"
          >
            <Clock className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status Principal */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Operações de Cotação:</span>
          <Badge 
            variant={status.isBusinessDay ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {status.isBusinessDay ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {status.isBusinessDay ? 'Permitidas' : 'Bloqueadas'}
          </Badge>
        </div>

        {/* Horário Atual */}
        <div className="text-xs text-muted-foreground">
          Atualizado em: {format(status.currentTime, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
        </div>

        {/* Restrições */}
        {status.restrictions.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {status.restrictions.map((restriction, index) => (
                <div key={index}>{restriction}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Próximo Dia Útil */}
        {!status.isBusinessDay && status.nextBusinessDay && (
          <div className="text-xs text-muted-foreground">
            Próximo dia útil: {format(status.nextBusinessDay, 'dd/MM/yyyy (EEEE)', { locale: ptBR })}
          </div>
        )}

        {/* Detalhes das Operações */}
        {showDetails && (
          <div className="space-y-2">
            <div className="text-xs font-medium">Operações Permitidas:</div>
            <div className="space-y-1">
              {status.allowedOperations.map((operation, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {operation}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente compacto para uso em headers
export function BusinessDayStatusCompact() {
  const [isBusinessDay, setIsBusinessDay] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/business-day-status');
        if (response.ok) {
          const data = await response.json();
          setIsBusinessDay(data.isBusinessDay);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 300000); // 5 minutos
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <Clock className="h-3 w-3 mr-1" />
        Verificando...
      </Badge>
    );
  }

  return (
    <Badge 
      variant={isBusinessDay ? "default" : "destructive"}
      className="flex items-center gap-1"
    >
      {isBusinessDay ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {isBusinessDay ? 'Dia Útil' : 'Feriado/FDS'}
    </Badge>
  );
}
