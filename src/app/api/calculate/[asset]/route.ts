

import { NextResponse } from 'next/server';
import { parseISO, subDays, isValid, format, isFuture, startOfDay } from 'date-fns';
import { getQuoteForDate, saveQuote } from '@/lib/data-service';
import { CALCULATION_CONFIGS, isCalculableAsset } from '@/lib/calculation-service';
import type { FirestoreQuote } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface AssetContext {
  params: {
    asset: string;
  };
}

/**
 * Busca ou calcula o preço de um ativo para uma data específica.
 * @param assetId O ID do ativo a ser calculado.
 * @param targetDate A data para a qual o preço será obtido/calculado.
 * @returns Um objeto com o preço, se é um novo cálculo, e os valores dos componentes.
 */
async function getOrCalculatePriceForDate(assetId: string, targetDate: Date) {
    if (!isCalculableAsset(assetId)) {
        throw new Error(`Asset '${assetId}' is not configured for calculation.`);
    }
    const config = CALCULATION_CONFIGS[assetId];
    
    // 1. Tenta buscar uma cotação pré-existente e válida
    const existingQuote = await getQuoteForDate(assetId, targetDate);
    if (existingQuote?.ultimo && existingQuote.ultimo > 0) {
        const componentValues = Object.fromEntries(
            config.components.map(id => [id, existingQuote[id] ?? 0])
        ) as Record<string, number>;
        return { price: existingQuote.ultimo, isNew: false, componentValues };
    }

    // 2. Se não houver, busca os componentes e calcula
    const componentQuotes = await Promise.all(
        config.components.map(id => getQuoteForDate(id, targetDate))
    );
    
    const componentValues = Object.fromEntries(
        config.components.map((id, i) => [id, componentQuotes[i]?.[config.valueField] ?? 0])
    ) as Record<string, number>;
    
    // 3. Usa a estratégia de cálculo correta
    const calculatedPrice = config.calculator(componentValues);

    // 4. Salva a nova cotação se for válida e não for uma data futura
    if (calculatedPrice > 0 && !isFuture(startOfDay(targetDate))) {
         await saveQuote(assetId, {
            data: format(targetDate, 'dd/MM/yyyy'),
            timestamp: targetDate.getTime(),
            ultimo: calculatedPrice,
            variacao_pct: 0, // Variação será calculada e atualizada no GET
            ...componentValues,
        });
    }

    return { price: calculatedPrice, isNew: true, componentValues };
}

// --- ENDPOINT PRINCIPAL DA API (DINÂMICO) ---

export async function GET(request: Request, context: AssetContext) {
  const { asset: assetId } = context.params;

  if (!isCalculableAsset(assetId)) {
    return NextResponse.json({ message: `Asset '${assetId}' is not a valid calculable asset.` }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    let targetDateInput = dateParam ? parseISO(dateParam) : new Date();
    if (!isValid(targetDateInput)) targetDateInput = new Date();
    
    const targetDate = startOfDay(targetDateInput);
    const previousDate = subDays(targetDate, 1);

    // Busca/calcula os preços para a data atual e a anterior
    const [currentData, previousData] = await Promise.all([
        getOrCalculatePriceForDate(assetId, targetDate),
        getOrCalculatePriceForDate(assetId, previousDate)
    ]);
    
    const { price } = currentData;
    const previousPrice = previousData.price;

    if (price === 0) {
        return NextResponse.json({ message: `Não foi possível calcular o preço para ${assetId}. Verifique se os componentes possuem dados para a data solicitada.` }, { status: 404 });
    }

    // Calcula a variação percentual
    const absoluteChange = price - previousPrice;
    const change = (previousPrice !== 0) ? (absoluteChange / previousPrice) * 100 : 0;
    
    // Atualiza a cotação do dia com a variação, se for um novo cálculo
    const existingQuote = await getQuoteForDate(assetId, targetDate);
    if (price > 0 && (currentData.isNew || existingQuote?.variacao_pct === 0) ) {
        await saveQuote(assetId, {
            data: format(targetDate, 'dd/MM/yyyy'),
            timestamp: targetDate.getTime(),
            ultimo: price,
            variacao_pct: change,
            ...currentData.componentValues,
        });
    }

    // Retorna a resposta final
    return NextResponse.json({ 
        asset: assetId,
        date: format(targetDate, 'dd/MM/yyyy'),
        price, 
        change, 
        absoluteChange,
        components: currentData.componentValues,
    });

  } catch (error) {
    console.error(`[API /calculate/${assetId}] Error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}
