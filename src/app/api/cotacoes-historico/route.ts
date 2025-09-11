import { NextRequest, NextResponse } from 'next/server';
// import { getHistoricalQuotes } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') as '1d' | '1wk' | '1mo' || '1d';
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // const quotes = await getHistoricalQuotes(symbol, interval);
    const quotes: any[] = []; // Placeholder for historical quotes
    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error fetching historical quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical quotes' },
      { status: 500 }
    );
  }
}