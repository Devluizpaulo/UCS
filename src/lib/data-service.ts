
'use server';

import { db } from '@/lib/firebase-admin-config';
import { getCommodityConfigs } from '@/lib/commodity-config-service';
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getCache, setCache } from '@/lib/cache-service';
import { calculateCh2oAgua, calculateCustoAgua, calculatePdm, calculateUcs, calculateUcsAse } from './calculation-service';
import { Timestamp } from 'firebase-admin/firestore';

const CACHE_KEY_PRICES = 'commodity_prices';
const CACHE_TTL_SECONDS = 21600; // 6 horas

function serializeFirestoreTimestamp(data: any): any {
    if (data === null || typeof data !== 'object') {
        return data;
    }

    if (data instanceof Date) {
        return data.toISOString();
    }
    
    if ('toDate' in data && typeof data.toDate === 'function') {
        return data.toDate().toISOString();
    }

    if (Array.isArray(data)) {
        return data.map(serializeFirestoreTimestamp);
    }

    const serializedData: { [key: string]: any } = {};
    for (const key in data) {
        serializedData[key] = serializeFirestoreTimestamp(data[key]);
    }
    return serializedData;
}

export async function getLatestQuoteWithComponents(assetId: string): Promise<FirestoreQuote | null> {
    const snapshot = await db.collection(assetId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }
    return serializeFirestoreTimestamp(snapshot.docs[0].data()) as FirestoreQuote;
}


async function getAndProcessAsset(config: CommodityPriceData, calculatedPrice: number, components?: any) {
    const now = Timestamp.now();
    const today = now.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // For immediate display, we calculate change based on the last stored value
    const snapshot = await db.collection(config.id)
        .orderBy('timestamp', 'desc')
        .limit(2)
        .get();
    
    const previousPrice = snapshot.docs.length > 1 ? (snapshot.docs[1].data() as FirestoreQuote).ultimo : calculatedPrice;
    const absoluteChange = calculatedPrice - previousPrice;
    const change = previousPrice !== 0 ? (absoluteChange / previousPrice) * 100 : 0;
    
    const docData: any = { ultimo: calculatedPrice, timestamp: now, data: today, variacao_pct: change };
    if (components) {
        Object.assign(docData, components);
    }
    await db.collection(config.id).add(docData);

    return {
        ...config,
        price: calculatedPrice,
        change,
        absoluteChange,
        lastUpdated: today,
        ...components,
    };
}

export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
    const cachedData = getCache<CommodityPriceData[]>(CACHE_KEY_PRICES);
    if (cachedData) {
        return cachedData;
    }

    try {
        const configs = await getCommodityConfigs();
        const assetDataMap = new Map<string, CommodityPriceData>();

        // 1. Fetch all non-calculated assets first
        const baseAssetPromises = configs
            .filter(config => !config.isCalculated)
            .map(async (config) => {
                const snapshot = await db.collection(config.id).orderBy('timestamp', 'desc').limit(2).get();

                if (snapshot.empty) {
                    return { id: config.id, price: 0, change: 0, absoluteChange: 0, lastUpdated: 'N/A', ...config };
                }

                const latestDoc = snapshot.docs[0].data() as FirestoreQuote;
                const previousDoc = snapshot.docs.length > 1 ? snapshot.docs[1].data() as FirestoreQuote : null;
                
                const latestPrice = latestDoc.ultimo || 0;
                const previousPrice = previousDoc ? (previousDoc.ultimo || 0) : latestPrice;

                const absoluteChange = latestPrice - previousPrice;
                const change = (previousPrice !== 0) ? (absoluteChange / previousPrice) * 100 : 0;
                
                const data = { ...config, price: latestPrice, change, absoluteChange, lastUpdated: latestDoc.data || new Date(serializeFirestoreTimestamp(latestDoc.timestamp)).toLocaleDateString('pt-BR') };
                assetDataMap.set(config.id, data);
                return data;
            });

        await Promise.all(baseAssetPromises);
        
        // 2. Execute calculated assets in a defined order
        // Calculate CH2OAgua
        const rentMediaIds = ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'];
        const rentMediaQuotes = await Promise.all(rentMediaIds.map(id => getLatestQuoteWithComponents(id)));
        const rentMediaValues = {
            boi_gordo: rentMediaQuotes[0]?.rent_media ?? 0,
            milho: rentMediaQuotes[1]?.rent_media ?? 0,
            soja: rentMediaQuotes[2]?.rent_media ?? 0,
            madeira: rentMediaQuotes[3]?.rent_media ?? 0,
            carbono: rentMediaQuotes[4]?.rent_media ?? 0,
        };
        const ch2oAguaValue = calculateCh2oAgua(rentMediaValues);
        const aguaConfig = configs.find(c => c.id === 'agua')!;
        const aguaData = await getAndProcessAsset(aguaConfig as CommodityPriceData, ch2oAguaValue, { rent_media_components: rentMediaValues });
        assetDataMap.set('agua', aguaData);

        // Calculate Custo da Água
        const custoAguaValue = calculateCustoAgua(ch2oAguaValue);
        const custoAguaConfig = configs.find(c => c.id === 'custo_agua')!;
        const custoAguaData = await getAndProcessAsset(custoAguaConfig as CommodityPriceData, custoAguaValue, { base_ch2o_agua: ch2oAguaValue });
        assetDataMap.set('custo_agua', custoAguaData);

        // Calculate PDM
        const pdmValue = calculatePdm(ch2oAguaValue, custoAguaValue);
        const pdmConfig = configs.find(c => c.id === 'pdm')!;
        const pdmData = await getAndProcessAsset(pdmConfig as CommodityPriceData, pdmValue, { 
            base_ch2o_agua: ch2oAguaValue, 
            base_custo_agua: custoAguaValue,
            rent_media_components: rentMediaValues // Pass through for detailed pie chart
        });
        assetDataMap.set('pdm', pdmData);
        
        // Calculate UCS
        const ucsValue = calculateUcs(pdmValue);
        const ucsConfig = configs.find(c => c.id === 'ucs')!;
        const ucsData = await getAndProcessAsset(ucsConfig as CommodityPriceData, ucsValue, { base_pdm: pdmValue });
        assetDataMap.set('ucs', ucsData);

        // Calculate UCS ASE
        const ucsAseValue = calculateUcsAse(ucsValue);
        const ucsAseConfig = configs.find(c => c.id === 'ucs_ase')!;
        const ucsAseData = await getAndProcessAsset(ucsAseConfig as CommodityPriceData, ucsAseValue, { base_ucs: ucsValue });
        assetDataMap.set('ucs_ase', ucsAseData);

        // 3. Assemble final results in the correct order
        const results = configs.map(config => assetDataMap.get(config.id)).filter(Boolean) as CommodityPriceData[];

        setCache(CACHE_KEY_PRICES, results, CACHE_TTL_SECONDS);
        return results;

    } catch (error) {
        console.error("Error fetching commodity prices:", error);
        return [];
    }
}

export async function getCotacoesHistorico(assetId: string): Promise<FirestoreQuote[]> {
  try {
    const snapshot = await db.collection(assetId)
      .orderBy('timestamp', 'desc')
      .limit(90)
      .get();

    if (snapshot.empty) {
      return [];
    }
    
    const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...serializeFirestoreTimestamp(doc.data()),
    })) as FirestoreQuote[];

    return data;

  } catch (error) {
    console.error(`Error fetching historical data for ${assetId}:`, error);
    return [];
  }
}
