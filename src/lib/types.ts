export type ChartData = {
  time: string;
  value: number;
};

export type Commodity = {
  name: string;
  icon: React.ElementType;
};

export type CommodityPriceData = {
    name: string;
    ticker: string;
    price: number;
    change: number; // Percentage change
    absoluteChange: number;
    lastUpdated: string;
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

export type AnalyzeAssetOutput = {
  analysis: string;
  sources: {
    title: string;
    url: string;
    source: string;
  }[];
};

export type UcsData = {
  indexValue: number;
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
    summary: string;
    metrics: RiskMetric[];
};
