'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

interface BusinessDayValidation {
  allowed: boolean;
  message: string;
  isBusinessDay: boolean;
  holidayName?: string;
  suggestedDate?: Date;
}

interface UseBusinessDayValidationOptions {
  autoCheck?: boolean;
  checkInterval?: number; // em milissegundos
}

export function useBusinessDayValidation(options: UseBusinessDayValidationOptions = {}) {
  const { autoCheck = true, checkInterval = 300000 } = options; // 5 minutos por padrão
  
  const [currentStatus, setCurrentStatus] = useState<BusinessDayValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateDate = useCallback(async (date?: Date): Promise<BusinessDayValidation | null> => {
    try {
      setLoading(true);
      setError(null);

      const targetDate = date || new Date();
      const response = await fetch('/api/business-day-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: targetDate.toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na validação: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro na validação');
      }

      const validation: BusinessDayValidation = {
        allowed: data.allowed,
        message: data.message,
        isBusinessDay: data.isBusinessDay,
        holidayName: data.holidayName,
        suggestedDate: data.suggestedDate ? new Date(data.suggestedDate) : undefined
      };

      if (!date) {
        setCurrentStatus(validation);
      }

      return validation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro na validação de dia útil:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkCurrentDate = useCallback(() => {
    return validateDate();
  }, [validateDate]);

  // Auto-check do status atual
  useEffect(() => {
    if (autoCheck) {
      checkCurrentDate();
      
      const interval = setInterval(checkCurrentDate, checkInterval);
      return () => clearInterval(interval);
    }
  }, [autoCheck, checkInterval, checkCurrentDate]);

  return {
    currentStatus,
    loading,
    error,
    validateDate,
    checkCurrentDate,
    // Helpers
    isCurrentlyAllowed: currentStatus?.allowed ?? false,
    isBusinessDay: currentStatus?.isBusinessDay ?? false,
    currentMessage: currentStatus?.message ?? '',
    nextBusinessDay: currentStatus?.suggestedDate,
  };
}

// Hook específico para operações de cotação
export function useQuoteOperationValidation() {
  const validation = useBusinessDayValidation();
  
  const validateQuoteOperation = useCallback(async (date?: Date) => {
    const result = await validation.validateDate(date);
    
    if (!result) {
      return {
        canProceed: false,
        message: 'Erro na validação. Tente novamente.',
        showWarning: true
      };
    }

    return {
      canProceed: result.allowed,
      message: result.message,
      showWarning: !result.allowed,
      suggestedDate: result.suggestedDate,
      holidayName: result.holidayName
    };
  }, [validation]);

  const getOperationMessage = useCallback((operationType: string = 'cotação') => {
    if (!validation.currentStatus) {
      return `Verificando permissões para ${operationType}...`;
    }

    if (validation.currentStatus.allowed) {
      return `${operationType} permitida`;
    }

    return `${operationType} não permitida: ${validation.currentStatus.holidayName || 'Dia não útil'}`;
  }, [validation.currentStatus]);

  return {
    ...validation,
    validateQuoteOperation,
    getOperationMessage,
    canCreateQuote: validation.isCurrentlyAllowed,
    canUpdateQuote: validation.isCurrentlyAllowed,
    canImportData: validation.isCurrentlyAllowed,
  };
}

// Hook para monitoramento de status em tempo real
export function useBusinessDayMonitor() {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchSystemStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/business-day-status');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Erro ao buscar status do sistema:', error);
    }
  }, []);

  useEffect(() => {
    fetchSystemStatus();
    
    // Atualiza a cada 2 minutos
    const interval = setInterval(fetchSystemStatus, 120000);
    return () => clearInterval(interval);
  }, [fetchSystemStatus]);

  return {
    systemStatus,
    lastUpdate,
    refresh: fetchSystemStatus,
    isOnline: !!systemStatus,
    allowedOperations: systemStatus?.allowedOperations || [],
    restrictions: systemStatus?.restrictions || [],
    nextBusinessDay: systemStatus?.nextBusinessDay ? new Date(systemStatus.nextBusinessDay) : null
  };
}

// Utilitários para formatação
export const businessDayUtils = {
  formatValidationMessage: (validation: BusinessDayValidation | null): string => {
    if (!validation) return 'Status desconhecido';
    return validation.message;
  },

  formatNextBusinessDay: (date: Date | undefined): string => {
    if (!date) return 'Não disponível';
    return format(date, 'dd/MM/yyyy (EEEE)', { locale: require('date-fns/locale/pt-BR') });
  },

  getStatusColor: (allowed: boolean): string => {
    return allowed ? 'text-green-600' : 'text-red-600';
  },

  getStatusIcon: (allowed: boolean): string => {
    return allowed ? '✅' : '❌';
  }
};
