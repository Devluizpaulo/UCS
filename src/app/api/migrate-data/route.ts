import { NextRequest, NextResponse } from 'next/server';
import { migrateDataToOrganizedCollections } from '@/lib/data-service';

/**
 * API endpoint to migrate data from cotacoes_do_dia to organized collections
 * POST /api/migrate-data
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API] Starting data migration process...');
    
    // Check if request wants only recent data
    let requestData = { onlyRecent: false };
    try {
      requestData = await request.json();
    } catch {
      // Default to full migration if no body
    }
    
    const result = await migrateDataToOrganizedCollections(requestData.onlyRecent || false);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        processed: result.processed,
        timestamp: new Date().toISOString()
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
        processed: result.processed,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('[API] Migration endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      message: `Migration failed: ${error.message}`,
      processed: 0,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check migration status or get info
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/migrate-data',
    description: 'Migrates data from cotacoes_do_dia collection to organized collections by asset and date',
    method: 'POST',
    structure: 'Creates collections like: milho_futuros/07-09-2025',
    timestamp: new Date().toISOString()
  });
}