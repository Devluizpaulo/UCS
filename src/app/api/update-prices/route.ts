
import { NextRequest, NextResponse } from 'next/server';
import { fetchAndSavePricesFlow } from '@/ai/flows/update-prices-flow';

export async function POST(request: NextRequest) {
  try {
    const result = await fetchAndSavePricesFlow();
    return NextResponse.json({ success: true, message: `Successfully updated ${result.length} prices.` });
  } catch (error: any) {
    console.error('[API update-prices] Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'An unknown error occurred.' }, { status: 500 });
  }
}
