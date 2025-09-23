
import { NextResponse } from 'next/server';
import { parseISO, subDays, isValid, format, isFuture, startOfDay } from 'date-fns';
import { 
  getQuoteForDate, 
  saveQuote
} from '@/lib/data-service';

export const dynamic = 'force-dynamic';

const CH2O_COMPONENTS = ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'];
const CH2O_WEIGHTS: Record<string, number> = {
    'boi_gordo': 0.35,
    'milho': 0.30,
    'soja': 0.35,
};


async function getOrCalculatePriceForDate(targetDate: Date): Promise<any> {
    const existingQuote = await getQuoteForDate('agua', targetDate);
    if (existingQuote && typeof existingQuote.ultimo === 'number') {
        return { 
            price: existingQuote.ultimo, 
            isNew: false, 
            componentValues: {
                boi_gordo: existingQuote.boi_gordo ?? 0,
                milho: existingQuote.milho ?? 0,
                soja: existingQuote.soja ?? 0,
                madeira: existingQuote.madeira ?? 0,
                carbono: existingQuote.carbono ?? 0,
            } 
        };
    }

    const quoteFetcher = (assetId: string) => getQuoteForDate(assetId, targetDate);
    const componentQuotes = await Promise.all(
        CH2O_COMPONENTS.map(id => quoteFetcher(id))
    );
    
    const componentValues = {
        boi_gordo: componentQuotes[0]?.ultimo ?? 0,
        milho: componentQuotes[1]?.ultimo ?? 0,
        soja: componentQuotes[2]?.ultimo ?? 0,
        madeira: componentQuotes[3]?.ultimo ?? 0,
        carbono: componentQuotes[4]?.ultimo ?? 0,
    };

    const calculatedPrice = 
        (componentValues.boi_gordo * CH2O_WEIGHTS.boi_gordo) +
        (componentValues.milho * CH2O_WEIGHTS.milho) +
        (componentValues.soja * CH2O_WEIGHTS.soja) +
        componentValues.madeira +
        componentValues.carbono;


    if (calculatedPrice > 0 && !isFuture(startOfDay(targetDate))) {
         await saveQuote('agua', {
            data: format(targetDate, 'dd/MM/yyyy'),
            timestamp: targetDate.getTime(),
            ultimo: calculatedPrice,
            variacao_pct: 0,
            ...componentValues,
        });
    }

    return { price: calculatedPrice, isNew: true, componentValues };
}


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    let targetDateInput = dateParam ? parseISO(dateParam) : new Date();
    if (!isValid(targetDateInput)) {
        targetDateInput = new Date();
    }
    
    const targetDate = startOfDay(targetDateInput);
    
    const previousDate = subDays(targetDate, 1);

    const [currentData, previousData] = await Promise.all([
        getOrCalculatePriceForDate(targetDate),
        getOrCalculatePriceForDate(previousDate)
    ]);
    
    const price = currentData.price;
    const previousPrice = previousData.price;

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
