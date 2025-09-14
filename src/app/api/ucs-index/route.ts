import { NextRequest, NextResponse } from 'next/server';
import { getFormulaParameters } from '@/lib/formula-service';
import { getCommodityPrices } from '@/lib/data-service';
import { calculateIndex } from '@/lib/calculation-service';
import { db } from '@/lib/firebase-admin-config';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forDate = searchParams.get('date') || undefined;

    const [parametros, cotacoes] = await Promise.all([
      getFormulaParameters(),
      getCommodityPrices(forDate),
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

    // Save the newly calculated index to history if it's a valid calculation
    if (resultado.isConfigured && resultado.indexValue > 0) {
        const historyCollectionRef = db.collection('ucs_index_history');
        const dateToSave = forDate ? new Date(forDate) : new Date();
        dateToSave.setUTCHours(12,0,0,0); // Normalize to midday UTC
        const docId = dateToSave.toISOString().split('T')[0];

        await historyCollectionRef.doc(docId).set({
            value: resultado.indexValue,
            isConfigured: resultado.isConfigured,
            components: resultado.components,
            vusDetails: resultado.vusDetails,
            savedAt: Timestamp.fromDate(dateToSave)
        }, { merge: true });
    }
    
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
