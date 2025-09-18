
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

// Tipos para o sistema de conversão de moedas
export type CurrencyRate = {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
};

export type ConvertedPrice = {
  originalPrice: number;
  originalCurrency: string;
  convertedPrice: number;
  targetCurrency: string;
  exchangeRate: number;
  lastUpdated: string;
};

// Represents commodity data combined with real-time pricing information
export type CommodityPriceData = CommodityConfig & {
    price: number;
    change: number; // Percentage change
    absoluteChange: number;
    lastUpdated: string;
    convertedPrice?: ConvertedPrice;
    convertedPriceBRL?: number;
};

export type HistoryInterval = '1d' | '1wk' | '1mo';

export type FirestoreQuote = {
  id: string;
  ativo?: string;
  data: string; // "DD/MM/YYYY" or "DD/MM/YY"
  abertura: number;
  maxima: number;
  minima: number;
  ultimo: number;
  moeda: string;
  created_at: string; // ISO string from Firestore Timestamp
  variacao?: string | null;
  variacao_pct?: number | null;
  volume?: string | null;
  [key: string]: any; // Allow other properties
}

export type UcsData = {
  ucsCF: number;
  ucsASE: number;
  ivp: number;
  pdm: number;
  isConfigured: boolean;
  components: {
    vus: number;
    vmad: number;
    crs: number;
  };
  vusDetails: {
    pecuaria: number;
    milho: number;
    soja: number;
  };
};

export type CalculateUcsIndexOutput = UcsData;

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
    // Produtividades
    produtividade_boi: number;
    produtividade_milho: number;
    produtividade_soja: number;
    produtividade_madeira: number;
    produtividade_carbono: number;
    
    // Fatores de Ponderação VUS
    fator_pecuaria: number;
    fator_milho: number;
    fator_soja: number;
    
    // Fatores de Conversão/Custo
    fator_arrendamento: number;
    fator_agua: number;
    fator_conversao_madeira: number;
    
    // Fatores Finais e Multiplicadores
    fator_ucs: number;
    FATOR_CARBONO: number; // Unidades de tCO2 por hectare para CRS
    
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

// TYPES FOR UCS-PRICING-SERVICE (Calculadora)
export type UCSCalculationInputs = Partial<FormulaParameters> & {
  // Cotações
  preco_boi_brl: number;
  preco_milho_brl_ton: number;
  preco_soja_brl_ton: number;
  preco_madeira_brl_m3: number;
  preco_carbono_brl: number;
  taxa_usd_brl: number;
  taxa_eur_brl: number;
};

export type UCSCalculationResult = {
  vUS: number;
  vMAD: number;
  cRS: number;
  pdm: number;
  ivp: number;
  ucsCF: number;
  ucsASE: number;
  detalhes: {
      vm: { fm3: number, pm3mad: number },
      vus: { pecuaria: number; milho: number; soja: number; },
      crs: { cc: number, ch2o: number },
      ce: { carbonoEstocadoTotal: number },
  }
};
