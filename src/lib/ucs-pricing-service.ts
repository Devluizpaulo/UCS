
import { getCommodityPrices } from './data-service';
import type { CommodityPriceData } from './types';

// Tipos para o sistema de precificação UCS
export type UCSCalculationInputs = {
  // Cotações
  pm3mad: number;
  pecuariaCotacao: number;
  milhoCotacao: number;
  sojaCotacao: number;
  cotacaoCreditoCarbono: number;
  
  // Produtividade e Fatores do Documento de Settings
  fm3: number; // produtividade_madeira
  pecuariaProducao: number; // produtividade_boi
  milhoProducao: number; // produtividade_milho
  sojaProducao: number; // produtividade_soja
  fatorPecuaria: number; // fator_pecuaria
  fatorMilho: number; // fator_milho
  fatorSoja: number; // fator_soja
  fatorArrendamento: number; // fator_arrendamento
  fatorAgua: number; // fator_agua
  fatorUcs: number; // fator_ucs
  carbonoEstocadoPorHectare: number; // produtividade_carbono
  
  // Econômico
  pibPorHectare: number;
  
  // Área
  areaTotal: number;
};

export type UCSCalculationResult = {
  // Componentes do PDM
  valorMadeira: number; // VM
  valorUsoSolo: number; // VUS
  custoResponsabilidadeSocioambiental: number; // CRS
  potencialDesflorestadorMonetizado: number; // PDM
  
  // Cálculos finais
  indiceViabilidadeProjeto: number; // IVP
  unidadeCreditoSustentabilidade: number; // UCS
  
  // Detalhamento dos cálculos
  detalhes: {
    vm: {
      fm3: number;
      pm3mad: number;
    };
    vus: {
      vboi: number;
      vmilho: number;
      vsoja: number;
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


function findPrice(commodities: CommodityPriceData[], category: CommodityPriceData['category'], nameIncludes: string): number {
    const asset = commodities.find(c => c.category === category && c.name.toLowerCase().includes(nameIncludes.toLowerCase()));
    return asset ? asset.price : 0;
}


/**
 * Calcula o Valor da Madeira (VM)
 * Fórmula: VM = Fm3 × Pm3mad × área_total
 */
function calcularVM(fm3: number, pm3mad: number, areaTotal: number): number {
  return fm3 * pm3mad * areaTotal;
}

/**
 * Calcula o Valor de Uso do Solo (VUS)
 * Fórmula: VUS = (Vboi + Vmilho + Vsoja) × Famed × área_total
 */
function calcularVUS(
  inputs: Pick<UCSCalculationInputs, 'pecuariaCotacao' | 'milhoCotacao' | 'sojaCotacao' | 'pecuariaProducao' | 'milhoProducao' | 'sojaProducao' | 'fatorPecuaria' | 'fatorMilho' | 'fatorSoja' | 'fatorArrendamento' | 'areaTotal'>
): { vusTotal: number, vboi: number, vmilho: number, vsoja: number } {
  const vboi = inputs.pecuariaCotacao * inputs.pecuariaProducao * inputs.fatorPecuaria;
  const vmilho = inputs.milhoCotacao * inputs.milhoProducao * inputs.fatorMilho;
  const vsoja = inputs.sojaCotacao * inputs.sojaProducao * inputs.fatorSoja;

  const vusTotal = (vboi + vmilho + vsoja) * inputs.fatorArrendamento * inputs.areaTotal;
  
  return { vusTotal, vboi, vmilho, vsoja };
}

/**
 * Calcula o Custo da Responsabilidade Socioambiental (CRS)
 * Fórmula: CRS = CC + CH2O
 */
function calcularCRS(
  inputs: Pick<UCSCalculationInputs, 'cotacaoCreditoCarbono' | 'carbonoEstocadoPorHectare' | 'pibPorHectare' | 'fatorAgua' | 'areaTotal'>
): { crsTotal: number, cc: number, ch2o: number } {
  const cc = inputs.cotacaoCreditoCarbono * inputs.carbonoEstocadoPorHectare * inputs.areaTotal;
  const ch2o = (inputs.pibPorHectare * inputs.fatorAgua) * inputs.areaTotal;
  const crsTotal = cc + ch2o;
  
  return { crsTotal, cc, ch2o };
}

/**
 * Função principal que executa todo o cálculo da metodologia UCS
 */
export function calcularUCSCompleto(inputs: UCSCalculationInputs): UCSCalculationResult {
  if (inputs.areaTotal <= 0) throw new Error("Área total deve ser maior que zero.");

  // 1. VM
  const vm = calcularVM(inputs.fm3, inputs.pm3mad, inputs.areaTotal);
  
  // 2. VUS
  const { vusTotal, vboi, vmilho, vsoja } = calcularVUS(inputs);
  
  // 3. CRS
  const { crsTotal, cc, ch2o } = calcularCRS(inputs);
  
  // 4. PDM
  const pdm = vm + vusTotal + crsTotal;
  
  // 5. CE (Carbono Estocado Total)
  const carbonoEstocadoTotal = inputs.carbonoEstocadoPorHectare * inputs.areaTotal;
  if (carbonoEstocadoTotal <= 0) throw new Error("Carbono estocado total (CE) deve ser maior que zero para evitar divisão por zero.");

  // 6. IVP
  const ivp = (pdm / carbonoEstocadoTotal) / 2;
  
  // 7. UCS
  const ucs = inputs.fator_ucs * ivp;

  return {
    valorMadeira: vm,
    valorUsoSolo: vusTotal,
    custoResponsabilidadeSocioambiental: crsTotal,
    potencialDesflorestadorMonetizado: pdm,
    indiceViabilidadeProjeto: ivp,
    unidadeCreditoSustentabilidade: ucs,
    detalhes: {
      vm: { fm3: inputs.fm3, pm3mad: inputs.pm3mad },
      vus: { vboi, vmilho, vsoja },
      crs: { cc, ch2o },
      ce: { carbonoEstocadoTotal }
    }
  };
}

/**
 * Obtém valores padrão das cotações para a calculadora
 */
export async function obterValoresPadrao(): Promise<Partial<UCSCalculationInputs>> {
  try {
    const prices = await getCommodityPrices();
    
    return {
      pm3mad: findPrice(prices, 'vmad', 'madeira'),
      pecuariaCotacao: findPrice(prices, 'vus', 'boi'),
      milhoCotacao: findPrice(prices, 'vus', 'milho'),
      sojaCotacao: findPrice(prices, 'vus', 'soja'),
      cotacaoCreditoCarbono: findPrice(prices, 'crs', 'carbono'),
    };
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
    'fm3', 'pm3mad', 'pecuariaProducao', 'milhoProducao', 'sojaProducao',
    'pecuariaCotacao', 'milhoCotacao', 'sojaCotacao', 'cotacaoCreditoCarbono',
    'pibPorHectare', 'carbonoEstocadoPorHectare', 'areaTotal'
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
