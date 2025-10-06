/**
 * Exemplos de uso dos novos tipos de relatório do UCS Index
 * Este arquivo demonstra como configurar dados para cada tipo de relatório
 */

import { DashboardPdfData, MarketInsight, PerformanceMetric, RiskAnalysis, CustomSection } from './pdf-generator';

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
            category: 'Commodity Index',
            timestamp: new Date()
        },
        secondaryIndices: [
            {
                id: 'energy-index',
                name: 'Energy Commodities',
                price: 89.25,
                currency: 'USD',
                change: 1.85,
                category: 'Energy',
                timestamp: new Date()
            },
            {
                id: 'metal-index',
                name: 'Precious Metals',
                price: 156.80,
                currency: 'USD',
                change: -0.45,
                category: 'Metals',
                timestamp: new Date()
            }
        ],
        currencies: [
            {
                id: 'usd-brl',
                name: 'USD/BRL',
                price: 5.12,
                currency: 'BRL',
                change: 0.85,
                category: 'Currency',
                timestamp: new Date()
            }
        ],
        otherAssets: [
            {
                id: 'gold',
                name: 'Gold',
                price: 2045.30,
                currency: 'USD',
                change: 1.25,
                category: 'Precious Metal',
                timestamp: new Date()
            },
            {
                id: 'oil',
                name: 'Crude Oil',
                price: 78.45,
                currency: 'USD',
                change: -2.10,
                category: 'Energy',
                timestamp: new Date()
            }
        ],
        targetDate: new Date(),
        marketInsights: [
            {
                title: 'Tendência Positiva em Commodities Agrícolas',
                description: 'O mercado de commodities agrícolas apresenta sinais de recuperação com aumento na demanda global e condições climáticas favoráveis.',
                impact: 'positive',
                confidence: 85
            },
            {
                title: 'Volatilidade em Mercados Emergentes',
                description: 'Maior volatilidade observada em mercados emergentes devido a incertezas geopolíticas e políticas monetárias.',
                impact: 'negative',
                confidence: 75
            },
            {
                title: 'Estabilidade em Metais Preciosos',
                description: 'Metais preciosos mantêm estabilidade com fluxo de capital defensivo e demanda institucional constante.',
                impact: 'neutral',
                confidence: 90
            }
        ],
        performanceMetrics: [
            {
                name: 'Retorno Total',
                value: 12.5,
                unit: '%',
                trend: 'up',
                period: 'YTD'
            },
            {
                name: 'Volatilidade',
                value: 8.2,
                unit: '%',
                trend: 'down',
                period: '30 dias'
            },
            {
                name: 'Sharpe Ratio',
                value: 1.45,
                unit: '',
                trend: 'up',
                period: '12 meses'
            },
            {
                name: 'Beta vs S&P 500',
                value: 0.68,
                unit: '',
                trend: 'stable',
                period: '3 meses'
            },
            {
                name: 'Correlação USD',
                value: -0.25,
                unit: '',
                trend: 'stable',
                period: '6 meses'
            },
            {
                name: 'Liquidez',
                value: 95.8,
                unit: '%',
                trend: 'up',
                period: '7 dias'
            }
        ],
        riskAnalysis: {
            overallRisk: 'medium',
            factors: [
                {
                    name: 'Risco de Mercado',
                    level: 'medium',
                    description: 'Exposição moderada a flutuações de preços de commodities'
                },
                {
                    name: 'Risco Cambial',
                    level: 'high',
                    description: 'Alta exposição a variações cambiais devido à composição internacional'
                },
                {
                    name: 'Risco de Liquidez',
                    level: 'low',
                    description: 'Boa liquidez em mercados principais com spreads apertados'
                },
                {
                    name: 'Risco Geopolítico',
                    level: 'medium',
                    description: 'Exposição moderada a eventos geopolíticos em regiões produtoras'
                }
            ]
        }
    };
};

// ===================================================================================
// EXEMPLO: Relatório Personalizado
// ===================================================================================
export const createCustomReportData = (): DashboardPdfData => {
    return {
        targetDate: new Date(),
        customSections: [
            {
                title: 'Análise de Mercado Personalizada',
                content: 'Este relatório foi criado especificamente para atender às necessidades de análise do cliente. Inclui insights personalizados baseados em critérios específicos de investimento e tolerância ao risco.',
                type: 'text'
            },
            {
                title: 'Métricas de Performance Personalizadas',
                content: '',
                type: 'kpi',
                data: [
                    {
                        title: 'ROI Personalizado',
                        value: 18.5,
                        unit: '%'
                    },
                    {
                        title: 'Risco Ajustado',
                        value: 12.3,
                        unit: 'bps'
                    },
                    {
                        title: 'Alfa vs Benchmark',
                        value: 3.2,
                        unit: '%'
                    }
                ]
            },
            {
                title: 'Tabela de Ativos Selecionados',
                content: '',
                type: 'table',
                data: [
                    { Ativo: 'UCS Gold Fund', Valor: 'R$ 1.250.000', Alocação: '25%', Performance: '+8.5%' },
                    { Ativo: 'UCS Energy ETF', Valor: 'R$ 980.000', Alocação: '20%', Performance: '+12.3%' },
                    { Ativo: 'UCS Agricultural', Valor: 'R$ 750.000', Alocação: '15%', Performance: '+5.8%' },
                    { Ativo: 'UCS Currency Hedge', Valor: 'R$ 600.000', Alocação: '12%', Performance: '+2.1%' },
                    { Ativo: 'UCS Diversified', Valor: 'R$ 1.420.000', Alocação: '28%', Performance: '+9.7%' }
                ]
            },
            {
                title: 'Gráfico de Alocação',
                content: 'Distribuição percentual dos ativos no portfólio personalizado',
                type: 'chart'
            },
            {
                title: 'Recomendações Personalizadas',
                content: 'Com base na análise personalizada realizada, recomendamos:\n\n1. Aumentar exposição em commodities agrícolas devido às tendências de longo prazo\n2. Manter hedge cambial para reduzir volatilidade do portfólio\n3. Considerar rebalanceamento trimestral para otimizar performance\n4. Monitorar indicadores de risco geopolítico para ajustes oportunos\n\nEstas recomendações são baseadas no perfil de risco específico e objetivos de investimento definidos.',
                type: 'text'
            }
        ]
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
            category: 'Composite Index',
            timestamp: new Date()
        },
        otherAssets: [
            {
                id: 'gold-component',
                name: 'Gold Component',
                price: 35.20,
                currency: 'USD',
                change: 25.0,
                category: 'Component',
                timestamp: new Date()
            },
            {
                id: 'oil-component',
                name: 'Oil Component',
                price: 42.15,
                currency: 'USD',
                change: 35.0,
                category: 'Component',
                timestamp: new Date()
            },
            {
                id: 'agricultural-component',
                name: 'Agricultural Component',
                price: 28.90,
                currency: 'USD',
                change: 20.0,
                category: 'Component',
                timestamp: new Date()
            },
            {
                id: 'currency-component',
                name: 'Currency Component',
                price: 39.50,
                currency: 'USD',
                change: 20.0,
                category: 'Component',
                timestamp: new Date()
            }
        ],
        targetDate: new Date()
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
