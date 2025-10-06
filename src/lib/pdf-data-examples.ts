/**
 * Exemplos de dados expandidos para relatórios PDF
 * Este arquivo demonstra como estruturar dados ricos do banco de dados
 */

import { DashboardPdfData, MarketSummary, VolatilityMetrics, CorrelationAnalysis, AuditTrailEntry, CalculationDetails } from './pdf-generator';
import { CommodityPriceData } from './types';

/**
 * Cria dados de exemplo para relatório executivo expandido
 */
export function createExpandedExecutiveData(): DashboardPdfData {
    // Dados básicos (simulando dados reais do banco)
    const mainIndex: CommodityPriceData = {
        id: 'ucs_ase',
        name: 'UCS ASE',
        currency: 'BRL',
        category: 'main-index',
        description: 'Índice Principal UCS',
        unit: 'pontos',
        price: 1250.75,
        change: 2.34,
        absoluteChange: 28.65,
        lastUpdated: '06/10/2024 14:30'
    };

    const secondaryIndices: CommodityPriceData[] = [
        {
            id: 'pdm',
            name: 'PDM - Produto de Mercado',
            currency: 'BRL',
            category: 'calculated',
            description: 'Produto calculado baseado em commodities',
            unit: 'pontos',
            price: 850.25,
            change: 1.85,
            absoluteChange: 15.45,
            lastUpdated: '06/10/2024 14:30'
        },
        {
            id: 'vus',
            name: 'VUS - Valor de Uso do Solo',
            currency: 'BRL',
            category: 'calculated',
            description: 'Valor calculado do uso do solo',
            unit: 'pontos',
            price: 420.80,
            change: -0.75,
            absoluteChange: -3.15,
            lastUpdated: '06/10/2024 14:30'
        }
    ];

    const currencies: CommodityPriceData[] = [
        {
            id: 'usd',
            name: 'Dólar Americano',
            currency: 'USD',
            category: 'exchange',
            description: 'Taxa de câmbio USD/BRL',
            unit: 'BRL',
            price: 5.45,
            change: 0.92,
            absoluteChange: 0.05,
            lastUpdated: '06/10/2024 14:30'
        },
        {
            id: 'eur',
            name: 'Euro',
            currency: 'EUR',
            category: 'exchange',
            description: 'Taxa de câmbio EUR/BRL',
            unit: 'BRL',
            price: 6.12,
            change: -0.35,
            absoluteChange: -0.02,
            lastUpdated: '06/10/2024 14:30'
        }
    ];

    const otherAssets: CommodityPriceData[] = [
        {
            id: 'milho',
            name: 'Milho',
            currency: 'BRL',
            category: 'agricultural',
            description: 'Commodity agrícola - Milho',
            unit: 'R$/saca',
            price: 85.50,
            change: 3.25,
            absoluteChange: 2.69,
            lastUpdated: '06/10/2024 14:30'
        },
        {
            id: 'soja',
            name: 'Soja',
            currency: 'BRL',
            category: 'agricultural',
            description: 'Commodity agrícola - Soja',
            unit: 'R$/saca',
            price: 165.80,
            change: -1.45,
            absoluteChange: -2.44,
            lastUpdated: '06/10/2024 14:30'
        },
        {
            id: 'boi_gordo',
            name: 'Boi Gordo',
            currency: 'BRL',
            category: 'agricultural',
            description: 'Commodity pecuária - Boi Gordo',
            unit: 'R$/@',
            price: 285.75,
            change: 0.85,
            absoluteChange: 2.41,
            lastUpdated: '06/10/2024 14:30'
        }
    ];

    // Dados expandidos do banco de dados
    const marketSummary: MarketSummary = {
        totalAssets: 8,
        totalValue: 3445.35,
        averageChange: 0.89,
        positiveAssets: 5,
        negativeAssets: 2,
        stableAssets: 1,
        topPerformer: {
            name: 'Milho',
            change: 3.25
        },
        worstPerformer: {
            name: 'Soja',
            change: -1.45
        },
        marketTrend: 'bullish'
    };

    const volatilityMetrics: VolatilityMetrics = {
        overallVolatility: 2.15,
        highVolatilityAssets: [
            { name: 'Milho', volatility: 4.2 },
            { name: 'Soja', volatility: 3.8 }
        ],
        lowVolatilityAssets: [
            { name: 'UCS ASE', volatility: 1.2 },
            { name: 'Dólar Americano', volatility: 0.9 }
        ],
        volatilityTrend: 'stable'
    };

    const correlationAnalysis: CorrelationAnalysis = {
        strongCorrelations: [
            { asset1: 'Milho', asset2: 'Soja', correlation: 0.85 },
            { asset1: 'Dólar', asset2: 'Soja', correlation: 0.78 }
        ],
        weakCorrelations: [
            { asset1: 'Boi Gordo', asset2: 'Euro', correlation: 0.15 },
            { asset1: 'PDM', asset2: 'VUS', correlation: 0.25 }
        ],
        diversificationScore: 7.5
    };

    const auditTrail: AuditTrailEntry[] = [
        {
            timestamp: '06/10/2024 14:25',
            action: 'Atualização de Preço',
            assetName: 'Milho',
            oldValue: 82.81,
            newValue: 85.50,
            user: 'admin@ucs.com',
            impact: 'medium'
        },
        {
            timestamp: '06/10/2024 14:20',
            action: 'Recálculo Automático',
            assetName: 'UCS ASE',
            oldValue: 1222.10,
            newValue: 1250.75,
            user: 'sistema',
            impact: 'high'
        },
        {
            timestamp: '06/10/2024 14:15',
            action: 'Correção Manual',
            assetName: 'Soja',
            oldValue: 168.24,
            newValue: 165.80,
            user: 'analista@ucs.com',
            impact: 'low'
        }
    ];

    const calculationDetails: CalculationDetails = {
        calculationTime: '2.34 segundos',
        dependencies: [
            {
                asset: 'UCS ASE',
                formula: '(PDM + VUS) / 2',
                dependencies: ['PDM', 'VUS']
            },
            {
                asset: 'PDM',
                formula: 'milho * 7.20 + soja * 3.3 * usd + boi_gordo * 18',
                dependencies: ['milho', 'soja', 'usd', 'boi_gordo']
            }
        ],
        errors: [
            {
                asset: 'carbono',
                error: 'Dados de fonte externa indisponíveis',
                severity: 'warning'
            }
        ],
        performanceMetrics: {
            calculationTime: 2340,
            memoryUsage: 45.7,
            accuracy: 99.2
        }
    };

    return {
        mainIndex,
        secondaryIndices,
        currencies,
        otherAssets,
        targetDate: new Date('2024-10-06'),
        marketSummary,
        volatilityMetrics,
        correlationAnalysis,
        auditTrail,
        calculationDetails
    };
}

