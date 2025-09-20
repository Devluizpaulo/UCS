
import { NextResponse } from 'next/server';
import { getCotacoesHistorico } from '@/lib/data-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get('assetId');
  const limitParam = searchParams.get('limit');
  
  if (!assetId) {
    return NextResponse.json({ message: 'assetId is required' }, { status: 400 });
  }

  const limit = limitParam ? parseInt(limitParam, 10) : 90;

  try {
    const historicalData = await getCotacoesHistorico(assetId, limit);
    return NextResponse.json(historicalData);
  } catch (error) {
    console.error(`[API /cotacoes-historico] Error fetching data for ${assetId}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
