import { NextRequest, NextResponse } from 'next/server';
import { calcularUCSCompleto, obterValoresPadrao } from '@/lib/ucs-pricing-service';
import { getFormulaParameters } from '@/lib/formula-service';

export async function GET(request: NextRequest) {
  try {
    const parametros = await getFormulaParameters();
    const cotacoes = await obterValoresPadrao();
    const inputs = { ...parametros, ...cotacoes };
    const resultado = calcularUCSCompleto(inputs);
    
    return NextResponse.json({
      indexValue: resultado.unidadeCreditoSustentabilidade,
      isConfigured: parametros.isConfigured,
      components: {
        vm: resultado.valorMadeira,
        vus: resultado.valorUsoSolo,
        crs: resultado.custoResponsabilidadeSocioambiental
      },
      vusDetails: {
        pecuaria: resultado.detalhes.vus.vboi,
        milho: resultado.detalhes.vus.vmilho,
        soja: resultado.detalhes.vus.vsoja
      }
    });
  } catch (error) {
    console.error('Error calculating UCS index:', error);
    return NextResponse.json(
      { error: 'Failed to calculate UCS index' },
      { status: 500 }
    );
  }
}