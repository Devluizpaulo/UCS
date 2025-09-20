import { NextRequest, NextResponse } from 'next/server';
import { getCotacoesHistorico } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    
    if (!assetId) {
      return NextResponse.json(
        { error: 'assetId parameter is required' },
        { status: 400 }
      );
    }

    const quotes = await getCotacoesHistorico(assetId, 30); // Default to 30 days
    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error fetching historical quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical quotes' },
      { status: 500 }
    );
  }
}
