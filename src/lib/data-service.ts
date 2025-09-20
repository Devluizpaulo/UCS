

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
    const data = snapshot.docs[0].data();
    return {
        id: snapshot.docs[0].id,
        ...serializeFirestoreTimestamp(data)
    } as FirestoreQuote;
}


async function getAndProcessAsset(config: CommodityPriceData, calculatedPrice: number, today: string, components?: any) {
    const now = Timestamp.now();

    const snapshot = await db.collection(config.id)
        .orderBy('timestamp', 'desc')
        .limit(2)
        .get();
    
    let previousPrice = calculatedPrice;
    if (snapshot.docs.length > 0) {
        // Se o registro mais recente for de um dia anterior, use-o como 'previous'
        const latestData = snapshot.docs[0].data() as FirestoreQuote;
        if (latestData.data !== today && snapshot.docs.length > 0) {
            previousPrice = latestData.ultimo;
        } else if (snapshot.docs.length > 1) {
            // Se o mais recente for de hoje, o anterior é o segundo na lista
            previousPrice = (snapshot.docs[1].data() as FirestoreQuote).ultimo;
        }
    }
    
    const absoluteChange = calculatedPrice - previousPrice;
    const change = previousPrice !== 0 ? (absoluteChange / previousPrice) * 100 : 0;
    
    const docData: any = { ultimo: calculatedPrice, timestamp: now, data: today, variacao_pct: change };
    if (components) {
        Object.assign(docData, components);
    }
    
    // Procura por um documento com a data de hoje para evitar duplicatas
    const todaySnapshot = await db.collection(config.id)
        .where('data', '==', today)
        .limit(1)
        .get();

    if (todaySnapshot.empty) {
        // Se não houver registro para hoje, cria um novo
        await db.collection(config.id).add(docData);
    } else {
        // Se já existir, atualiza o registro do dia
        await todaySnapshot.docs[0].ref.update(docData);
    }

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

        const now = new Date();
        const today = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });


        const baseAssetPromises = configs
            .filter(config => !config.isCalculated)
            .map(async (config) => {
                const snapshot = await db.collection(config.id).orderBy('timestamp', 'desc').limit(2).get();

                if (snapshot.empty) {
                    // Retorna um valor padrão com preço 0 se não houver dados
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
        
        const usdRate = assetDataMap.get('usd')?.price || 1;
        const eurRate = assetDataMap.get('eur')?.price || 1;

        const getPriceInBRL = (assetId: string) => {
            const asset = assetDataMap.get(assetId);
            if (!asset || typeof asset.price !== 'number') return 0;
            if (asset.currency === 'USD') return asset.price * usdRate;
            if (asset.currency === 'EUR') return asset.price * eurRate;
            return asset.price;
        }

        const rentMediaValues = {
            boi_gordo: (getPriceInBRL('boi_gordo') / 15) * 0.25 * 0.35, 
            milho: (getPriceInBRL('milho') / 60) * 1.5 * 0.30,
            soja: (getPriceInBRL('soja') / 60) * 1.5 * 0.35,
            madeira: getPriceInBRL('madeira') * 0.05,
            carbono: getPriceInBRL('carbono') * 0.15,
        };

        const ch2oAguaValue = calculateCh2oAgua(rentMediaValues);
        const aguaConfig = configs.find(c => c.id === 'agua')!;
        const aguaData = await getAndProcessAsset(aguaConfig as CommodityPriceData, ch2oAguaValue, today, { rent_media_components: rentMediaValues });
        assetDataMap.set('agua', aguaData);

        const custoAguaValue = calculateCustoAgua(ch2oAguaValue);
        const custoAguaConfig = configs.find(c => c.id === 'custo_agua')!;
        const custoAguaData = await getAndProcessAsset(custoAguaConfig as CommodityPriceData, custoAguaValue, today, { base_ch2o_agua: ch2oAguaValue });
        assetDataMap.set('custo_agua', custoAguaData);

        const pdmValue = calculatePdm(ch2oAguaValue, custoAguaValue);
        const pdmConfig = configs.find(c => c.id === 'pdm')!;
        const pdmData = await getAndProcessAsset(pdmConfig as CommodityPriceData, pdmValue, today, { 
            base_ch2o_agua: ch2oAguaValue, 
            base_custo_agua: custoAguaValue,
        });
        assetDataMap.set('pdm', pdmData);
        
        const ucsValue = calculateUcs(pdmValue);
        const ucsConfig = configs.find(c => c.id === 'ucs')!;
        const ucsData = await getAndProcessAsset(ucsConfig as CommodityPriceData, ucsValue, today, { 
            base_pdm: pdmValue
        });
        assetDataMap.set('ucs', ucsData);

        const ucsAseValue = calculateUcsAse(ucsValue);
        const ucsAseConfig = configs.find(c => c.id === 'ucs_ase')!;
        const ucsAseData = await getAndProcessAsset(ucsAseConfig as CommodityPriceData, ucsAseValue, today, { 
            base_ucs: ucsValue,
            base_pdm: pdmValue,
            base_ch2o_agua: ch2oAguaValue,
            base_custo_agua: custoAguaValue,
            rent_media_components: rentMediaValues
        });
        assetDataMap.set('ucs_ase', ucsAseData);

        const results = configs.map(config => assetDataMap.get(config.id)).filter(Boolean) as CommodityPriceData[];

        setCache(CACHE_KEY_PRICES, results, CACHE_TTL_SECONDS);
        return results;

    } catch (error) {
        console.error("Error fetching commodity prices:", error);
        return [];
    }
}

export async function getCotacoesHistorico(assetId: string, limit: number = 90): Promise<FirestoreQuote[]> {
  try {
    const snapshot = await db.collection(assetId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
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
