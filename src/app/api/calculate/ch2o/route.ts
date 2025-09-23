
import { NextResponse } from 'next/server';
import { parseISO, subDays, isValid, format } from 'date-fns';
import { 
  getQuoteForDate, 
  calculateCh2oPrice,
  saveQuote
} from '@/lib/data-service';
import type { FirestoreQuote } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const CH2O_COMPONENTS = ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'];
export const CH2O_WEIGHTS: Record<string, number> = {
    'boi_gordo': 0.35,
    'milho': 0.30,
    'soja': 0.35,
};

async function getOrCalculatePriceForDate(targetDate: Date): Promise<number> {
    // 1. Check if a quote already exists for the target date in the 'agua' collection
    const existingQuote = await getQuoteForDate('agua', targetDate);
    if (existingQuote && existingQuote.ultimo) {
        return existingQuote.ultimo;
    }

    // 2. If not, calculate it
    const quoteFetcher = (assetId: string): Promise<FirestoreQuote | null> => getQuoteForDate(assetId, targetDate);
    const calculatedPrice = await calculateCh2oPrice(quoteFetcher, CH2O_COMPONENTS, CH2O_WEIGHTS);

    // 3. Save the newly calculated price back to the 'agua' collection
    if (calculatedPrice > 0) {
        await saveQuote('agua', {
            data: format(targetDate, 'dd/MM/yyyy'),
            timestamp: targetDate.getTime(),
            ultimo: calculatedPrice,
            variacao_pct: 0, // Variation can be calculated later or in a separate process
        });
    }

    return calculatedPrice;
}


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    const targetDate = dateParam && isValid(parseISO(dateParam)) ? parseISO(dateParam) : new Date();
    const previousDate = subDays(targetDate, 1);

    const [price, previousPrice] = await Promise.all([
        getOrCalculatePriceForDate(targetDate),
        getOrCalculatePriceForDate(previousDate)
    ]);
    
    const absoluteChange = price - previousPrice;
    const change = (previousPrice !== 0) ? (absoluteChange / previousPrice) * 100 : 0;

    return NextResponse.json({ price, change, absoluteChange });

  } catch (error) {
    console.error('[API /calculate/ch2o] Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
