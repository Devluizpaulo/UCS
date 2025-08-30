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
  agropecuaria: number;
  madeira: number;
  agua: number;
  carbono: number;
};
