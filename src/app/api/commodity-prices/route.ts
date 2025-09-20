
import { NextRequest, NextResponse } from 'next/server';
import { getCommodityPrices } from '@/lib/data-service';

export const revalidate = 0; // Disable caching for this route

export async function GET(request: NextRequest) {
  try {
    const prices = await getCommodityPrices();
    return NextResponse.json(prices);
  } catch (error) {
    console.error('Error fetching commodity prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commodity prices' },
      { status: 500 }
    );
  }
}
