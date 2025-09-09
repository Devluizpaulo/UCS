import { NextRequest, NextResponse } from 'next/server';
import { getCommodityPrices } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    const prices = await getCommodityPrices();
    return NextResponse.json(prices);
  } catch (error: any) {
    console.error('Error fetching commodity prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commodity prices' },
      { status: 500 }
    );
  }
}