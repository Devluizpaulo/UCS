import { NextRequest, NextResponse } from 'next/server';
import { getQuotingSystemStatus } from '@/lib/quote-validation-middleware';

/**
 * API Route para obter o status atual do sistema de cotações
 * GET /api/business-day-status
 */
export async function GET(request: NextRequest) {
  try {
    const status = await getQuotingSystemStatus();
    
    return NextResponse.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('[API] Erro ao obter status de dias úteis:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * API Route para validar uma data específica
 * POST /api/business-day-status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date } = body;
    
    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data é obrigatória',
          message: 'Forneça uma data no formato ISO 8601'
        },
        { status: 400 }
      );
    }
    
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data inválida',
          message: 'Forneça uma data válida no formato ISO 8601'
        },
        { status: 400 }
      );
    }
    
    // Importa dinamicamente para evitar problemas de SSR
    const { validateQuoteOperationForDate } = await import('@/lib/data-service');
    const validation = await validateQuoteOperationForDate(targetDate);
    
    return NextResponse.json({
      success: true,
      date: targetDate.toISOString(),
      ...validation
    });
  } catch (error) {
    console.error('[API] Erro ao validar data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
