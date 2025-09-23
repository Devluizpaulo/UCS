
import { NextResponse } from 'next/server';
import { parseISO, subDays, isValid, format, isFuture, startOfDay } from 'date-fns';
import { 
  getQuoteForDate, 
  calculateCh2oPrice,
  saveQuote
} from '@/lib/data-service';

export const dynamic = 'force-dynamic';

const CH2O_COMPONENTS = ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'];

async function getOrCalculatePriceForDate(targetDate: Date): Promise<number> {
    // 1. Check if a quote already exists for the target date in the 'agua' collection
    const existingQuote = await getQuoteForDate('agua', targetDate);
    if (existingQuote && typeof existingQuote.ultimo === 'number') {
        return existingQuote.ultimo;
    }

    // 2. If not, calculate it
    const quoteFetcher = (assetId: string): Promise<any | null> => getQuoteForDate(assetId, targetDate);
    const calculatedPrice = await calculateCh2oPrice(quoteFetcher);

    // 3. Save the newly calculated price back to the 'agua' collection,
    // ONLY if the date is not in the future.
    if (calculatedPrice > 0 && !isFuture(targetDate)) {
        await saveQuote('agua', {
            data: format(targetDate, 'dd/MM/yyyy'),
            timestamp: targetDate.getTime(),
            ultimo: calculatedPrice,
            variacao_pct: 0, // Variation is calculated on the fly by the caller
        });
    }

    return calculatedPrice;
}


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    let targetDateInput = dateParam ? parseISO(dateParam) : new Date();
    if (!isValid(targetDateInput)) {
        targetDateInput = new Date();
    }
    
    // Normalize to the start of the day to prevent timezone issues
    const targetDate = startOfDay(targetDateInput);

    // To calculate variation, we need the *previous day's* value.
    const previousDate = subDays(targetDate, 1);

    const [price, previousPrice] = await Promise.all([
        getOrCalculatePriceForDate(targetDate),
        getOrCalculatePriceForDate(previousDate)
    ]);
    
    if (price === 0) {
        return NextResponse.json({ message: 'Não foi possível calcular o preço para a data solicitada. Verifique se os componentes possuem dados.' }, { status: 404 });
    }

    const absoluteChange = price - previousPrice;
    const change = (previousPrice !== 0) ? (absoluteChange / previousPrice) * 100 : 0;

    return NextResponse.json({ price, change, absoluteChange });

  } catch (error) {
    console.error('[API /calculate/ch2o] Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
