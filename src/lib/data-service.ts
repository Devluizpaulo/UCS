
'use server';

import { db } from '@/lib/firebase-admin-config';
import { getCommodityConfigs, COMMODITIES_CONFIG } from '@/lib/commodity-config-service';
import type { CommodityPriceData, FirestoreQuote, CommodityConfig } from '@/lib/types';
import { getCache, setCache } from '@/lib/cache-service';
import { calculateCh2oAgua, calculateCustoAgua, calculatePdm, calculateUcs, calculateUcsAse } from './calculation-service';
import { Timestamp } from 'firebase-admin/firestore';

const CACHE_KEY_PRICES = 'commodity_prices';
const CACHE_TTL_SECONDS = 3600; // 1 hora

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


async function getAndProcessAsset(
    config: CommodityConfig, 
    calculatedPrice: number, 
    today: string, 
    components?: any
): Promise<CommodityPriceData> {
    const now = Timestamp.now();
    const todayDocId = today.split('/').reverse().join('-'); 

    const docRef = db.collection(config.id).doc(todayDocId);

    const twoDaysAgoSnapshot = await db.collection(config.id).orderBy('timestamp', 'desc').limit(1).get();
    let previousPrice = calculatedPrice;
    if(!twoDaysAgoSnapshot.empty) {
        previousPrice = (twoDaysAgoSnapshot.docs[0].data() as FirestoreQuote).ultimo;
    }
    
    const absoluteChange = calculatedPrice - previousPrice;
    const change = previousPrice !== 0 ? (absoluteChange / previousPrice) * 100 : 0;
    
    const docData: any = { ultimo: calculatedPrice, timestamp: now, data: today, variacao_pct: change };
    if (components) {
        Object.assign(docData, components);
    }
    
    const docSnapshot = await docRef.get();
    if (docSnapshot.exists) {
        await docRef.update(docData);
    } else {
        await docRef.set(docData);
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

        // Corrigido: Garante que a data seja sempre no fuso horário de São Paulo
        const spTime = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
        const today = new Date(spTime).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const baseAssetPromises = configs
            .filter(config => !config.isCalculated)
            .map(async (config) => {
                const snapshot = await db.collection(config.id).orderBy('timestamp', 'desc').limit(2).get();
                if (snapshot.empty) {
                    const data = { price: 0, change: 0, absoluteChange: 0, lastUpdated: 'N/A', ...config };
                    assetDataMap.set(config.id, data);
                    return data;
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
        
        const getPrice = (id: string) => assetDataMap.get(id)?.price || 0;
        const getPriceInBRL = (assetId: string) => {
            const asset = assetDataMap.get(assetId);
            if (!asset) return 0;
            if (asset.currency === 'USD') return asset.price * getPrice('usd');
            if (asset.currency === 'EUR') return asset.price * getPrice('eur');
            return asset.price;
        }

        const rentMediaComponentIds = ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono'];
        const rentMediaValues = {
            boi_gordo: getPriceInBRL('boi_gordo') * 0.35, 
            milho: getPriceInBRL('milho') * 0.30,
            soja: getPriceInBRL('soja') * 0.35,
            madeira: getPriceInBRL('madeira'),
            carbono: getPriceInBRL('carbono'),
        };
        const missingRentMediaComponents = rentMediaComponentIds.filter(id => getPrice(id) === 0);

        const ch2oAguaValue = calculateCh2oAgua(rentMediaValues);
        const aguaConfig = configs.find(c => c.id === 'agua')!;
        const aguaData = await getAndProcessAsset(aguaConfig, ch2oAguaValue, today, { 
            rent_media_components: rentMediaValues,
            missingComponents: missingRentMediaComponents,
            dependencies: rentMediaComponentIds
        });
        assetDataMap.set('agua', aguaData);

        const custoAguaValue = calculateCustoAgua(ch2oAguaValue);
        const custoAguaConfig = configs.find(c => c.id === 'custo_agua')!;
        const custoAguaData = await getAndProcessAsset(custoAguaConfig, custoAguaValue, today, { 
            base_ch2o_agua: ch2oAguaValue,
            missingComponents: aguaData.missingComponents,
            dependencies: ['agua']
        });
        assetDataMap.set('custo_agua', custoAguaData);

        const pdmValue = calculatePdm(ch2oAguaValue, custoAguaValue);
        const pdmConfig = configs.find(c => c.id === 'pdm')!;
        const pdmData = await getAndProcessAsset(pdmConfig, pdmValue, today, { 
            base_ch2o_agua: ch2oAguaValue, 
            base_custo_agua: custoAguaValue,
            missingComponents: aguaData.missingComponents,
            dependencies: ['agua', 'custo_agua']
        });
        assetDataMap.set('pdm', pdmData);
        
        const ucsValue = calculateUcs(pdmValue);
        const ucsConfig = configs.find(c => c.id === 'ucs')!;
        const ucsData = await getAndProcessAsset(ucsConfig, ucsValue, today, { 
            base_pdm: pdmValue,
            missingComponents: pdmData.missingComponents,
            dependencies: ['pdm']
        });
        assetDataMap.set('ucs', ucsData);

        const ucsAseValue = calculateUcsAse(ucsValue);
        const ucsAseConfig = configs.find(c => c.id === 'ucs_ase')!;
        const ucsAseData = await getAndProcessAsset(ucsAseConfig, ucsAseValue, today, { 
            base_ucs: ucsValue,
            base_pdm: pdmValue,
            base_ch2o_agua: ch2oAguaValue,
            base_custo_agua: custoAguaValue,
            rent_media_components: rentMediaValues,
            missingComponents: ucsData.missingComponents,
            dependencies: ['ucs']
        });
        assetDataMap.set('ucs_ase', ucsAseData);

        const results = configs.map(config => assetDataMap.get(config.id)).filter(Boolean) as CommodityPriceData[];

        setCache(CACHE_KEY_PRICES, results, CACHE_TTL_SECONDS);
        return results;

    } catch (error) {
        console.error("Error fetching commodity prices:", error);
        // Return a default empty state for all configs to avoid crashing the UI
        const configs = await getCommodityConfigs();
        return configs.map(config => ({
             ...config,
             price: 0,
             change: 0,
             absoluteChange: 0,
             lastUpdated: 'Erro ao carregar',
        }));
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
