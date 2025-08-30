export type ChartData = {
  time: string;
  value: number;
};

export type Commodity = {
  name: string;
  price: number;
  change: number;
  icon: React.ElementType;
};

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
