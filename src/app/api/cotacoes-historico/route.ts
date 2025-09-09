import { getCotacoesHistorico } from '@/lib/data-service';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo');
    const limit = searchParams.get('limit');
    
    if (!ativo) {
      return NextResponse.json(
        { error: 'Ativo parameter is required' },
        { status: 400 }
      );
    }
    
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const result = await getCotacoesHistorico(ativo, limitNumber);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching cotacoes historico:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cotacoes historico' },
      { status: 500 }
    );
  }
}