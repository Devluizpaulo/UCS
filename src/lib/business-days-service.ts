'use server';

import { format, isWeekend, parseISO } from 'date-fns';

/**
 * Serviço para verificação de dias úteis, fins de semana e feriados
 * Integra com API automática de feriados brasileiros
 */

// Cache para feriados por ano
const holidaysCache = new Map<number, Set<string>>();

// TTL do cache: 24 horas
const CACHE_TTL = 24 * 60 * 60 * 1000;
let lastCacheUpdate = 0;

interface Holiday {
  date: string;
  name: string;
  type: string;
}

interface BusinessDayValidation {
  isBusinessDay: boolean;
  reason?: string;
  holidayName?: string;
}

/**
 * Busca feriados brasileiros de uma API pública
 * Usa a API do Brasil API (https://brasilapi.com.br/)
 */
async function fetchHolidays(year: number): Promise<Holiday[]> {
  try {
    const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'UCS-Sistema/1.0'
      },
      // Cache por 1 hora
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      console.warn(`[BusinessDays] Erro ao buscar feriados para ${year}: ${response.status}`);
      return [];
    }

    const holidays: Holiday[] = await response.json();
    console.log(`[BusinessDays] Feriados carregados para ${year}: ${holidays.length} feriados`);
    
    return holidays;
  } catch (error) {
    console.error(`[BusinessDays] Erro ao buscar feriados para ${year}:`, error);
    return [];
  }
}

/**
 * Carrega e cacheia feriados para um ano específico
 */
async function loadHolidaysForYear(year: number): Promise<Set<string>> {
  const now = Date.now();
  
  // Verifica se o cache ainda é válido
  if (holidaysCache.has(year) && (now - lastCacheUpdate) < CACHE_TTL) {
    return holidaysCache.get(year)!;
  }

  try {
    const holidays = await fetchHolidays(year);
    const holidayDates = new Set<string>();

    holidays.forEach(holiday => {
      // Converte para formato dd/MM/yyyy para compatibilidade
      const date = parseISO(holiday.date);
      const formattedDate = format(date, 'dd/MM/yyyy');
      holidayDates.add(formattedDate);
    });

    // Adiciona feriados fixos adicionais se necessário
    const additionalHolidays = getAdditionalHolidays(year);
    additionalHolidays.forEach(date => holidayDates.add(date));

    holidaysCache.set(year, holidayDates);
    lastCacheUpdate = now;

    console.log(`[BusinessDays] Cache atualizado para ${year}: ${holidayDates.size} feriados`);
    return holidayDates;
  } catch (error) {
    console.error(`[BusinessDays] Erro ao carregar feriados para ${year}:`, error);
    
    // Retorna cache anterior se existir, senão retorna conjunto vazio
    return holidaysCache.get(year) || new Set<string>();
  }
}

/**
 * Feriados adicionais ou específicos que podem não estar na API
 * Pode incluir feriados municipais ou estaduais específicos
 */
function getAdditionalHolidays(year: number): string[] {
  const additional: string[] = [];
  
  // Exemplo: Consciência Negra (20 de novembro) - feriado em alguns estados/municípios
  additional.push(`20/11/${year}`);
  
  // Adicione outros feriados específicos da sua região aqui
  // additional.push(`15/11/${year}`); // Proclamação da República (se não estiver na API)
  
  return additional;
}

/**
 * Verifica se uma data é feriado
 */
async function isHoliday(date: Date): Promise<{ isHoliday: boolean; holidayName?: string }> {
  const year = date.getFullYear();
  const formattedDate = format(date, 'dd/MM/yyyy');
  
  try {
    const holidays = await loadHolidaysForYear(year);
    const isHoliday = holidays.has(formattedDate);
    
    if (isHoliday) {
      // Busca o nome do feriado na API para informação
      const holidayData = await fetchHolidays(year);
      const holiday = holidayData.find(h => {
        const holidayDate = format(parseISO(h.date), 'dd/MM/yyyy');
        return holidayDate === formattedDate;
      });
      
      return {
        isHoliday: true,
        holidayName: holiday?.name || 'Feriado'
      };
    }
    
    return { isHoliday: false };
  } catch (error) {
    console.error('[BusinessDays] Erro ao verificar feriado:', error);
    return { isHoliday: false };
  }
}

