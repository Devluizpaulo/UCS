

// Defines the structure for a single commodity configuration
export interface CommodityConfig {
    id: string;
    name: string;
    currency: 'USD' | 'BRL' | 'EUR';
    category: 'exchange' | 'vus' | 'vmad' | 'crs' | 'index';
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
    timestamp: number;
    variacao_pct: number | null;
    rent_media?: number;
    [key: string]: any; // Allow other fields
}

// Defines the structure for data points used in charts
export interface ChartData {
    time: string;
    value: number;
}

// Defines the structure for the CH2O composition breakdown
export interface Ch2oCompositionData {
    date: string;
    timestamp: number;
    total: number;
    components: {
        boi_gordo: number;
        milho: number;
        soja: number;
        madeira: number;
        carbono: number;
    };
}
