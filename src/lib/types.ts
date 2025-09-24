

// Defines the structure for a single commodity configuration
export interface CommodityConfig {
    id: string;
    name: string;
    currency: 'USD' | 'BRL' | 'EUR';
    category: 'exchange' | 'vus' | 'vmad' | 'crs' | 'index';
    description: string;
    unit: string;
}

// Defines the structure for commodity data to be displayed
export interface CommodityPriceData extends CommodityConfig {
    price: number;
    change: number;
    absoluteChange: number;
    lastUpdated: string;
}

// Defines the structure for a historical quote from Firestore
export interface FirestoreQuote {
    id: string;
    data: string; 
    ultimo: number;
    valor?: number;
    timestamp: number;
    variacao_pct: number | null;
    [key: string]: any;
}

// Defines the structure for data points used in charts
export interface ChartData {
    time: string;
    value: number;
}
