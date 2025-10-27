import { NextRequest, NextResponse } from 'next/server';
import { n8nBusinessDayMiddleware, validateN8NProcessing, logN8NBusinessDayAction } from '@/lib/n8n-business-day-guard';

/**
 * API Route para o N8N validar se deve processar cotações em uma data específica
 * POST /api/n8n/validate-business-day
 * 
 * Payload esperado:
 * {
 *   "date": "2025-12-25", // ou "data": "25/12/2025"
 *   "source": "webhook_cotacoes" // opcional, para logging
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validação usando o middleware do N8N
    const middlewareResult = await n8nBusinessDayMiddleware(body);
    
    if (middlewareResult.proceed) {
      // Log da ação permitida
      let targetDate = new Date();
      if (body.date) {
        targetDate = new Date(body.date);
      } else if (body.data_especifica) {
        targetDate = new Date(body.data_especifica);
      }
      
      await logN8NBusinessDayAction('ALLOWED', targetDate, {
        source: body.source || 'n8n_webhook',
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
      
      return NextResponse.json({
        success: true,
        allowed: true,
        message: 'Processamento autorizado',
        shouldProceed: true,
        timestamp: new Date().toISOString()
      });
    } else {
      // Retorna resposta de bloqueio
      return NextResponse.json(middlewareResult.response, { status: 200 });
    }
    
  } catch (error) {
    console.error('[API N8N Validation] Erro:', error);
    
    // Em caso de erro, permite o processamento para não quebrar o N8N
    return NextResponse.json({
      success: true,
      allowed: true,
      message: 'Processamento autorizado (erro na validação)',
      shouldProceed: true,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * GET /api/n8n/validate-business-day?date=2025-12-25
 * Validação simples via query parameter
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    if (!dateParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parâmetro date é obrigatório',
          message: 'Forneça uma data no formato YYYY-MM-DD'
        },
        { status: 400 }
      );
    }
    
    const targetDate = new Date(dateParam);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data inválida',
          message: 'Forneça uma data válida no formato YYYY-MM-DD'
        },
        { status: 400 }
      );
    }
    
    const validation = await validateN8NProcessing(targetDate);
    
    return NextResponse.json({
      success: true,
      date: dateParam,
      allowed: validation.allowed,
      shouldProcess: validation.shouldProcess,
      message: validation.message,
      skipReason: validation.skipReason,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[API N8N Validation GET] Erro:', error);
    
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
