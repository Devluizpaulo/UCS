import { getUcsIndexValue } from '@/lib/data-service';
import { NextResponse } from 'next/server';
import type { HistoryInterval } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const interval = (searchParams.get('interval') as HistoryInterval) || '1d';
    
    const result = await getUcsIndexValue(interval);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching UCS index value:', error);
    return NextResponse.json(
      { error: 'Failed to fetch UCS index value' },
      { status: 500 }
    );
  }
}