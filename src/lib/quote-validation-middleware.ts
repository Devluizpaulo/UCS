'use server';

import { validateQuoteOperations, isBusinessDay } from './business-days-service';
import { format } from 'date-fns';

/**
 * Middleware para validação de operações de cotação
 * Impede operações em fins de semana e feriados
 */

export interface QuoteValidationResult {
  success: boolean;
  message: string;
  code: 'ALLOWED' | 'WEEKEND' | 'HOLIDAY' | 'ERROR';
  suggestedDate?: Date;
  originalDate: Date;
}

export interface QuoteOperationOptions {
  allowHistorical?: boolean; // Permite operações em dados históricos
  bypassValidation?: boolean; // Bypass para operações administrativas
  operationType?: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';
}

/**
 * Valida se uma operação de cotação pode ser executada
 */
export async function validateQuoteOperation(
  date: Date = new Date(),
  options: QuoteOperationOptions = {}
): Promise<QuoteValidationResult> {
  const {
    allowHistorical = true,
    bypassValidation = false,
    operationType = 'CREATE'
  } = options;

  try {
    // Bypass para operações administrativas ou de leitura
    if (bypassValidation || operationType === 'READ') {
      return {
        success: true,
        message: 'Operação permitida (bypass ou leitura)',
        code: 'ALLOWED',
        originalDate: date
      };
    }

    // Para operações históricas, permite se a flag estiver ativa
    const today = new Date();
    const isHistoricalOperation = date < today;
    
    if (isHistoricalOperation && allowHistorical) {
      return {
        success: true,
        message: 'Operação histórica permitida',
        code: 'ALLOWED',
        originalDate: date
      };
    }

    // Valida se é dia útil
    const validation = await validateQuoteOperations(date);
    
    if (validation.allowed) {
      return {
        success: true,
        message: validation.message,
        code: 'ALLOWED',
        originalDate: date
      };
    }

    // Determina o código de erro baseado no tipo de dia não útil
    const businessDayCheck = await isBusinessDay(date);
    const errorCode = businessDayCheck.reason === 'weekend' ? 'WEEKEND' : 'HOLIDAY';

    return {
      success: false,
      message: validation.message,
      code: errorCode,
      suggestedDate: validation.suggestedDate,
      originalDate: date
    };

  } catch (error) {
    console.error('[QuoteValidation] Erro na validação:', error);
    return {
      success: false,
      message: 'Erro interno na validação de cotações',
      code: 'ERROR',
      originalDate: date
    };
  }
}

/**
 * Decorator para funções que manipulam cotações
 */
export async function withQuoteValidation(options: QuoteOperationOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Tenta extrair a data do primeiro argumento ou usa a data atual
      const date = args.length > 0 && args[0] instanceof Date ? args[0] : new Date();
      
      const validation = await validateQuoteOperation(date, options);
      
      if (!validation.success) {
        throw new Error(`[QuoteValidation] ${validation.message}`);
      }

      return method.apply(this, args);
    };
  };
}

/**
 * Função helper para validar operações em lote
 */
export async function validateBatchQuoteOperations(
  dates: Date[],
  options: QuoteOperationOptions = {}
): Promise<{
  validDates: Date[];
  invalidDates: { date: Date; reason: string }[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}> {
  const validDates: Date[] = [];
  const invalidDates: { date: Date; reason: string }[] = [];

  for (const date of dates) {
    const validation = await validateQuoteOperation(date, options);
    
    if (validation.success) {
      validDates.push(date);
    } else {
      invalidDates.push({
        date,
        reason: validation.message
      });
    }
  }

  return {
    validDates,
    invalidDates,
    summary: {
      total: dates.length,
      valid: validDates.length,
      invalid: invalidDates.length
    }
  };
}

/**
 * Middleware para APIs/rotas que lidam com cotações
 */
export async function quoteApiMiddleware(
  request: any,
  options: QuoteOperationOptions = {}
): Promise<{ allowed: boolean; response?: any }> {
  try {
    // Extrai a data da requisição (pode estar no body, query ou usar data atual)
    let targetDate = new Date();
    
    if (request.body?.date) {
      targetDate = new Date(request.body.date);
    } else if (request.query?.date) {
      targetDate = new Date(request.query.date);
    }

    const validation = await validateQuoteOperation(targetDate, options);
    
    if (!validation.success) {
      return {
        allowed: false,
        response: {
          error: true,
          message: validation.message,
          code: validation.code,
          suggestedDate: validation.suggestedDate ? format(validation.suggestedDate, 'yyyy-MM-dd') : null,
          timestamp: new Date().toISOString()
        }
      };
    }

    return { allowed: true };
  } catch (error) {
    return {
      allowed: false,
      response: {
        error: true,
        message: 'Erro interno na validação',
        code: 'ERROR',
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Função para verificar se o sistema deve permitir cotações no momento atual
 */
export async function isQuotingAllowed(): Promise<{
  allowed: boolean;
  message: string;
  nextAllowedDate?: Date;
}> {
  const validation = await validateQuoteOperation();
  
  return {
    allowed: validation.success,
    message: validation.message,
    nextAllowedDate: validation.suggestedDate
  };
}

/**
 * Função para obter informações sobre o status atual do sistema de cotações
 */
export async function getQuotingSystemStatus(): Promise<{
  currentTime: Date;
  isBusinessDay: boolean;
  allowedOperations: string[];
  restrictions: string[];
  nextBusinessDay?: Date;
}> {
  const now = new Date();
  const businessDayCheck = await isBusinessDay(now);
  const validation = await validateQuoteOperations(now);
  
  const allowedOperations: string[] = [];
  const restrictions: string[] = [];
  
  if (businessDayCheck.isBusinessDay) {
    allowedOperations.push('Criação de cotações', 'Atualização de preços', 'Importação de dados');
  } else {
    restrictions.push(`Operações bloqueadas: ${businessDayCheck.holidayName}`);
  }
  
  // Operações sempre permitidas
  allowedOperations.push('Consulta de dados históricos', 'Geração de relatórios', 'Exportação de dados');
  
  return {
    currentTime: now,
    isBusinessDay: businessDayCheck.isBusinessDay,
    allowedOperations,
    restrictions,
    nextBusinessDay: validation.suggestedDate
  };
}
