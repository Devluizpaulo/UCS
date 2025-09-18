
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
  ucs: number;
  ivp: number;
  pdm: number;
  ucs_eur: number;
  ucs_usd: number;
  isConfigured: boolean;
  components: {
    vus: number;
    vmad: number;
    crs: number;
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

// Based on the new simplified methodology
export type FormulaParameters = {
    // Produtividades
    produtividade_boi: number; // 18 @/ha
    produtividade_milho: number; // 7.2 ton/ha
    produtividade_soja: number; // 3.3 ton/ha
    produtividade_madeira: number; // 120 m³/ha
    
    // Fatores
    fator_uso_terra: number; // 35%
    credito_carbono_param: number; // Valor/parâmetro para CC
    consumo_agua_param: number; // Valor/parâmetro para Água
    fator_ucs: number; // 7%

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
  preco_agua_brl_m3: number;
  taxa_usd_brl: number;
  taxa_eur_brl: number;
};

export type UCSCalculationResult = {
  vUS: number;
  vMAD: number;
  cRS: number;
  pdm: number;
  ivp: number;
  ucs: number;
  ucs_eur: number;
  ucs_usd: number;
};
