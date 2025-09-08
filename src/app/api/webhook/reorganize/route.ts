import { NextRequest, NextResponse } from 'next/server';
import { autoReorganizeNewData } from '@/lib/data-service';

/**
 * Webhook endpoint for n8n to trigger automatic data reorganization
 * POST /api/webhook/reorganize
 * 
 * This endpoint should be called by n8n after saving data to cotacoes_do_dia
 * It will automatically reorganize only the new/recent data
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Webhook] Received reorganization request from n8n');
    
    // Optional: Verify webhook signature or token for security
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.N8N_WEBHOOK_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      console.warn('[Webhook] Unauthorized reorganization attempt');
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }
    
    // Get request body (optional data from n8n)
    let requestData = {};
    try {
      requestData = await request.json();
    } catch {
      // Body is optional
    }
    
    console.log('[Webhook] Starting automatic reorganization...', requestData);
    
    // Reorganize only new data (last 24 hours)
    const result = await autoReorganizeNewData();
    
    if (result.success) {
      console.log(`[Webhook] Reorganization completed: ${result.processed} documents processed`);
      
      return NextResponse.json({
        success: true,
        message: result.message,
        processed: result.processed,
        timestamp: new Date().toISOString(),
        webhook_source: 'n8n'
      }, { status: 200 });
    } else {
      console.error('[Webhook] Reorganization failed:', result.message);
      
      return NextResponse.json({
        success: false,
        message: result.message,
        processed: result.processed,
        timestamp: new Date().toISOString(),
        webhook_source: 'n8n'
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('[Webhook] Reorganization endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      message: `Webhook failed: ${error.message}`,
      processed: 0,
      timestamp: new Date().toISOString(),
      webhook_source: 'n8n'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check webhook status and get configuration info
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/webhook/reorganize',
    description: 'Webhook for n8n to trigger automatic data reorganization',
    method: 'POST',
    authentication: process.env.N8N_WEBHOOK_TOKEN ? 'Bearer token required' : 'No authentication',
    process: 'Reorganizes only new data from cotacoes_do_dia to organized collections',
    structure: 'Creates collections like: milho_futuros/07-09-2025',
    timestamp: new Date().toISOString()
  });
}