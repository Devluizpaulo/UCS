import { NextRequest, NextResponse } from 'next/server';
import { subDays, format, parse } from 'date-fns';
import { isBusinessDay } from '@/lib/business-days-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    // Parse yyyy-MM-dd as local date to avoid UTC shift
    const start = dateParam ? parse(dateParam, 'yyyy-MM-dd', new Date()) : new Date();

    if (isNaN(start.getTime())) {
      return NextResponse.json({ success: false, message: 'Parâmetro de data inválido' }, { status: 400 });
    }

    // Busca regressiva até encontrar um dia útil
    let current = subDays(start, 1);
    let tries = 0;
    while (tries < 14) {
      const check = await isBusinessDay(current);
      if (check.isBusinessDay) {
        // Retorna data sem timezone para evitar deslocamentos de dia
        const dateOnly = format(current, 'yyyy-MM-dd');
        return NextResponse.json({ success: true, date: dateOnly, iso: current.toISOString() });
      }
      current = subDays(current, 1);
      tries++;
    }

    return NextResponse.json({ success: false, message: 'Não foi possível determinar o último dia útil' }, { status: 422 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}
