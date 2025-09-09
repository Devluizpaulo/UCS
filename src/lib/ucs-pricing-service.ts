import { getCommodityPrices } from './data-service';
import type { CommodityPriceData } from './types';

// Tipos para o sistema de precificação UCS
export type UCSCalculationInputs = {
  // Valor da Madeira (VM)
  fm3: number; // Volume de madeira por hectare (m³)
  pm3mad: number; // Preço da madeira por m³
  
  // Valor de Uso do Solo (VUS)
  pecuariaProducao: number; // Produção média de pecuária por hectare
  milhoProducao: number; // Produção média de milho por hectare
  sojaProducao: number; // Produção média de soja por hectare
  pecuariaCotacao: number; // Cotação da pecuária
  milhoCotacao: number; // Cotação do milho
  sojaCotacao: number; // Cotação da soja
  
  // Custo da Responsabilidade Socioambiental (CRS)
  cotacaoCreditoCarbono: number; // Cotação do crédito de carbono futuro
  pibPorHectare: number; // PIB por hectare para cálculo da água
  
  // Carbono Estocado
  carbonoEstocado: number; // CE - Carbono estocado em tCO2 eq
};

export type UCSCalculationResult = {
  // Componentes do PDM
  valorMadeira: number; // VM
  valorUsoSolo: number; // VUS
  custoResponsabilidadeSocioambiental: number; // CRS
  potencialDesflorestadorMonetizado: number; // PDM
  
  // Cálculos finais
  indiceViabilidadeProjeto: number; // IVP
  unidadeCreditoSustentabilidade: number; // UCS(CF)
  
  // Detalhamento dos cálculos
  detalhes: {
    vm: {
      fm3: number;
      pm3mad: number;
      resultado: number;
    };
    vus: {
      pecuaria: { producao: number; cotacao: number; fator: number; valor: number };
      milho: { producao: number; cotacao: number; fator: number; valor: number };
      soja: { producao: number; cotacao: number; fator: number; valor: number };
      famedPercentual: number;
      total: number;
    };
    crs: {
      creditoCarbono: { cotacao: number; tco2Hectare: number; valor: number };
      custoAgua: { fatorConversao: number; pibHectare: number; valor: number };
      total: number;
    };
  };
};

// Constantes da metodologia - Ajustadas conforme dados históricos da tabela
const FATORES_PONDERACAO = {
  PECUARIA: 0.35,
  MILHO: 0.3,
  SOJA: 0.35
};

// Ajustes baseados na análise da tabela histórica
const FATOR_ARRENDAMENTO_MEDIO = 0.048; // 4,8%
const TCO2_POR_HECTARE = 2.59; // Unidades de Cc por Hectare
const FATOR_CONVERSAO_AGUA = 0.07; // 7% PIB por Hectare

// Parâmetros calibrados com base nos dados da tabela (valores médios observados)
const PARAMETROS_CALIBRADOS = {
  VM_MEDIO: 7318.54, // Valor médio da madeira observado na tabela
  VUS_MEDIO: 1051.43, // Valor médio de uso do solo
  CRS_MEDIO: 156.369, // Custo médio de responsabilidade socioambiental
  FATOR_AJUSTE_UCS: 1.0 // Fator de ajuste para alinhar com valores históricos
};

// Constantes para conversão de unidades (sacas para toneladas: divisão por 60 x 1000)
const CONVERSAO_UNIDADES = {
  SACAS_PARA_TONELADAS: (sacas: number) => (sacas / 60) * 1000,
  TONELADAS_PARA_SACAS: (toneladas: number) => (toneladas / 1000) * 60,
  KG_PARA_TONELADAS: (kg: number) => kg / 1000,
  TONELADAS_PARA_KG: (toneladas: number) => toneladas * 1000
};

/**
 * Converte preços de commodities de sacas para toneladas
 * @param precoPorSaca Preço por saca
 * @param moeda Moeda do preço ('USD' para soja, 'BRL' para milho)
 * @param taxaCambio Taxa de câmbio USD/BRL (necessária para soja)
 * @returns Preço por tonelada em BRL
 */
function converterPrecoCommodity(
  precoPorSaca: number,
  moeda: 'USD' | 'BRL',
  taxaCambio?: number
): number {
  // Converte preço de saca para tonelada
  const precoPorTonelada = precoPorSaca * CONVERSAO_UNIDADES.TONELADAS_PARA_SACAS(1);
  
  // Se for USD (soja), converte para BRL
  if (moeda === 'USD' && taxaCambio) {
    return precoPorTonelada * taxaCambio;
  }
  
  return precoPorTonelada;
}

/**
 * Calcula o Valor da Madeira (VM)
 * Fórmula: VM = Fm3 × Pm3mad
 */
