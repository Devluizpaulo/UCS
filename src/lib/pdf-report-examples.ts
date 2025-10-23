/**
 * Exemplos de uso dos novos tipos de relatório do UCS Index
 * Este arquivo demonstra como configurar dados para cada tipo de relatório
 */

import { DashboardPdfData, CommodityPriceData } from '@/lib/types';
import { MarketInsight, PerformanceMetric, RiskAnalysis, CustomSection } from './pdf-generator';

// ===================================================================================
// EXEMPLO: Relatório Comercial Executivo
// ===================================================================================
export const createCommercialExecutiveData = (): DashboardPdfData => {
    return {
        mainIndex: {
            id: 'ucs-main',
            name: 'UCS Commodity Index',
            price: 125.50,
            currency: 'USD',
            change: 2.35,
            absoluteChange: 2.88,
            category: 'index',
            description: '',
            unit: 'points',
            lastUpdated: new Date().toISOString()
        },
        secondaryIndices: [
            {
                id: 'energy-index',
                name: 'Energy Commodities',
                price: 89.25,
                currency: 'USD',
                change: 1.85,
                absoluteChange: 1.62,
                category: 'sub-index',
                description: '',
                unit: 'points',
                lastUpdated: new Date().toISOString()
            },
            {
                id: 'metal-index',
                name: 'Precious Metals',
                price: 156.80,
                currency: 'USD',
                change: -0.45,
                absoluteChange: -0.71,
                category: 'sub-index',
                description: '',
                unit: 'points',
                lastUpdated: new Date().toISOString()
            }
        ],
        currencies: [
            {
                id: 'usd-brl',
                name: 'USD/BRL',
                price: 5.12,
                currency: 'BRL',
                change: 0.85,
                absoluteChange: 0.04,
                category: 'exchange',
                description: '',
                unit: 'R$',
                lastUpdated: new Date().toISOString()
            }
        ],
        otherAssets: [
            {
                id: 'gold',
                name: 'Gold',
                price: 2045.30,
                currency: 'USD',
                change: 1.25,
                absoluteChange: 25.25,
                category: 'material',
                description: '',
                unit: 'oz',
                lastUpdated: new Date().toISOString()
            },
            {
                id: 'oil',
                name: 'Crude Oil',
                price: 78.45,
                currency: 'USD',
                change: -2.10,
                absoluteChange: -1.68,
                category: 'material',
                description: '',
                unit: 'barrel',
                lastUpdated: new Date().toISOString()
            }
        ],
        targetDate: new Date(),
    };
};

// ===================================================================================
// EXEMPLO: Relatório Personalizado
// ===================================================================================
export const createCustomReportData = (): DashboardPdfData => {
    return {
        targetDate: new Date(),
        mainIndex: undefined,
        secondaryIndices: [],
        currencies: [],
        otherAssets: [],
    };
};

// ===================================================================================
// EXEMPLO: Relatório de Composição (já existente)
// ===================================================================================
export const createCompositionData = (): DashboardPdfData => {
    return {
        mainIndex: {
            id: 'ucs-composite',
            name: 'UCS Composite Index',
            price: 145.75,
            currency: 'USD',
            change: 1.85,
            absoluteChange: 2.65,
            category: 'index',
            description: '',
            unit: 'points',
            lastUpdated: new Date().toISOString()
        },
        otherAssets: [
            {
                id: 'gold-component',
                name: 'Gold Component',
                price: 35.20,
                currency: 'USD',
                change: 25.0,
                absoluteChange: 7.04,
                category: 'sub-index',
                description: '',
                unit: 'points',
                lastUpdated: new Date().toISOString()
            },
            {
                id: 'oil-component',
                name: 'Oil Component',
                price: 42.15,
                currency: 'USD',
                change: 35.0,
                absoluteChange: 11.08,
                category: 'sub-index',
                description: '',
                unit: 'points',
                lastUpdated: new Date().toISOString()
            },
            {
                id: 'agricultural-component',
                name: 'Agricultural Component',
                price: 28.90,
                currency: 'USD',
                change: 20.0,
                absoluteChange: 4.82,
                category: 'sub-index',
                description: '',
                unit: 'points',
                lastUpdated: new Date().toISOString()
            },
            {
                id: 'currency-component',
                name: 'Currency Component',
                price: 39.50,
                currency: 'USD',
                change: 20.0,
                absoluteChange: 6.58,
                category: 'sub-index',
                description: '',
                unit: 'points',
                lastUpdated: new Date().toISOString()
            }
        ],
        targetDate: new Date(),
        secondaryIndices: [],
        currencies: []
    };
};

// ===================================================================================
// FUNÇÃO UTILITÁRIA PARA GERAR RELATÓRIOS
// ===================================================================================
export const generateReportExample = (reportType: string) => {
    switch (reportType.toLowerCase()) {
        case 'commercial':
        case 'comercial executivo':
            return createCommercialExecutiveData();
        case 'custom':
        case 'personalizado':
            return createCustomReportData();
        case 'composition':
        case 'análise de composição':
            return createCompositionData();
        default:
            return createCommercialExecutiveData(); // Default para comercial
    }
};
