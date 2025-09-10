

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
  category: 'exchange' | 'vus' | 'vmad' | 'crs';
  description: string;
  unit: string;
  source?: 'n8n' | 'Investing.com' | 'Yahoo Finance'; // Source is now more flexible
};

export type InitialCommodityConfig = Omit<CommodityConfig, 'id'>;

export type CommodityMap = {
  [key: string]: InitialCommodityConfig;
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

export type FirestoreQuote = {
  id: string;
  ativo: string;
  data: string; // "DD/MM/YYYY"
  abertura: number;
  maxima: number;
  minima: number;
  ultimo: number;
  moeda: string;
  timestamp: any; // Firestore Timestamp
  [key: string]: any; // Allow other properties
}

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

// Based on the official methodology
export type FormulaParameters = {
    // Produtividades
    produtividade_boi: number;
    produtividade_milho: number;
    produtividade_soja: number;
    produtividade_madeira: number;
    produtividade_carbono: number;
    
    // Fatores de Ponderação
    fator_pecuaria: number;
    fator_milho: number;
    fator_soja: number;
    
    // Fatores de Conversão
    fator_arrendamento: number;
    fator_agua: number;
    fator_ucs: number;
    
    // Valores Econômicos
    pib_por_hectare: number;
    
    // Área
    area_total: number;
    
    // Status
    isConfigured: boolean;
};

export type ReportPreviewData = {
    reportTitle: string;
    periodTitle: string;
    analysisText: string;
    ucsHistory: ChartData[];
    assets: {
        name: string;
        price: number;
        change: number;
        currency: string;
    }[];
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
  previewData: ReportPreviewData;
};

// TYPES FOR UCS-PRICING-SERVICE
export type UCSCalculationInputs = FormulaParameters & {
  // Cotações
  pm3mad: number;
  pecuariaCotacao: number;
  milhoCotacao: number;
  sojaCotacao: number;
  cotacaoCreditoCarbono: number;
};

export type UCSCalculationResult = {
  // Componentes do PDM
  valorMadeira: number; // VM
  valorUsoSolo: number; // VUS
  custoResponsabilidadeSocioambiental: number; // CRS
  potencialDesflorestadorMonetizado: number; // PDM
  
  // Cálculos finais
  indiceViabilidadeProjeto: number; // IVP
  unidadeCreditoSustentabilidade: number; // UCS
  
  // Detalhamento dos cálculos
  detalhes: {
    vm: {
      fm3: number;
      pm3mad: number;
    };
    vus: {
      vboi: number;
      vmilho: number;
      vsoja: number;
    };
    crs: {
      cc: number;
      ch2o: number;
    };
    ce: {
      carbonoEstocadoTotal: number;
    }
  };
};
