



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
  isConfigured: boolean; // Add this flag
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
};

export type GenerateReportOutput = {
  fileName: string;
  fileContent: string;
  mimeType: string;
};
