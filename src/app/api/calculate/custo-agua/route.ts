
import { NextResponse } from 'next/server';
import { parseISO, subDays, isValid, format, isFuture, startOfDay } from 'date-fns';
import { getQuoteForDate, saveQuote } from '@/lib/data-service';

export const dynamic = 'force-dynamic';

const CUSTO_AGUA_ASSET_ID = 'custo_agua';
const CUSTO_AGUA_COMPONENTS = ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'] as const;
type ComponentId = typeof CUSTO_AGUA_COMPONENTS[number];

const CUSTO_AGUA_WEIGHTS: Record<ComponentId, number> = {
  boi_gordo: 0.35,
  milho: 0.30,
  soja: 0.35,
  madeira: 1,      // peso 1 (sem ajuste)
  carbono: 1,      // peso 1 (sem ajuste)
};

/**
 * Busca ou calcula o preço do custo da água para a data alvo
 */
async function getOrCalculatePriceForDate(targetDate: Date) {
  const existingQuote = await getQuoteForDate(CUSTO_AGUA_ASSET_ID, targetDate);

  // Retorna se já existir cotação válida
  if (existingQuote?.ultimo && existingQuote.ultimo > 0) {
    return {
      price: existingQuote.ultimo,
      isNew: false,
      componentValues: Object.fromEntries(
        CUSTO_AGUA_COMPONENTS.map(id => [id, existingQuote[id] ?? 0])
      ) as Record<ComponentId, number>,
    };
  }

  // Busca cotações dos componentes
  const componentQuotes = await Promise.all(
    CUSTO_AGUA_COMPONENTS.map(id => getQuoteForDate(id, targetDate))
  );

  const componentValues = Object.fromEntries(
    CUSTO_AGUA_COMPONENTS.map((id, i) => [id, componentQuotes[i]?.ultimo ?? 0])
  ) as Record<ComponentId, number>;

  // Calcula preço
  const weightedSum = (componentValues.boi_gordo * CUSTO_AGUA_WEIGHTS.boi_gordo)
    + (componentValues.milho * CUSTO_AGUA_WEIGHTS.milho)
    + (componentValues.soja * CUSTO_AGUA_WEIGHTS.soja)
    + (componentValues.madeira * CUSTO_AGUA_WEIGHTS.madeira)
    + (componentValues.carbono * CUSTO_AGUA_WEIGHTS.carbono);

  const calculatedPrice = weightedSum;

  // Só salva se for uma data não futura e preço > 0
  if (calculatedPrice > 0 && !isFuture(startOfDay(targetDate))) {
    await saveQuote(CUSTO_AGUA_ASSET_ID, {
      data: format(targetDate, 'dd/MM/yyyy'),
      timestamp: targetDate.getTime(),
      ultimo: calculatedPrice,
      variacao_pct: 0,
      ...componentValues,
    });
  }

  return { price: calculatedPrice, isNew: true, componentValues };
}

/**
 * Endpoint principal
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // Valida data de entrada
    let targetDateInput = dateParam ? parseISO(dateParam) : new Date();
    if (!isValid(targetDateInput)) targetDateInput = new Date();

    const targetDate = startOfDay(targetDateInput);
    const previousDate = subDays(targetDate, 1);

    // Busca valores atual e anterior em paralelo
    const [currentData, previousData] = await Promise.all([
      getOrCalculatePriceForDate(targetDate),
      getOrCalculatePriceForDate(previousDate),
    ]);

    const { price } = currentData;
    const previousPrice = previousData.price;

    if (price === 0) {
      return NextResponse.json(
        { message: 'Não foi possível calcular o preço para a data solicitada. Verifique se os componentes possuem dados.' },
        { status: 404 },
      );
    }

    // Calcula variação
    const absoluteChange = price - previousPrice;
    const change = previousPrice > 0 ? (absoluteChange / previousPrice) * 100 : 0;

    // Atualiza variação na cotação do dia
    if (currentData.isNew && price > 0) {
      await saveQuote(CUSTO_AGUA_ASSET_ID, {
        data: format(targetDate, 'dd/MM/yyyy'),
        timestamp: targetDate.getTime(),
        ultimo: price,
        variacao_pct: change,
        ...currentData.componentValues,
      });
    }

    return NextResponse.json({
      asset: CUSTO_AGUA_ASSET_ID,
      date: format(targetDate, 'dd/MM/yyyy'),
      price,
      change,
      absoluteChange,
      components: currentData.componentValues,
    });

  } catch (error) {
    console.error(`[API /calculate/${CUSTO_AGUA_ASSET_ID}] Error:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
