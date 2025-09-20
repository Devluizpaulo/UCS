// Defines the structure for a single commodity configuration
export interface CommodityConfig {
    id: string;
    name: string;
    currency: 'USD' | 'BRL' | 'EUR';
    category: 'exchange' | 'vus' | 'vmad' | 'crs';
    description: string;
    unit: string;
    isCalculated?: boolean;
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
    timestamp: string;
    variacao_pct: number | null;
    rent_media?: number;
    [key: string]: any; // Allow other fields
}

// Defines the structure for data points used in charts
export interface ChartData {
    time: string;
    value: number;
}