/**
 * Cria dados de exemplo para relatório comercial expandido
 */
export function createExpandedCommercialData(): DashboardPdfData {
    const baseData = createExpandedExecutiveData();
    
    // Adicionar insights de mercado específicos para comercial
    baseData.marketInsights = [
        {
            title: 'Forte Demanda por Commodities Agrícolas',
            description: 'Aumento da demanda global por milho e soja está pressionando os preços para cima, especialmente com a recuperação da economia chinesa.',
            impact: 'positive',
            confidence: 85
        },
        {
            title: 'Volatilidade do Câmbio Impacta Exportações',
            description: 'A instabilidade do dólar está criando incertezas para exportadores de commodities, afetando especialmente a soja.',
            impact: 'negative',
            confidence: 72
        },
        {
            title: 'Sustentabilidade como Diferencial Competitivo',
            description: 'Investidores estão priorizando ativos com certificações de sustentabilidade, beneficiando o UCS ASE.',
            impact: 'positive',
            confidence: 90
        }
    ];

    baseData.performanceMetrics = [
        {
            name: 'ROI Portfolio',
            value: 12.5,
            unit: '%',
            trend: 'up',
            period: 'Últimos 30 dias'
        },
        {
            name: 'Sharpe Ratio',
            value: 1.85,
            unit: '',
            trend: 'up',
            period: 'Anual'
        },
        {
            name: 'Beta do Mercado',
            value: 0.75,
            unit: '',
            trend: 'stable',
            period: 'Anual'
        },
        {
            name: 'Volatilidade Anual',
            value: 18.2,
            unit: '%',
            trend: 'down',
            period: 'Anual'
        }
    ];

    baseData.riskAnalysis = {
        overallRisk: 'medium',
        factors: [
            {
                name: 'Risco Cambial',
                level: 'high',
                description: 'Exposição significativa ao dólar americano'
            },
            {
                name: 'Risco Climático',
                level: 'medium',
                description: 'Commodities agrícolas sensíveis ao clima'
            },
            {
                name: 'Risco de Liquidez',
                level: 'low',
                description: 'Alta liquidez nos mercados principais'
            }
        ]
    };

    return baseData;
}

/**
 * Cria dados de exemplo para relatório personalizado
 */
export function createExpandedCustomData(): DashboardPdfData {
    const baseData = createExpandedExecutiveData();
    
    baseData.customSections = [
        {
            title: 'Análise Setorial Detalhada',
            content: 'Análise profunda dos setores agrícola, pecuário e cambial com projeções para os próximos 6 meses.',
            type: 'text',
            data: []
        },
        {
            title: 'KPI de Performance',
            content: 'Métricas de performance customizadas',
            type: 'kpi',
            data: [
                { title: 'Crescimento Mensal', value: 2.4, unit: '%', trend: 'up' },
                { title: 'Market Share', value: 15.8, unit: '%', trend: 'stable' },
                { title: 'Satisfação Cliente', value: 94.2, unit: '%', trend: 'up' }
            ]
        },
        {
            title: 'Tabela de Comparação',
            content: 'Comparativo entre diferentes índices',
            type: 'table',
            data: [
                ['Índice', 'Valor', 'Variação', 'Performance'],
                ['UCS ASE', '1.250,75', '+2,34%', 'Excelente'],
                ['IBOVESPA', '118.450', '+1,85%', 'Boa'],
                ['S&P 500', '4.250', '+0,92%', 'Moderada']
            ]
        },
        {
            title: 'Gráfico de Tendência',
            content: 'Evolução dos preços nos últimos 12 meses',
            type: 'chart',
            data: []
        }
    ];

    return baseData;
}
