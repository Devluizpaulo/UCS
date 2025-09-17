

import { getCommodityPrices } from './data-service';
import { getFormulaParameters } from './formula-service';
import { calculateIndex } from './calculation-service';
import type { CommodityPriceData, UCSCalculationInputs, UCSCalculationResult, CalculateUcsIndexOutput } from './types';

// Re-export types for external use
export type { UCSCalculationInputs, UCSCalculationResult } from './types';


function findPrice(commodities: CommodityPriceData[], category: CommodityPriceData['category'], nameIncludes: string): number {
    const asset = commodities.find(c => c.category === category && c.name.toLowerCase().includes(nameIncludes.toLowerCase()));
    return asset ? asset.price : 0;
}


/**
 * Calcula o Valor da Madeira (VM)
 * Fórmula: VM = Fm3 × Pm3mad × área_total
 */
function calcularVM(produtividade_madeira: number, pm3mad: number, areaTotal: number): number {
  return produtividade_madeira * pm3mad * areaTotal;
}

/**
 * Calcula o Valor de Uso do Solo (VUS)
 * Fórmula: VUS = (Vboi + Vmilho + Vsoja) × Famed × área_total
 */
function calcularVUS(
  inputs: Pick<UCSCalculationInputs, 'pecuariaCotacao' | 'milhoCotacao' | 'sojaCotacao' | 'produtividade_boi' | 'produtividade_milho' | 'produtividade_soja' | 'fator_pecuaria' | 'fator_milho' | 'fator_soja' | 'fator_arrendamento' | 'area_total'>
): { vusTotal: number, vboi: number, vmilho: number, vsoja: number } {
  const vboi = inputs.pecuariaCotacao * inputs.produtividade_boi * inputs.fator_pecuaria;
  const vmilho = inputs.milhoCotacao * inputs.produtividade_milho * inputs.fator_milho;
  const vsoja = inputs.sojaCotacao * inputs.produtividade_soja * inputs.fator_soja;

  const vusTotal = (vboi + vmilho + vsoja) * inputs.fator_arrendamento * inputs.area_total;
  
  return { vusTotal, vboi, vmilho, vsoja };
}

/**
 * Calcula o Custo da Responsabilidade Socioambiental (CRS)
 * Fórmula: CRS = CC + cH2O
 * CC = CCc × tCo2(n) onde tCo2(n) = 2.59 unidades de Cc por hectare
 * cH2O = FCH2O = 7% do PIB por hectare
 */
function calcularCRS(
  inputs: Pick<UCSCalculationInputs, 'cotacaoCreditoCarbono' | 'produtividade_carbono' | 'pib_por_hectare' | 'fator_agua' | 'area_total'>
): { crsTotal: number, cc: number, ch2o: number } {
  // CC = CCc × tCo2(n) × área_total
  // tCo2(n) = 2.59 unidades de Cc por hectare
  const tCo2_por_hectare = 2.59;
  const cc = inputs.cotacaoCreditoCarbono * tCo2_por_hectare * inputs.area_total;
  
  // cH2O = FCH2O = 7% do PIB por hectare × área_total
  const ch2o = (inputs.pib_por_hectare * inputs.fator_agua) * inputs.area_total;
  
  const crsTotal = cc + ch2o;
  
  return { crsTotal, cc, ch2o };
}

/**
 * Função principal que executa todo o cálculo da metodologia UCS
 */
export function calcularUCSCompleto(inputs: UCSCalculationInputs): UCSCalculationResult {
  if (inputs.area_total <= 0) throw new Error("Área total deve ser maior que zero.");

  const commodities: CommodityPriceData[] = [
      { name: 'Madeira', price: inputs.pm3mad, category: 'vmad' } as CommodityPriceData,
      { name: 'Boi', price: inputs.pecuariaCotacao, category: 'vus' } as CommodityPriceData,
      { name: 'Milho', price: inputs.milhoCotacao, category: 'vus' } as CommodityPriceData,
      { name: 'Soja', price: inputs.sojaCotacao, category: 'vus' } as CommodityPriceData,
      { name: 'Carbono', price: inputs.cotacaoCreditoCarbono, category: 'crs' } as CommodityPriceData,
  ];

  // A conversão de moeda e saca/tonelada é tratada no calculation-service
  const result: CalculateUcsIndexOutput = calculateIndex(commodities, inputs);

  return {
    valorMadeira: result.components.vm,
    valorUsoSolo: result.components.vus,
    custoResponsabilidadeSocioambiental: result.components.crs,
    potencialDesflorestadorMonetizado: result.components.vm + result.components.vus + result.components.crs,
    indiceViabilidadeProjeto: result.isConfigured && inputs.produtividade_carbono * inputs.area_total > 0 ? ((result.components.vm + result.components.vus + result.components.crs) / (inputs.produtividade_carbono * inputs.area_total)) / 2 : 0,
    unidadeCreditoSustentabilidade: result.indexValue,
    detalhes: {
      vm: { fm3: inputs.produtividade_madeira, pm3mad: inputs.pm3mad },
      vus: result.vusDetails,
      crs: {
        cc: calcularCRS(inputs).cc,
        ch2o: calcularCRS(inputs).ch2o,
      },
      ce: { carbonoEstocadoTotal: inputs.produtividade_carbono * inputs.area_total }
    }
  };
}