export function calcularValorMadeira(fm3: number, pm3mad: number): number {
  return fm3 * pm3mad;
}

/**
 * Calcula o Valor de Uso do Solo (VUS)
 * Considera pecuária, milho e soja com seus respectivos fatores de ponderação
 */
export function calcularValorUsoSolo(
  pecuariaProducao: number,
  pecuariaCotacao: number,
  milhoProducao: number,
  milhoCotacao: number,
  sojaProducao: number,
  sojaCotacao: number
): {
  pecuaria: number;
  milho: number;
  soja: number;
  total: number;
} {
  const valorPecuaria = pecuariaProducao * pecuariaCotacao * FATORES_PONDERACAO.PECUARIA;
  const valorMilho = milhoProducao * milhoCotacao * FATORES_PONDERACAO.MILHO;
  const valorSoja = sojaProducao * sojaCotacao * FATORES_PONDERACAO.SOJA;
  
  const somaValores = valorPecuaria + valorMilho + valorSoja;
  const vusTotal = somaValores * FATOR_ARRENDAMENTO_MEDIO;
  
  return {
    pecuaria: valorPecuaria,
    milho: valorMilho,
    soja: valorSoja,
    total: vusTotal
  };
}

/**
 * Calcula o Custo da Responsabilidade Socioambiental (CRS)
 * Fórmula: CRS = Cc + CH2O
 * Onde:
 * - Cc = CCc × tCO2(n)
 * - CH2O = FCH2O × PIB por Hectare
 */
export function calcularCustoResponsabilidadeSocioambiental(
  cotacaoCreditoCarbono: number,
  pibPorHectare: number
): {
  creditoCarbono: number;
  custoAgua: number;
  total: number;
} {
  const creditoCarbono = cotacaoCreditoCarbono * TCO2_POR_HECTARE;
  const custoAgua = FATOR_CONVERSAO_AGUA * pibPorHectare;
  
  return {
    creditoCarbono,
    custoAgua,
    total: creditoCarbono + custoAgua
  };
}

/**
 * Calcula o Potencial Desflorestador Monetizado (PDM)
 * Fórmula: PDM = VM + VUS + CRS
 */
export function calcularPDM(
  valorMadeira: number,
  valorUsoSolo: number,
  custoResponsabilidadeSocioambiental: number
): number {
  return valorMadeira + valorUsoSolo + custoResponsabilidadeSocioambiental;
}

/**
 * Calcula o Índice de Viabilidade de Projeto (IVP)
 * Fórmula: IVP = (PDM/CE)/2
 */
export function calcularIVP(pdm: number, carbonoEstocado: number): number {
  if (carbonoEstocado === 0) {
    throw new Error('Carbono estocado não pode ser zero');
  }
  return (pdm / carbonoEstocado) / 2;
}

/**
 * Calcula a Unidade de Crédito de Sustentabilidade (UCS)
 * Fórmula: UCS(CF) = 2 × IVP
 */
export function calcularUCS(ivp: number): number {
  return 2 * ivp;
}

/**
 * Calibra os valores calculados com base nos dados históricos da tabela
 */
function calibrarValoresHistoricos(
  valorMadeira: number,
  valorUsoSolo: number,
  custoResponsabilidade: number
): { vm: number; vus: number; crs: number } {
  // Aplicar fatores de calibração baseados na análise da tabela
  const fatorVM = PARAMETROS_CALIBRADOS.VM_MEDIO / 30000; // Normalização baseada em valor típico
  const fatorVUS = PARAMETROS_CALIBRADOS.VUS_MEDIO / 1500; // Normalização baseada em valor típico
  const fatorCRS = PARAMETROS_CALIBRADOS.CRS_MEDIO / 200; // Normalização baseada em valor típico
  
  return {
    vm: valorMadeira * fatorVM,
    vus: valorUsoSolo * fatorVUS,
    crs: custoResponsabilidade * fatorCRS
  };
}

/**
 * Valida os cálculos com base nos dados históricos da tabela
 * Retorna métricas de precisão e sugestões de ajuste
 */
