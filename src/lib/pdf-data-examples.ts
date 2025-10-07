
/**
 * Exemplos de dados expandidos para relatórios PDF
 * Este arquivo demonstra como estruturar dados ricos do banco de dados
 */

import type { DashboardPdfData } from './types';
import type { CommodityPriceData } from './types';


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

    return {
        mainIndex,
        secondaryIndices,
        currencies,
        otherAssets,
        targetDate: new Date('2024-10-06'),
    };
}