/**
 * Obtém valores padrão das cotações para a calculadora, para uma data específica ou a mais recente
 */
export async function obterValoresPadrao(): Promise<Partial<UCSCalculationInputs>> {
  try {
    const [prices, params] = await Promise.all([
      getCommodityPrices(),
      getFormulaParameters()
    ]);
    
    // As cotações já vêm na moeda e unidade corretas do data-service,
    // então aqui apenas mapeamos para os campos da calculadora.
    // O `calculation-service` fará as conversões necessárias (saca -> ton, USD -> BRL etc.)
    const cotacoes = {
      pm3mad: findPrice(prices, 'vmad', 'madeira'),
      pecuariaCotacao: findPrice(prices, 'vus', 'boi'),
      milhoCotacao: findPrice(prices, 'vus', 'milho'),
      sojaCotacao: findPrice(prices, 'vus', 'soja'),
      cotacaoCreditoCarbono: findPrice(prices, 'crs', 'carbono'),
    };

    return { ...params, ...cotacoes };

  } catch (error) {
    console.error('[UCS Pricing Service] Erro ao obter valores padrão de cotações:', error);
    return {
      pm3mad: 0,
      pecuariaCotacao: 0,
      milhoCotacao: 0,
      sojaCotacao: 0,
      cotacaoCreditoCarbono: 0,
    };
  }
}

/**
 * Formata valores monetários para exibição
 */
export function formatarValorMonetario(valor: number, moeda: string = 'BRL'): string {
  const formatters = {
    BRL: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
  };
  
  const formatter = formatters[moeda as keyof typeof formatters] || formatters.BRL;
  return formatter.format(valor);
}

/**
 * Valida os inputs do cálculo UCS
 */
export function validarInputsUCS(inputs: Partial<UCSCalculationInputs>): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  const requiredFields: (keyof UCSCalculationInputs)[] = [
    'produtividade_madeira', 'pm3mad', 'produtividade_boi', 'produtividade_milho', 'produtividade_soja',
    'pecuariaCotacao', 'milhoCotacao', 'sojaCotacao', 'cotacaoCreditoCarbono',
    'pib_por_hectare', 'produtividade_carbono', 'area_total'
  ];

  requiredFields.forEach(field => {
    if (typeof inputs[field] !== 'number') {
      erros.push(`O campo '${field}' é obrigatório e deve ser um número.`);
    } else if (inputs[field]! < 0) {
      erros.push(`O campo '${field}' não pode ser negativo.`);
    }
  });

  return {
    valido: erros.length === 0,
    erros
  };
}


/**
 * Valida os cálculos com base em dados de referência (ex: planilha)
 * Retorna métricas de precisão e sugestões de ajuste
 */
export function validarCalculosComTabela(
  resultadoCalculado: UCSCalculationResult,
  dadosReferencia: {
    vm: number;
    vus: number;
    crs: number;
    pdm: number;
  }
): {
  precisao: number;
  diferencas: { vm: number; vus: number; crs: number; pdm: number };
  sugestoes: string[];
} {
  const diferencas = {
    vm: Math.abs(resultadoCalculado.valorMadeira - dadosReferencia.vm),
    vus: Math.abs(resultadoCalculado.valorUsoSolo - dadosReferencia.vus),
    crs: Math.abs(resultadoCalculado.custoResponsabilidadeSocioambiental - dadosReferencia.crs),
    pdm: Math.abs(resultadoCalculado.potencialDesflorestadorMonetizado - dadosReferencia.pdm)
  };
  
  const precisaoVM = 1 - (diferencas.vm / dadosReferencia.vm);
  const precisaoVUS = 1 - (diferencas.vus / dadosReferencia.vus);
  const precisaoCRS = 1 - (diferencas.crs / dadosReferencia.crs);
  const precisaoPDM = 1 - (diferencas.pdm / dadosReferencia.pdm);
  
  const precisao = (precisaoVM + precisaoVUS + precisaoCRS + precisaoPDM) / 4;
  
  const sugestoes: string[] = [];
  
  if (precisaoVM < 0.9) sugestoes.push('Ajustar parâmetros do Valor da Madeira (VM)');
  if (precisaoVUS < 0.9) sugestoes.push('Ajustar fatores do Valor de Uso do Solo (VUS)');
  if (precisaoCRS < 0.9) sugestoes.push('Ajustar Fator Água ou Produtividade Carbono (CRS)');
  
  return {
    precisao,
    diferencas,
    sugestoes
  };
}