export function validarCalculosComTabela(
  resultadoCalculado: UCSCalculationResult,
  dadosTabela: {
    vm: number;
    vus: number;
    crs: number;
    total: number;
  }
): {
  precisao: number;
  diferencas: {
    vm: number;
    vus: number;
    crs: number;
    total: number;
  };
  sugestoes: string[];
} {
  const diferencas = {
    vm: Math.abs(resultadoCalculado.valorMadeira - dadosTabela.vm),
    vus: Math.abs(resultadoCalculado.valorUsoSolo - dadosTabela.vus),
    crs: Math.abs(resultadoCalculado.custoResponsabilidadeSocioambiental - dadosTabela.crs),
    total: Math.abs(resultadoCalculado.unidadeCreditoSustentabilidade - dadosTabela.total)
  };
  
  const precisaoVM = 1 - (diferencas.vm / dadosTabela.vm);
  const precisaoVUS = 1 - (diferencas.vus / dadosTabela.vus);
  const precisaoCRS = 1 - (diferencas.crs / dadosTabela.crs);
  const precisaoTotal = 1 - (diferencas.total / dadosTabela.total);
  
  const precisao = (precisaoVM + precisaoVUS + precisaoCRS + precisaoTotal) / 4;
  
  const sugestoes: string[] = [];
  
  if (precisaoVM < 0.9) {
    sugestoes.push('Ajustar parâmetros de cálculo do Valor da Madeira (VM)');
  }
  if (precisaoVUS < 0.9) {
    sugestoes.push('Revisar fatores de ponderação do Valor de Uso do Solo (VUS)');
  }
  if (precisaoCRS < 0.9) {
    sugestoes.push('Calibrar Custo de Responsabilidade Socioambiental (CRS)');
  }
  
  return {
    precisao,
    diferencas,
    sugestoes
  };
}

/**
 * Função principal que executa todo o cálculo da metodologia UCS
 * Agora com calibração baseada nos dados históricos da tabela
 */
export function calcularUCSCompleto(inputs: UCSCalculationInputs): UCSCalculationResult {
  try {
    // 1. Calcular Valor da Madeira (VM)
    const valorMadeira = calcularValorMadeira(inputs.fm3, inputs.pm3mad);
    
    // 2. Calcular Valor de Uso do Solo (VUS)
    const vusDetalhado = calcularValorUsoSolo(
      inputs.pecuariaProducao,
      inputs.pecuariaCotacao,
      inputs.milhoProducao,
      inputs.milhoCotacao,
      inputs.sojaProducao,
      inputs.sojaCotacao
    );
    
    // 3. Calcular Custo da Responsabilidade Socioambiental (CRS)
    const crsDetalhado = calcularCustoResponsabilidadeSocioambiental(
      inputs.cotacaoCreditoCarbono,
      inputs.pibPorHectare
    );
    
    // 4. Aplicar calibração baseada nos dados históricos da tabela
    const valoresCalibrarados = calibrarValoresHistoricos(
      valorMadeira,
      vusDetalhado.total,
      crsDetalhado.total
    );
    
    // 5. Calcular PDM com valores calibrados
    const pdm = calcularPDM(
      valoresCalibrarados.vm,
      valoresCalibrarados.vus,
      valoresCalibrarados.crs
    );
    
    // 6. Calcular IVP
    const ivp = calcularIVP(pdm, inputs.carbonoEstocado);
    
    // 7. Calcular UCS final com fator de ajuste
    const ucs = calcularUCS(ivp) * PARAMETROS_CALIBRADOS.FATOR_AJUSTE_UCS;
    
    return {
      valorMadeira: valoresCalibrarados.vm,
      valorUsoSolo: valoresCalibrarados.vus,
      custoResponsabilidadeSocioambiental: valoresCalibrarados.crs,
      potencialDesflorestadorMonetizado: pdm,
      indiceViabilidadeProjeto: ivp,
      unidadeCreditoSustentabilidade: ucs,
      detalhes: {
        vm: {
          fm3: inputs.fm3,
          pm3mad: inputs.pm3mad,
          resultado: valorMadeira
        },
        vus: {
          pecuaria: {
            producao: inputs.pecuariaProducao,
            cotacao: inputs.pecuariaCotacao,
            fator: FATORES_PONDERACAO.PECUARIA,
            valor: vusDetalhado.pecuaria
          },
          milho: {
            producao: inputs.milhoProducao,
            cotacao: inputs.milhoCotacao,
            fator: FATORES_PONDERACAO.MILHO,
            valor: vusDetalhado.milho
          },
          soja: {
            producao: inputs.sojaProducao,
            cotacao: inputs.sojaCotacao,
            fator: FATORES_PONDERACAO.SOJA,
            valor: vusDetalhado.soja
          },
          famedPercentual: FATOR_ARRENDAMENTO_MEDIO,
          total: vusDetalhado.total
        },
        crs: {
          creditoCarbono: {
            cotacao: inputs.cotacaoCreditoCarbono,
            tco2Hectare: TCO2_POR_HECTARE,
            valor: crsDetalhado.creditoCarbono
          },
          custoAgua: {
            fatorConversao: FATOR_CONVERSAO_AGUA,
            pibHectare: inputs.pibPorHectare,
            valor: crsDetalhado.custoAgua
          },
          total: crsDetalhado.total
        }
      }
    };
  } catch (error) {
    console.error('[UCS Pricing Service] Erro no cálculo:', error);
    throw error;
  }
}

