// Defines the structure for a single commodity configuration
export interface CommodityConfig {
    id: string;
    name: string;
    ticker: string;
    currency: 'USD' | 'BRL' | 'EUR';
    category: 'exchange' | 'vus' | 'vmad' | 'crs';
    description: string;
    unit: string;
    source: string;
    convertedPriceBRL?: number;
}

// Defines the structure for commodity data fetched from an external source or database
export interface CommodityPriceData extends CommodityConfig {
    price: number;
    change: number;
    absoluteChange: number;
    lastUpdated: string;
}

// Defines the initial configuration for a commodity before it's saved (without ID)
export type InitialCommodityConfig = Omit<CommodityConfig, 'id'>;

// Defines a map of commodity configurations, indexed by a string key
export type CommodityMap = Record<string, Omit<CommodityConfig, 'id'>>;

// Defines the structure for a historical quote from Firestore based on user provided sample
export interface FirestoreQuote {
    id: string;
    abertura: number;
    ativo: string;
    data: string; // Formatted date string, e.g., "20/09/2025"
    fonte: string;
    maxima: number;
    minima: number;
    moeda: string;
    status: string;
    timestamp: string; // ISO string from Firestore Timestamp
    ultimo: number;
    variacao_pct: number | null;
    volume: number | null;
    madeira_tora_brl_ajustado?: number; // Optional field for specific assets
}

// Defines the structure for data points used in charts
export interface ChartData {
    time: string;
    value: number;
}
