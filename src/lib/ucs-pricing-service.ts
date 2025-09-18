
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
 * Função principal que executa todo o cálculo da metodologia UCS, agindo como um wrapper para o motor de cálculo principal.
 */
export function calcularUCSCompleto(inputs: UCSCalculationInputs): UCSCalculationResult {
  if (!inputs) {
    throw new Error("Inputs inválidos.");
  }

  // Mapeia os inputs da calculadora para o formato esperado pelo motor de cálculo principal.
  const commodities: CommodityPriceData[] = [
      { id: 'dolar', name: 'USD/BRL - Dólar Americano Real Brasileiro', price: inputs.taxa_usd_brl, category: 'exchange' } as CommodityPriceData,
      { id: 'eur', name: 'EUR/BRL - Euro Real Brasileiro', price: inputs.taxa_eur_brl, category: 'exchange' } as CommodityPriceData,
      { id: 'madeira_serrada_futuros', name: 'Madeira Serrada Futuros', price: inputs.preco_madeira_brl_m3 / (inputs.taxa_usd_brl || 1), category: 'vmad' } as CommodityPriceData,
      { id: 'boi_gordo_futuros', name: 'Boi Gordo Futuros', price: inputs.preco_boi_brl, category: 'vus' } as CommodityPriceData,
      { id: 'milho_futuros', name: 'Milho Futuros', price: (inputs.preco_milho_brl_ton / 1000) * 60, category: 'vus' } as CommodityPriceData,
      { id: 'soja_futuros', name: 'Soja Futuros', price: (inputs.preco_soja_brl_ton / 1000) * 60 / (inputs.taxa_usd_brl || 1), category: 'vus' } as CommodityPriceData,
      { id: 'credito_carbono_futuros', name: 'Crédito Carbono Futuros', price: inputs.preco_carbono_brl / (inputs.taxa_eur_brl || 1), category: 'crs' } as CommodityPriceData,
  ];
  
  // Utiliza o motor de cálculo unificado.
  const result: CalculateUcsIndexOutput = calculateIndex(commodities, inputs as FormulaParameters);

  // Retorna os resultados no formato esperado pela calculadora.
  return {
    vUS: result.components.vus,
    vMAD: result.components.vmad,
    cRS: result.components.crs,
    pdm: result.pdm,
    ivp: result.ivp,
    ucs: result.ucs,
    ucs_eur: result.ucs_eur,
    ucs_usd: result.ucs_usd,
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
    
    const taxa_usd_brl = findPrice(prices, 'exchange', 'dólar');
    const taxa_eur_brl = findPrice(prices, 'exchange', 'euro');

    const cotacoes = {
      taxa_usd_brl,
      taxa_eur_brl,
      preco_boi_brl: findPrice(prices, 'vus', 'boi'),
      preco_milho_brl_ton: (findPrice(prices, 'vus', 'milho') / 60) * 1000,
      preco_soja_brl_ton: ((findPrice(prices, 'vus', 'soja') * taxa_usd_brl) / 60) * 1000,
      preco_madeira_brl_m3: findPrice(prices, 'vmad', 'madeira') * taxa_usd_brl,
      preco_carbono_brl: findPrice(prices, 'crs', 'carbono') * taxa_eur_brl,
      preco_agua_brl_m3: 0, // Placeholder
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
    'produtividade_boi', 'produtividade_milho', 'produtividade_soja', 'produtividade_madeira',
    'preco_boi_brl', 'preco_milho_brl_ton', 'preco_soja_brl_ton', 'preco_madeira_brl_m3',
    'preco_carbono_brl', 'taxa_usd_brl', 'taxa_eur_brl',
  ];

  requiredFields.forEach(field => {
    const value = (inputs as any)[field];
    if (value === undefined || value === null) {
       erros.push(`O campo '${field}' é obrigatório.`);
    } else if (typeof value !== 'number') {
      erros.push(`O campo '${field}' deve ser um número.`);
    } else if (value < 0) {
      erros.push(`O campo '${field}' não pode ser negativo.`);
    }
  });

  return {
    valido: erros.length === 0,
    erros
  };
}
