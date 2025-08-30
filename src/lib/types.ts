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
    price: number;
    change: number;
}

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
