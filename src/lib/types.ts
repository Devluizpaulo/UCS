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


export type UcsComposition = {
  agropecuaria: {
    weight: number; // 15%
    boiGordo: number;
    milho: number;
    soja: number;
  };
  madeira: {
    weight: number; // 68%
  };
  agua: {
    weight: number; // 14%
  };
  carbono: {
    weight: number; // 2%
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