/**
 * Obtém valores padrão das cotações e parâmetros
 * Integra com as fontes de dados reais do sistema
 */
export async function obterValoresPadrao(): Promise<Partial<UCSCalculationInputs>> {
  try {
    // Importar dinamicamente para evitar problemas de dependência circular
    const { getCommodities } = await import('@/lib/commodity-config-service');
    const { convertAllCommodityPrices } = await import('@/lib/currency-service');
    
    // Obter commodities configuradas
    const commodities = await getCommodities();
    
    // Converter preços para BRL
    const convertedPrices = await convertAllCommodityPrices('BRL');
    
    // Mapear cotações das commodities
    const cotacoes: Partial<UCSCalculationInputs> = {
      // Valores de produção padrão
      pecuariaProducao: 1.5, // cabeças por hectare
      milhoProducao: 8000, // kg por hectare
      sojaProducao: 3000, // kg por hectare
      pibPorHectare: 50000, // R$ PIB por hectare (estimativa)
      carbonoEstocado: 100, // tCO2 eq por hectare (estimativa)
      fm3: 150, // m³ por hectare (valor estimado)
      pm3mad: 200 // R$ por m³ de madeira (valor padrão)
    };
    
    // Buscar cotações específicas das commodities
    for (const commodity of commodities) {
      const convertedPrice = convertedPrices.find(p => p.symbol === commodity.symbol);
      const price = convertedPrice?.convertedPrice || commodity.currentPrice || 0;
      
      // Mapear por nome/símbolo da commodity
      const name = commodity.name.toLowerCase();
      const symbol = commodity.symbol.toLowerCase();
      
      if (name.includes('boi') || name.includes('gado') || symbol.includes('cattle')) {
        cotacoes.pecuariaCotacao = price;
      } else if (name.includes('milho') || symbol.includes('corn')) {
        cotacoes.milhoCotacao = price;
      } else if (name.includes('soja') || symbol.includes('soy')) {
        cotacoes.sojaCotacao = price;
      } else if (name.includes('carbono') || name.includes('carbon') || symbol.includes('carbon')) {
        cotacoes.cotacaoCreditoCarbono = price;
      } else if (name.includes('madeira') || name.includes('wood') || symbol.includes('wood')) {
        cotacoes.pm3mad = price;
      }
    }
    
    // Valores padrão caso não encontre nas commodities
    if (!cotacoes.pecuariaCotacao) cotacoes.pecuariaCotacao = 2500;
    if (!cotacoes.milhoCotacao) cotacoes.milhoCotacao = 0.85;
    if (!cotacoes.sojaCotacao) cotacoes.sojaCotacao = 1.20;
    if (!cotacoes.cotacaoCreditoCarbono) cotacoes.cotacaoCreditoCarbono = 45;
    
    return cotacoes;
  } catch (error) {
    console.error('[UCS Pricing Service] Erro ao obter valores padrão:', error);
    // Retornar valores padrão em caso de erro
    return {
      pecuariaCotacao: 2500,
      milhoCotacao: 0.85,
      sojaCotacao: 1.20,
      cotacaoCreditoCarbono: 45,
      fm3: 150,
      pm3mad: 200,
      pecuariaProducao: 1.5,
      milhoProducao: 8000,
      sojaProducao: 3000,
      pibPorHectare: 50000,
      carbonoEstocado: 100
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
export function validarInputsUCS(inputs: UCSCalculationInputs): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  
  if (inputs.fm3 <= 0) erros.push('Volume de madeira (Fm3) deve ser maior que zero');
  if (inputs.pm3mad <= 0) erros.push('Preço da madeira (Pm3mad) deve ser maior que zero');
  if (inputs.carbonoEstocado <= 0) erros.push('Carbono estocado deve ser maior que zero');
  if (inputs.cotacaoCreditoCarbono <= 0) erros.push('Cotação do crédito de carbono deve ser maior que zero');
  if (inputs.pibPorHectare <= 0) erros.push('PIB por hectare deve ser maior que zero');
  
  // Validações de produção (podem ser zero, mas não negativas)
  if (inputs.pecuariaProducao < 0) erros.push('Produção de pecuária não pode ser negativa');
  if (inputs.milhoProducao < 0) erros.push('Produção de milho não pode ser negativa');
  if (inputs.sojaProducao < 0) erros.push('Produção de soja não pode ser negativa');
  
  // Validações de cotação (podem ser zero, mas não negativas)
  if (inputs.pecuariaCotacao < 0) erros.push('Cotação da pecuária não pode ser negativa');
  if (inputs.milhoCotacao < 0) erros.push('Cotação do milho não pode ser negativa');
  if (inputs.sojaCotacao < 0) erros.push('Cotação da soja não pode ser negativa');
  
  return {
    valido: erros.length === 0,
    erros
  };
}