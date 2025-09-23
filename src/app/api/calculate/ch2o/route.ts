
import { NextResponse } from 'next/server';
import { parseISO, subDays, isValid, format } from 'date-fns';
import { 
  getQuoteForDate, 
  calculateCh2oPrice,
  saveQuote
} from '@/lib/data-service';
import { CH2O_COMPONENTS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

async function getOrCalculatePriceForDate(targetDate: Date): Promise<number> {
    // 1. Check if a quote already exists for the target date in the 'agua' collection
    const existingQuote = await getQuoteForDate('agua', targetDate);
    if (existingQuote && typeof existingQuote.ultimo === 'number') {
        return existingQuote.ultimo;
    }

    // 2. If not, calculate it
    const quoteFetcher = (assetId: string): Promise<any | null> => getQuoteForDate(assetId, targetDate);
    const calculatedPrice = await calculateCh2oPrice(quoteFetcher);

    // 3. Save the newly calculated price back to the 'agua' collection
    if (calculatedPrice > 0) {
        await saveQuote('agua', {
            data: format(targetDate, 'dd/MM/yyyy'),
            timestamp: targetDate.getTime(),
            ultimo: calculatedPrice,
            variacao_pct: 0, // Variation is calculated on the fly below
        });
    }

    return calculatedPrice;
}


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    const targetDate = dateParam && isValid(parseISO(dateParam)) ? parseISO(dateParam) : new Date();
    // To calculate variation, we need the *previous day's* value.
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
