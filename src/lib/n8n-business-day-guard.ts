'use server';

import { isBusinessDay } from './business-days-service';
import { format } from 'date-fns';

/**
 * Guard específico para operações do N8N
 * Impede que o N8N processe cotações em fins de semana e feriados
 */

interface N8NValidationResult {
  allowed: boolean;
  message: string;
  shouldProcess: boolean;
  skipReason?: string;
}

/**
 * Valida se o N8N deve processar cotações para uma data específica
 */
export async function validateN8NProcessing(date: Date): Promise<N8NValidationResult> {
  try {
    const businessDayCheck = await isBusinessDay(date);
    const formattedDate = format(date, 'dd/MM/yyyy');
    
    if (businessDayCheck.isBusinessDay) {
      return {
        allowed: true,
        message: `Processamento autorizado para ${formattedDate}`,
        shouldProcess: true
      };
    }

    return {
      allowed: false,
      message: `Processamento bloqueado para ${formattedDate}: ${businessDayCheck.holidayName}`,
      shouldProcess: false,
      skipReason: businessDayCheck.holidayName
    };
  } catch (error) {
    console.error('[N8N Guard] Erro na validação:', error);
    
    // Em caso de erro, permite o processamento para não quebrar o sistema
    return {
      allowed: true,
      message: 'Processamento autorizado (erro na validação)',
      shouldProcess: true,
      skipReason: 'Erro na validação de feriados'
    };
  }
}

/**
 * Middleware para webhooks do N8N
 * Deve ser chamado antes de processar qualquer cotação
 */
export async function n8nBusinessDayMiddleware(
  requestData: any
): Promise<{
  proceed: boolean;
  response?: any;
  logMessage: string;
}> {
  try {
    // Extrai a data da requisição
    let targetDate = new Date();
    
    if (requestData.data_especifica) {
      targetDate = new Date(requestData.data_especifica);
    } else if (requestData.date) {
      targetDate = new Date(requestData.date);
    } else if (requestData.data) {
      // Formato brasileiro dd/MM/yyyy
      const [day, month, year] = requestData.data.split('/');
      targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    const validation = await validateN8NProcessing(targetDate);
    
    if (validation.shouldProcess) {
      return {
        proceed: true,
        logMessage: `[N8N Guard] ${validation.message}`
      };
    }

    // Bloqueia o processamento
    return {
      proceed: false,
      response: {
        success: false,
        message: validation.message,
        skipReason: validation.skipReason,
        date: format(targetDate, 'yyyy-MM-dd'),
        timestamp: new Date().toISOString(),
        businessDayValidation: false
      },
      logMessage: `[N8N Guard] BLOQUEADO - ${validation.message}`
    };

  } catch (error) {
    console.error('[N8N Guard] Erro no middleware:', error);
    
    // Em caso de erro, permite o processamento
    return {
      proceed: true,
      logMessage: `[N8N Guard] Erro na validação, permitindo processamento: ${error}`
    };
  }
}

/**
 * Valida lote de datas para processamento em massa
 */
export async function validateN8NBatchProcessing(
  dates: Date[]
): Promise<{
  validDates: Date[];
  invalidDates: { date: Date; reason: string }[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    weekends: number;
    holidays: number;
  };
}> {
  const validDates: Date[] = [];
  const invalidDates: { date: Date; reason: string }[] = [];
  let weekends = 0;
  let holidays = 0;

  for (const date of dates) {
    const validation = await validateN8NProcessing(date);
    
    if (validation.shouldProcess) {
      validDates.push(date);
    } else {
      invalidDates.push({
        date,
        reason: validation.skipReason || 'Dia não útil'
      });
      
      // Conta tipos de bloqueio
      if (validation.skipReason?.includes('fim de semana') || 
          validation.skipReason?.includes('sábado') || 
          validation.skipReason?.includes('domingo')) {
        weekends++;
      } else {
        holidays++;
      }
    }
  }

  return {
    validDates,
    invalidDates,
    summary: {
      total: dates.length,
      valid: validDates.length,
      invalid: invalidDates.length,
      weekends,
      holidays
    }
  };
}

/**
 * Cria resposta padronizada para o N8N quando o processamento é bloqueado
 */
export async function createN8NBlockedResponse(
  date: Date,
  reason: string
): Promise<{
  success: boolean;
  message: string;
  data: any;
}> {
  return Promise.resolve({
    success: false,
    message: `Processamento bloqueado: ${reason}`,
    data: {
      date: format(date, 'yyyy-MM-dd'),
      formattedDate: format(date, 'dd/MM/yyyy'),
      reason,
      businessDay: false,
      timestamp: new Date().toISOString(),
      action: 'skipped',
      nextProcessingDate: null // Pode ser implementado se necessário
    }
  });
}

/**
 * Log estruturado para auditoria do N8N
 */
export async function logN8NBusinessDayAction(
  action: 'ALLOWED' | 'BLOCKED' | 'ERROR',
  date: Date,
  details: any = {}
): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    date: format(date, 'yyyy-MM-dd'),
    formattedDate: format(date, 'dd/MM/yyyy'),
    dayOfWeek: date.getDay(),
    ...details
  };

  console.log(`[N8N Business Day Guard] ${JSON.stringify(logEntry)}`);
  
  // Aqui você pode adicionar integração com sistema de logs externo se necessário
  // await sendToExternalLogging(logEntry);
}
