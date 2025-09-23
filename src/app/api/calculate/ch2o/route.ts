
import { NextResponse } from 'next/server';
import { parseISO, subDays, isValid } from 'date-fns';
import { 
  getQuoteForDate, 
  getLatestQuote,
  calculateCh2oPrice 
} from '@/lib/data-service';
import type { FirestoreQuote } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const CH2O_COMPONENTS = ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'];
export const CH2O_WEIGHTS: Record<string, number> = {
    'boi_gordo': 0.35,
    'milho': 0.30,
    'soja': 0.35,
};


/**
 * API endpoint to calculate the CH²O (Agua) index value.
 * Accepts a 'date' query parameter in 'yyyy-MM-dd' format.
 * If no date is provided, calculates the latest real-time value.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    let price = 0;
    let absoluteChange = 0;
    let change = 0;

    if (dateParam) {
      // --- Historical Date Calculation ---
      const targetDate = parseISO(dateParam);
      if (!isValid(targetDate)) {
        return NextResponse.json({ message: 'Invalid date format. Use yyyy-MM-dd.' }, { status: 400 });
      }
      const previousDate = subDays(targetDate, 1);

      const quoteFetcherCurrent = (assetId: string): Promise<FirestoreQuote | null> => getQuoteForDate(assetId, targetDate);
      const quoteFetcherPrevious = (assetId: string): Promise<FirestoreQuote | null> => getQuoteForDate(assetId, previousDate);

      const [latestPrice, previousPrice] = await Promise.all([
        calculateCh2oPrice(quoteFetcherCurrent, CH2O_COMPONENTS, CH2O_WEIGHTS),
        calculateCh2oPrice(quoteFetcherPrevious, CH2O_COMPONENTS, CH2O_WEIGHTS),
      ]);

      price = latestPrice;
      absoluteChange = price - previousPrice;
      change = (previousPrice !== 0) ? (absoluteChange / previousPrice) * 100 : 0;

    } else {
      // --- Real-time Calculation ---
      const previousDate = subDays(new Date(), 1);
      
      const quoteFetcherCurrent = (assetId: string): Promise<FirestoreQuote | null> => getLatestQuote(assetId);
      const quoteFetcherPrevious = (assetId: string): Promise<FirestoreQuote | null> => getQuoteForDate(assetId, previousDate);

      const [latestPrice, previousPrice] = await Promise.all([
        calculateCh2oPrice(quoteFetcherCurrent, CH2O_COMPONENTS, CH2O_WEIGHTS),
        calculateCh2oPrice(quoteFetcherPrevious, CH2O_COMPONENTS, CH2O_WEIGHTS),
      ]);
      
      price = latestPrice;
      absoluteChange = price - previousPrice;
      change = (previousPrice !== 0) ? (absoluteChange / previousPrice) * 100 : 0;
    }

    return NextResponse.json({ price, change, absoluteChange });

  } catch (error) {
    console.error('[API /calculate/ch2o] Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
