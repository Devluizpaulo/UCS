
import { NextRequest, NextResponse } from 'next/server';
import { getFormulaParameters } from '@/lib/formula-service';
import { getCommodityPrices } from '@/lib/data-service';
import { calculateIndex } from '@/lib/calculation-service';
import { db } from '@/lib/firebase-admin-config';
import { Timestamp } from 'firebase-admin/firestore';
import { clearCache } from '@/lib/cache-service';

export async function GET(request: NextRequest) {
  try {
    const [parametros, cotacoes] = await Promise.all([
      getFormulaParameters(),
      getCommodityPrices(),
    ]);

    const defaultResult = {
        ivp: 0,
        ucsCF: 0,
        ucsASE: 0,
        isConfigured: false,
        components: { vm: 0, vus: 0, crs: 0 },
        vusDetails: { pecuaria: 0, milho: 0, soja: 0 },
    };

    if (!parametros.isConfigured) {
        return NextResponse.json(defaultResult);
    }

    const resultado = calculateIndex(cotacoes, parametros);

    // Save the newly calculated index to history if it's a valid calculation
    if (resultado.isConfigured && resultado.ucsCF > 0) {
        const historyCollectionRef = db.collection('ucs_index_history');
        const dateToSave = new Date();
        dateToSave.setUTCHours(12,0,0,0); // Normalize to midday UTC
        const docId = dateToSave.toISOString().split('T')[0];

        await historyCollectionRef.doc(docId).set({
            value: resultado.ucsCF, // Use ucsCF for historical tracking
            isConfigured: resultado.isConfigured,
            components: resultado.components,
            vusDetails: resultado.vusDetails,
            ivp: resultado.ivp,
            ucsASE: resultado.ucsASE,
            savedAt: Timestamp.fromDate(dateToSave)
        }, { merge: true });
        
        // Clear caches that depend on this new value
        clearCache('ucsIndexValue_latest');
        clearCache(`ucsIndexHistory_1d`);
    }
    
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error calculating UCS index:', error);
    return NextResponse.json(
      { error: 'Failed to calculate UCS index' },
      { status: 500 }
    );
  }
}
