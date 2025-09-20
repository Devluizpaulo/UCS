
import { NextResponse } from 'next/server';
import { getCommodityPrices } from '@/lib/data-service';

export const dynamic = 'force-dynamic'; // Garante que a função seja sempre executada dinamicamente

export async function GET() {
  try {
    const commodityData = await getCommodityPrices();
    return NextResponse.json(commodityData);
  } catch (error) {
    console.error('[API /cotacoes] Error fetching commodity prices:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
