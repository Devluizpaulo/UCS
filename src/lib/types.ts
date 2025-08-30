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
    boiGordo: number;
    milho: number;
    soja: number;
  };
  madeira: number;
  agua: number;
  carbono: number;
};
