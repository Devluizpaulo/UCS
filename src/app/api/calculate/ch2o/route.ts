
import { NextResponse } from 'next/server';
import { parseISO, subDays, isValid, format, isFuture, startOfDay } from 'date-fns';
import { 
  getQuoteForDate, 
  saveQuote
} from '@/lib/data-service';

export const dynamic = 'force-dynamic';

// --- CONFIGURAÇÃO DO ATIVO ---
const CH2O_ASSET_ID = 'agua';
const CH2O_COMPONENTS = ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'] as const;
type ComponentId = typeof CH2O_COMPONENTS[number];

const CH2O_WEIGHTS: Record<string, number> = {
    'boi_gordo': 0.35,
    'milho': 0.30,
    'soja': 0.35,
    'madeira': 1,
    'carbono': 1,
};


// --- FUNÇÕES DE LÓGICA DE NEGÓCIO ---

/**
 * Calcula o preço do "CH²O" com base nos valores dos componentes.
 * @param componentValues Um record com os valores de 'ultimo' de cada componente.
 * @returns O preço final calculado.
 */
function calculatePrice(componentValues: Record<ComponentId, number>): number {
  return (componentValues.boi_gordo * CH2O_WEIGHTS.boi_gordo)
    + (componentValues.milho * CH2O_WEIGHTS.milho)
    + (componentValues.soja * CH2O_WEIGHTS.soja)
    + (componentValues.madeira * CH2O_WEIGHTS.madeira)
    + (componentValues.carbono * CH2O_WEIGHTS.carbono);
}

/**
 * Busca ou calcula o preço do "CH²O" para uma data específica.
 * @param targetDate A data para a qual o preço será obtido/calculado.
 * @returns Um objeto com o preço, um booleano indicando se é um novo cálculo e os valores dos componentes.
 */
async function getOrCalculatePriceForDate(targetDate: Date) {
    const existingQuote = await getQuoteForDate(CH2O_ASSET_ID, targetDate);
    
    // Retorna o valor do cache/banco de dados se já existir um válido.
    if (existingQuote?.ultimo && existingQuote.ultimo > 0) {
        return { 
            price: existingQuote.ultimo, 
            isNew: false, 
            componentValues: Object.fromEntries(
              CH2O_COMPONENTS.map(id => [id, existingQuote[id] ?? 0])
            ) as Record<ComponentId, number>,
        };
    }

    // Busca as cotações dos componentes para a data alvo.
    const componentQuotes = await Promise.all(
        CH2O_COMPONENTS.map(id => getQuoteForDate(id, targetDate))
    );
    
    const componentValues = Object.fromEntries(
      CH2O_COMPONENTS.map((id, i) => [id, componentQuotes[i]?.ultimo ?? 0])
    ) as Record<ComponentId, number>;
    
    // Calcula o preço usando a função dedicada.
    const calculatedPrice = calculatePrice(componentValues);

    // Salva a nova cotação se for uma data passada e o preço for válido.
    if (calculatedPrice > 0 && !isFuture(startOfDay(targetDate))) {
         await saveQuote(CH2O_ASSET_ID, {
            data: format(targetDate, 'dd/MM/yyyy'),
            timestamp: targetDate.getTime(),
            ultimo: calculatedPrice,
            variacao_pct: 0, // A variação será calculada e atualizada no GET.
            ...componentValues,
        });
    }

    return { price: calculatedPrice, isNew: true, componentValues };
}


// --- ENDPOINT PRINCIPAL DA API ---

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // Define as datas alvo e anterior.
    let targetDateInput = dateParam ? parseISO(dateParam) : new Date();
    if (!isValid(targetDateInput)) targetDateInput = new Date();
    
    const targetDate = startOfDay(targetDateInput);
    const previousDate = subDays(targetDate, 1);

    // Busca/calcula os preços para a data atual e a anterior em paralelo.
    const [currentData, previousData] = await Promise.all([
        getOrCalculatePriceForDate(targetDate),
        getOrCalculatePriceForDate(previousDate)
    ]);
    
    const { price } = currentData;
    const previousPrice = previousData.price;

    if (price === 0) {
        return NextResponse.json({ message: 'Não foi possível calcular o preço para a data solicitada. Verifique se os componentes possuem dados.' }, { status: 404 });
    }

    // Calcula a variação percentual.
    const absoluteChange = price - previousPrice;
    const change = (previousPrice !== 0) ? (absoluteChange / previousPrice) * 100 : 0;
    
    // Atualiza a cotação do dia com a variação calculada, se for um novo cálculo
    // ou se a variação ainda não tiver sido definida.
    const existingQuote = await getQuoteForDate(CH2O_ASSET_ID, targetDate);
    if (price > 0 && (currentData.isNew || existingQuote?.variacao_pct === 0) ) {
        await saveQuote(CH2O_ASSET_ID, {
            data: format(targetDate, 'dd/MM/yyyy'),
            timestamp: targetDate.getTime(),
            ultimo: price,
            variacao_pct: change,
            ...currentData.componentValues,
        });
    }

    // Retorna a resposta final.
    return NextResponse.json({ 
        asset: CH2O_ASSET_ID,
        date: format(targetDate, 'dd/MM/yyyy'),
        price, 
        change, 
        absoluteChange,
        components: currentData.componentValues,
    });

  } catch (error) {
    console.error(`[API /calculate/${CH2O_ASSET_ID}] Error:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
