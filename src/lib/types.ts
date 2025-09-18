

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
  ivp: number; // Insumo UCS
  ucsCF: number; // UCS Crédito de Floresta
  ucsASE: number; // UCS Ativo Socioambiental Equivalente
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

// Based on the official methodology
export type FormulaParameters = {
    // Produtividades
    produtividade_boi: number; // @/ha
    produtividade_milho: number; // ton/ha
    produtividade_soja: number; // ton/ha
    produtividade_madeira: number; // FM3, e.g., 120
    produtividade_carbono: number; // tCO2e/ha
    
    // Fatores de Ponderação VUS
    fator_pecuaria: number; // 0-1
    fator_milho: number; // 0-1
    fator_soja: number; // 0-1
    
    // Fatores de Conversão e Custo
    fator_arrendamento: number; // 0-1
    fator_agua: number; // 0-1
    fator_conversao_madeira: number; // Fator de Conversão da Madeira (10%)
    FATOR_CARBONO: number; // Unidades tCO2/ha (e.g., 2.59)
    fator_ucs: number; // Multiplicador para ASE, e.g., 2
    
    // Área
    area_total: number; // ha
    
    // Status
    isConfigured: boolean;

    // Legacy fields for compatibility
    VOLUME_MADEIRA_HA: number;
    PROD_BOI: number;
    PROD_MILHO: number;
    PROD_SOJA: number;
    PESO_PEC: number;
    PESO_MILHO: number;
    PESO_SOJA: number;
    FATOR_ARREND: number;
    pib_por_hectare: number;
    FATOR_CONVERSAO_SERRADA_TORA: number;
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
export type UCSCalculationInputs = Partial<FormulaParameters> & {
  // Cotações (preços brutos, conversão acontece no motor de cálculo)
  taxa_usd_brl: number;
  taxa_eur_brl: number;
  pm3mad_usd: number; // Preço Madeira em USD
  pecuariaCotacao: number; // Preço Boi Arroba em BRL
  milhoCotacao: number; // Preço Milho Saca em BRL
  sojaCotacao_usd: number; // Preço Soja Saca em USD
  cotacaoCreditoCarbono_eur: number; // Preço Carbono em EUR
};

export type UCSCalculationResult = {
  // Componentes do PDM
  valorMadeira: number; // VMAD
  valorUsoSolo: number; // VUS
  custoResponsabilidadeSocioambiental: number; // CRS
  potencialDesflorestadorMonetizado: number; // PDM
  
  // Cálculos finais
  indiceViabilidadeProjeto: number; // IVP
  unidadeCreditoSustentabilidade: number; // UCS CF
  
  // Detalhamento dos cálculos
  detalhes: {
    vm: {
      fm3: number;
      pm3mad: number;
    };
    vus: {
      pecuaria: number;
      milho: number;
      soja: number;
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
