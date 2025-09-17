

import { getCommodityPrices } from './data-service';
import { getFormulaParameters } from './formula-service';
import { calculateIndex } from './calculation-service';
import type { CommodityPriceData, UCSCalculationInputs, UCSCalculationResult, CalculateUcsIndexOutput, FormulaParameters } from './types';

// Re-export types for external use
export type { UCSCalculationInputs, UCSCalculationResult } from './types';


/**
 * Formata um valor monetário de acordo com a moeda.
 * Esta é uma função utilitária síncrona segura para ser usada no cliente.
 */
export function formatCurrency(value: number, currency: string): string {
  if (typeof value !== 'number' || isNaN(value)) return '';
  
  const formatters: Record<string, Intl.NumberFormat> = {
    BRL: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
  };

  const formatter = formatters[currency as keyof typeof formatters];
  return formatter ? formatter.format(value) : `${value.toFixed(2)} ${currency}`;
}


function findPrice(commodities: CommodityPriceData[], category: CommodityPriceData['category'], nameIncludes: string): number {
    const asset = commodities.find(c => c.category === category && c.name.toLowerCase().includes(nameIncludes.toLowerCase()));
    return asset ? asset.price : 0;
}


/**
 * Função principal que executa todo o cálculo da metodologia UCS
 */
export function calcularUCSCompleto(inputs: UCSCalculationInputs): UCSCalculationResult {
  if (!inputs || inputs.area_total <= 0) {
    throw new Error("Inputs inválidos ou área total deve ser maior que zero.");
  }

  // Criamos uma lista de commodities "mock" para alimentar o motor de cálculo principal.
  // As conversões de preço (USD->BRL, Saca->Ton) serão feitas dentro do calculateIndex.
  const commodities: CommodityPriceData[] = [
      { name: 'USD/BRL - Dólar Americano Real Brasileiro', price: inputs.taxa_usd_brl, category: 'exchange' } as CommodityPriceData,
      { name: 'EUR/BRL - Euro Real Brasileiro', price: inputs.taxa_eur_brl, category: 'exchange' } as CommodityPriceData,
      { name: 'Madeira Serrada Futuros', price: inputs.pm3mad_usd, category: 'vmad' } as CommodityPriceData,
      { name: 'Boi Gordo Futuros', price: inputs.pecuariaCotacao, category: 'vus' } as CommodityPriceData,
      { name: 'Milho Futuros', price: inputs.milhoCotacao, category: 'vus' } as CommodityPriceData,
      { name: 'Soja Futuros', price: inputs.sojaCotacao_usd, category: 'vus' } as CommodityPriceData,
      { name: 'Crédito Carbono Futuros', price: inputs.cotacaoCreditoCarbono_eur, category: 'crs' } as CommodityPriceData,
  ];

  const result: CalculateUcsIndexOutput = calculateIndex(commodities, inputs);
  
  // Detalhamento para a calculadora, se necessário
  // Os valores já são retornados de `calculateIndex`, então podemos usá-los diretamente
  return {
    valorMadeira: result.components.vm,
    valorUsoSolo: result.components.vus,
    custoResponsabilidadeSocioambiental: result.components.crs,
    potencialDesflorestadorMonetizado: result.components.vm + result.components.vus + result.components.crs,
    indiceViabilidadeProjeto: result.isConfigured && inputs.produtividade_carbono * inputs.area_total > 0 ? ((result.components.vm + result.components.vus + result.components.crs) / (inputs.produtividade_carbono * inputs.area_total)) / 2 : 0,
    unidadeCreditoSustentabilidade: result.indexValue,
    detalhes: {
      vm: { fm3: inputs.produtividade_madeira, pm3mad: findPrice(commodities, 'vmad', 'madeira') },
      vus: result.vusDetails,
      crs: { // CRS é mais complexo, o detalhamento pode ser simplificado
        cc: 0,
        ch2o: 0,
      },
      ce: { carbonoEstocadoTotal: inputs.produtividade_carbono * inputs.area_total }
    }
  };
}

/**
 * Obtém valores padrão das cotações e parâmetros para a calculadora.
 */
export async function obterValoresPadrao(): Promise<Partial<UCSCalculationInputs>> {
  try {
    const [prices, params] = await Promise.all([
      getCommodityPrices(),
      getFormulaParameters()
    ]);
    
    // Passamos os preços brutos, incluindo as moedas originais, para a calculadora.
    // O motor de cálculo `calculateIndex` já sabe como lidar com as conversões.
    const cotacoes = {
      taxa_usd_brl: findPrice(prices, 'exchange', 'dólar'),
      taxa_eur_brl: findPrice(prices, 'exchange', 'euro'),
      pm3mad_usd: findPrice(prices, 'vmad', 'madeira'),
      pecuariaCotacao: findPrice(prices, 'vus', 'boi'), // Já em BRL
      milhoCotacao: findPrice(prices, 'vus', 'milho'), // Saca em BRL
      sojaCotacao_usd: findPrice(prices, 'vus', 'soja'), // Saca em USD
      cotacaoCreditoCarbono_eur: findPrice(prices, 'crs', 'carbono'), // Em EUR (ou USD se o proxy for usado)
    };

    return { ...params, ...cotacoes };

  } catch (error) {
    console.error('[UCS Pricing Service] Erro ao obter valores padrão de cotações:', error);
    return {};
  }
}

/**
 * Valida os inputs do cálculo UCS
 */
export function validarInputsUCS(inputs: Partial<UCSCalculationInputs>): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  const requiredFields: (keyof UCSCalculationInputs)[] = [
    'produtividade_madeira', 'produtividade_boi', 'produtividade_milho', 'produtividade_soja',
    'pecuariaCotacao', 'milhoCotacao', 'sojaCotacao_usd', 'cotacaoCreditoCarbono_eur',
    'taxa_usd_brl', 'taxa_eur_brl', 'produtividade_carbono', 'area_total'
  ];

  requiredFields.forEach(field => {
    // Usamos 'as any' para permitir a checagem de campos que podem não estar no tipo parcial.
    const value = (inputs as any)[field];
    if (typeof value !== 'number') {
      erros.push(`O campo '${field}' é obrigatório e deve ser um número.`);
    } else if (value < 0) {
      erros.push(`O campo '${field}' não pode ser negativo.`);
    }
  });

  return {
    valido: erros.length === 0,
    erros
  };
}
