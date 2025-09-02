


export type ChartData = {
  time: string;
  value: number;
};

export type Commodity = {
  name: string;
  icon: React.ElementType;
};

export type CommodityPriceData = {
    id: string; // Document ID from Firestore
    name: string;
    ticker: string;
    price: number;
    change: number; // Percentage change
    absoluteChange: number;
    lastUpdated: string;
    currency: 'BRL' | 'USD' | 'EUR';
    source?: string; // e.g., 'B3', 'ICE', 'CME'
}

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

export type UcsData = {
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


// --- Commodity Configuration Types ---

export type ScrapeConfig = {
  url: string;
  selector: string;
};

export type CommodityConfig = {
  name: string; // The key from the map, added for convenience
  ticker: string;
  currency: 'BRL' | 'USD' | 'EUR';
  category: 'exchange' | 'agriculture' | 'forestry' | 'carbon';
  description: string;
  unit: string;
  source?: string; // e.g., 'B3', 'ICE', 'CME'
  scrapeConfig?: ScrapeConfig;
};

export type CommodityMap = {
  [key: string]: Omit<CommodityConfig, 'name'>;
};

export type FullCommodityConfig = {
  commodityMap: CommodityMap;
  isConfigured: boolean;
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

