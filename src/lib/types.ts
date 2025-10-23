
'use server';

import type { User as FirebaseUser } from 'firebase/auth';
import type { UserRecord } from 'firebase-admin/auth';
import type { ReportOutput } from '@/ai/flows/report-flow';

// Defines the structure for a single commodity configuration
export interface CommodityConfig {
    id: string;
    name: string;
    currency: 'USD' | 'BRL' | 'EUR';
    category: 'exchange' | 'agricultural' | 'material' | 'sustainability' | 'calculated' | 'credit' | 'main-index' | 'vus' | 'vmad' | 'crs' | 'index' | 'sub-index' | 'report' | 'commercial-executive' | 'custom' | 'composition';
    description: string;
    unit: string;
    sourceUrl?: string;
}

// Defines the structure for commodity data to be displayed
export interface CommodityPriceData extends CommodityConfig {
    price: number;
    change: number;
    absoluteChange: number;
    lastUpdated: string;
    // Campos específicos para o UCS ASE
    valor_usd?: number;
    valor_eur?: number;
    valores_originais?: {
        cotacao_usd?: number;
        cotacao_eur?: number;
        [key: string]: any;
    };
}

// Defines the structure for a historical quote from Firestore
export interface FirestoreQuote {
    id: string;
    data: string; 
    ultimo: number;
    valor?: number;
    timestamp: number | string;
    variacao_pct: number | null;
    [key: string]: any;
}

// Defines the structure for data points used in charts
export interface ChartData {
    time: string;
    value: number;
}

// Extends FirebaseUser to potentially include app-specific roles or data
export interface AppUser extends FirebaseUser {
  isAdmin?: boolean;
}

// Extends the server-side UserRecord to include our custom isAdmin flag
export interface AppUserRecord extends UserRecord {
    isAdmin: boolean;
}


// --- NOVAS ESTRUTURAS PARA RELATÓRIOS AVANÇADOS ---

export interface MarketInsight {
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    confidence: number; // 0-100
}

export interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    period: string;
}

export interface RiskAnalysis {
    overallRisk: 'low' | 'medium' | 'high';
    factors: {
        name: string;
        level: 'low' | 'medium' | 'high';
        description: string;
    }[];
}

export interface CustomSection {
    title: string;
    content: string;
    type: 'text' | 'table' | 'chart' | 'kpi';
    data?: any[];
}


// Defines the data structure needed for generating PDF reports
export interface DashboardPdfData {
    mainIndex?: CommodityPriceData;
    secondaryIndices: CommodityPriceData[];
    currencies: CommodityPriceData[];
    otherAssets: CommodityPriceData[];
    targetDate: Date;
    // Dados para o relatório de IA
    aiReportData?: ReportOutput;
    // Dados avançados para relatórios comerciais
    marketInsights?: MarketInsight[];
    performanceMetrics?: PerformanceMetric[];
    riskAnalysis?: RiskAnalysis;
    customSections?: CustomSection[];
}
