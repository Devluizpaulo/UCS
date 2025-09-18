

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
  if (!inputs || (inputs.area_total !== undefined && inputs.area_total <= 0)) {
    throw new Error("Inputs inválidos ou área total deve ser maior que zero.");
  }

  // Mapeia os inputs da calculadora para o formato esperado pelo motor de cálculo principal.
  const commodities: CommodityPriceData[] = [
      { id: 'dolar', name: 'USD/BRL - Dólar Americano Real Brasileiro', price: inputs.taxa_usd_brl, category: 'exchange' } as CommodityPriceData,
      { id: 'eur', name: 'EUR/BRL - Euro Real Brasileiro', price: inputs.taxa_eur_brl, category: 'exchange' } as CommodityPriceData,
      { id: 'madeira_serrada_futuros', name: 'Madeira Serrada Futuros', price: inputs.pm3mad_usd, category: 'vmad' } as CommodityPriceData,
      { id: 'boi_gordo_futuros', name: 'Boi Gordo Futuros', price: inputs.pecuariaCotacao, category: 'vus' } as CommodityPriceData,
      { id: 'milho_futuros', name: 'Milho Futuros', price: inputs.milhoCotacao, category: 'vus' } as CommodityPriceData,
      { id: 'soja_futuros', name: 'Soja Futuros', price: inputs.sojaCotacao_usd, category: 'vus' } as CommodityPriceData,
      { id: 'credito_carbono_futuros', name: 'Crédito Carbono Futuros', price: inputs.cotacaoCreditoCarbono_eur, category: 'crs' } as CommodityPriceData,
  ];
  
  // Utiliza o motor de cálculo unificado.
  const result: CalculateUcsIndexOutput = calculateIndex(commodities, inputs as FormulaParameters);
  
  const totalPDM = result.components.vm + result.components.vus + result.components.crs;

  // Retorna os resultados no formato esperado pela calculadora.
  return {
    valorMadeira: result.components.vm,
    valorUsoSolo: result.components.vus,
    custoResponsabilidadeSocioambiental: result.components.crs,
    potencialDesflorestadorMonetizado: totalPDM,
    indiceViabilidadeProjeto: result.ivp,
    unidadeCreditoSustentabilidade: result.ucsCF,
    detalhes: {
      vm: { 
        fm3: inputs.produtividade_madeira ?? 0, 
        pm3mad: inputs.pm3mad_usd ?? 0,
      },
      vus: result.vusDetails,
      crs: {
        cc: 0, // Detalhes de CRS podem ser adicionados ao `calculateIndex` se necessário
        ch2o: 0,
      },
      ce: { carbonoEstocadoTotal: (inputs.produtividade_carbono ?? 0) * (inputs.area_total ?? 0) }
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