/**
 * Verifica se uma data é dia útil (não é fim de semana nem feriado)
 */
export async function isBusinessDay(date: Date): Promise<BusinessDayValidation> {
  try {
    // Verifica fim de semana
    if (isWeekend(date)) {
      const dayName = date.getDay() === 0 ? 'domingo' : 'sábado';
      return {
        isBusinessDay: false,
        reason: 'weekend',
        holidayName: `Fim de semana (${dayName})`
      };
    }

    // Verifica feriado
    const holidayCheck = await isHoliday(date);
    if (holidayCheck.isHoliday) {
      return {
        isBusinessDay: false,
        reason: 'holiday',
        holidayName: holidayCheck.holidayName
      };
    }

    return { isBusinessDay: true };
  } catch (error) {
    console.error('[BusinessDays] Erro ao verificar dia útil:', error);
    // Em caso de erro, assume que é dia útil para não bloquear operações críticas
    return { isBusinessDay: true };
  }
}

/**
 * Encontra o próximo dia útil a partir de uma data
 */
export async function getNextBusinessDay(date: Date): Promise<Date> {
  let nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  let attempts = 0;
  const maxAttempts = 10; // Evita loop infinito
  
  while (attempts < maxAttempts) {
    const validation = await isBusinessDay(nextDay);
    if (validation.isBusinessDay) {
      return nextDay;
    }
    
    nextDay.setDate(nextDay.getDate() + 1);
    attempts++;
  }
  
  // Fallback: retorna a data original + 1 dia
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Encontra o dia útil anterior a partir de uma data
 */
export async function getPreviousBusinessDay(date: Date): Promise<Date> {
  let prevDay = new Date(date);
  prevDay.setDate(prevDay.getDate() - 1);
  
  let attempts = 0;
  const maxAttempts = 10; // Evita loop infinito
  
  while (attempts < maxAttempts) {
    const validation = await isBusinessDay(prevDay);
    if (validation.isBusinessDay) {
      return prevDay;
    }
    
    prevDay.setDate(prevDay.getDate() - 1);
    attempts++;
  }
  
  // Fallback: retorna a data original - 1 dia
  return new Date(date.getTime() - 24 * 60 * 60 * 1000);
}

/**
 * Valida se operações de cotação podem ser realizadas na data atual
 */
export async function validateQuoteOperations(date?: Date): Promise<{
  allowed: boolean;
  message: string;
  suggestedDate?: Date;
}> {
  const targetDate = date || new Date();
  const validation = await isBusinessDay(targetDate);
  
  if (validation.isBusinessDay) {
    return {
      allowed: true,
      message: 'Operações de cotação permitidas'
    };
  }
  
  const nextBusinessDay = await getNextBusinessDay(targetDate);
  
  return {
    allowed: false,
    message: `Operações de cotação não permitidas: ${validation.holidayName}. Próximo dia útil: ${format(nextBusinessDay, 'dd/MM/yyyy')}`,
    suggestedDate: nextBusinessDay
  };
}

/**
 * Limpa o cache de feriados (útil para testes ou atualizações forçadas)
 */
export async function clearHolidaysCache(): Promise<void> {
  holidaysCache.clear();
  lastCacheUpdate = 0;
  console.log('[BusinessDays] Cache de feriados limpo');
}

/**
 * Obtém estatísticas do cache para monitoramento
 */
export async function getCacheStats(): Promise<{
  cachedYears: number[];
  lastUpdate: Date | null;
  cacheAge: number;
}> {
  return {
    cachedYears: Array.from(holidaysCache.keys()),
    lastUpdate: lastCacheUpdate > 0 ? new Date(lastCacheUpdate) : null,
    cacheAge: lastCacheUpdate > 0 ? Date.now() - lastCacheUpdate : 0
  };
}
