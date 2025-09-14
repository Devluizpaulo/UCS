import { NextRequest, NextResponse } from 'next/server';
import { getFormulaParameters } from '@/lib/formula-service';
import { getCommodityPrices } from '@/lib/data-service';
import { calculateIndex } from '@/lib/calculation-service';

export async function GET(request: NextRequest) {
  try {
    const [parametros, cotacoes] = await Promise.all([
      getFormulaParameters(),
      getCommodityPrices(),
    ]);

    if (!parametros.isConfigured) {
        return NextResponse.json({
            indexValue: 0,
            isConfigured: false,
            components: { vm: 0, vus: 0, crs: 0 },
            vusDetails: { pecuaria: 0, milho: 0, soja: 0 },
        });
    }

    const resultado = calculateIndex(cotacoes, parametros);
    
    return NextResponse.json({
      indexValue: resultado.indexValue,
      isConfigured: resultado.isConfigured,
      components: resultado.components,
      vusDetails: resultado.vusDetails,
    });
  } catch (error) {
    console.error('Error calculating UCS index:', error);
    return NextResponse.json(
      { error: 'Failed to calculate UCS index' },
      { status: 500 }
    );
  }
}
