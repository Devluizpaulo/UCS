

export type ChartData = {
  time: string;
  value: number;
};

// Represents the static configuration of a commodity asset
export type CommodityConfig = {
  id: string; // Document ID in Firestore, unique, e.g. "Soja_Futuros"
  name: string; // User-facing name, e.g. "Soja Futuros"
  ticker: string;
  currency: 'BRL' | 'USD' | 'EUR';
  category: 'exchange' | 'agriculture' | 'forestry' | 'carbon';
  description: string;
  unit: string;
  source?: string;
  price?: number; // Latest price, stored directly on the object
  lastUpdated?: string | object; // Can be string or Firestore Timestamp
  scrapeConfig?: {
    url: string;
    selector: string;
  };
};

// Represents commodity data combined with real-time pricing information
export type CommodityPriceData = CommodityConfig & {
    price: number;
    change: number; // Percentage change
    absoluteChange: number;
    lastUpdated: string;
};

export type HistoryInterval = '1d' | '1wk' | '1mo';

export type HistoricalQuote = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: string;
  change: number;
};

export type UcsIndexComponents = {
  indexValue: number;
  isConfigured: boolean;
  components: {
    vm: number;
    vus: number;
    crs: number;
  };
  vusDetails: {
    pecuaria: number;
    milho: number;
    soja: number;
  };
};

export type UcsData = UcsIndexComponents;
export type CalculateUcsIndexOutput = UcsIndexComponents;


export type ScenarioResult = {
  newIndexValue: number;
  originalIndexValue: number;
  changePercentage: number;
  originalAssetPrice: number;
};

export type SimulateScenarioInput = {
    asset: string;
    changeType: 'percentage' | 'absolute';
    value: number;
};

export type RiskMetric = {
    asset: string;
    volatility: number;
    correlation: number;
};

export type RiskAnalysisData = {
    metrics: RiskMetric[];
};

export type FormulaParameters = {
    VOLUME_MADEIRA_HA: number;
    FATOR_CARBONO: number;
    PROD_BOI: number;
    PROD_MILHO: number;
    PROD_SOJA: number;
    PESO_PEC: number;
    PESO_MILHO: number;
    PESO_SOJA: number;
    FATOR_ARREND: number;
    FATOR_AGUA: number;
    FATOR_CONVERSAO_SERRADA_TORA: number;
    isConfigured: boolean;
}

export type GenerateReportInput = {
  type: 'index_performance' | 'asset_performance';
  period: 'daily' | 'monthly' | 'yearly';
  format: 'pdf' | 'xlsx';
  observations?: string;
};

export type GenerateReportOutput = {
  fileName: string;
  fileContent: string;
  mimeType: string;
};

export type SearchedAsset = {
  symbol: string;
  description: string;
  country: string;
}

// --- API Configuration Types ---

export type MarketDataConfig = {
  API_BASE_URL: string;
  CACHE_TTL: {
    QUOTE: number;
    HISTORICAL: number;
  };
  TIMEOUTS: {
    QUOTE: number;
    HISTORICAL: number;
  };
};

export type ApiConfig = {
    marketData: MarketDataConfig;
    isConfigured: boolean;
};

// --- Initial Config Types ---
export type InitialCommodityConfig = Omit<CommodityConfig, 'id' | 'price' | 'lastUpdated'>;

export type CommodityMap = {
  [key: string]: InitialCommodityConfig;
};

// --- MarketData API Response Types ---
export interface MarketDataQuoteResponse {
    s: 'ok' | 'error' | 'no_data';
    errmsg?: string;
    symbol: string[];
    last: number[];
    updated: number[];
}

export interface MarketDataHistoryResponse {
    s: 'ok' | 'error' | 'no_data';
    errmsg?: string;
    t: number[]; // timestamp
    o: number[]; // open
    h: number[]; // high
    l: number[]; // low
    c: number[]; // close
    v: number[]; // volume
}

export interface MarketDataSearchResponse {
    s: 'ok' | 'error' | 'no_data';
    errmsg?: string;
    symbol: string[];
    description: string[];
    country: string[];
}
