
/**
 * Serviço de Cálculo Real - Baseado nas fórmulas EXATAS do N8N e do documento FORMULAS_AND_CASCADE.md
 * 
 * Este serviço implementa as fórmulas reais para permitir simulação e correção manual 
 * de valores no painel de auditoria.
 */

export interface CalculationResult {
  id: string;
  name: string;
  currentValue: number;
  newValue: number;
  formula: string;
  components?: Record<string, number>;
  conversions?: Record<string, string>;
}

export interface SimulationInput {
  // Ativos base (cotados)
  usd: number;
  eur: number;
  soja: number;
  milho: number;
  boi_gordo: number;
  carbono: number;
  madeira: number;
  
  // Valores atuais dos índices (para comparação)
  current_vus?: number;
  current_vmad?: number;
  current_carbono_crs?: number;
  current_ch2o_agua?: number;
  current_custo_agua?: number;
  current_agua_crs?: number;
  current_valor_uso_solo?: number;
  current_pdm?: number;
  current_ucs?: number;
  current_ucs_ase?: number;
}


// ===================================================================================
// NÍVEL 2: RENTABILIDADES MÉDIAS (BRL/HA) - Fórmulas exatas do documento
// ===================================================================================

/**
 * Converte soja USD/saca para BRL/ha.
 * Fórmula: ((((sojaPrice * usdRate) / 60) * 1000) + 0.01990) * 3.3
 */
export function calculateRentMediaSoja(sojaPrice: number, usdRate: number): number {
  const sojaBRL = sojaPrice * usdRate;
  const tonBRL = ((sojaBRL / 60) * 1000) + 0.01990;
  return tonBRL * 3.3;
}

/**
 * Converte milho BRL/saca para BRL/ha.
 * Fórmula: ((milhoPrice / 60) * 1000) * 7.20
 */
export function calculateRentMediaMilho(milhoPrice: number): number {
  const tonBRL = (milhoPrice / 60) * 1000;
  return tonBRL * 7.20;
}

/**
 * Converte boi gordo BRL/arroba para BRL/ha.
 * Fórmula: boiPrice * 18
 */
export function calculateRentMediaBoi(boiPrice: number): number {
  return boiPrice * 18;
}

/**
 * Converte madeira USD para BRL/ha.
 * Fórmula: (((madeiraPrice * 0.375620342) * usdRate) + 0.02) * 1196.54547720813 * 0.10
 */
export function calculateRentMediaMadeira(madeiraPrice: number, usdRate: number): number {
  const madeiraToraUSD = madeiraPrice * 0.375620342;
  const madeiraToraBRL = (madeiraToraUSD * usdRate) + 0.02;
  return madeiraToraBRL * 1196.54547720813 * 0.10;
}

/**
 * Converte carbono EUR para BRL/ha.
 * Fórmula: (carbonoPrice * eurRate) * 2.59
 */
export function calculateRentMediaCarbono(carbonoPrice: number, eurRate: number): number {
  const carbonoBRL = carbonoPrice * eurRate;
  return carbonoBRL * 2.59;
}


// ===================================================================================
// NÍVEL 3: ÍNDICES DE COMPOSIÇÃO - Fórmulas exatas do documento
// ===================================================================================

/**
 * Calcula o VUS (Valor de Uso do Solo).
 * Fórmula: ((rentBoi * 0.35) + (rentMilho * 0.30) + (rentSoja * 0.35)) * (1 - 0.048) * 25
 */
export function calculateVUS(rentMediaBoi: number, rentMediaMilho: number, rentMediaSoja: number): number {
  const somaPonderada = (rentMediaBoi * 0.35) + (rentMediaMilho * 0.30) + (rentMediaSoja * 0.35);
  return somaPonderada * (1 - 0.048) * 25;
}

/**
 * Calcula o VMAD (Valor da Madeira).
 * Fórmula: rent_media_madeira * 5
 */
export function calculateVMAD(rentMediaMadeira: number): number {
  return rentMediaMadeira * 5;
}

/**
 * Calcula o Carbono CRS.
 * Fórmula: rent_media_carbono * 25
 */
export function calculateCarbonoCRS(rentMediaCarbono: number): number {
  return rentMediaCarbono * 25;
}

/**
 * Calcula o CH2O Água (índice intermediário).
 * Fórmula: (rentBoi*0.35) + (rentMilho*0.30) + (rentSoja*0.35) + rentMadeira + rentCarbono
 */
export function calculateCH2OAgua(
  rentMediaBoi: number, rentMediaMilho: number, rentMediaSoja: number,
  rentMediaMadeira: number, rentMediaCarbono: number
): number {
  return (rentMediaBoi * 0.35) + (rentMediaMilho * 0.30) + (rentMediaSoja * 0.35) + rentMediaMadeira + rentMediaCarbono;
}


// ===================================================================================
// NÍVEL 4: ÍNDICES FINAIS (CASCATA) - Fórmulas exatas do documento
// ===================================================================================

/**
 * Calcula o Custo Água.
 * Fórmula: ch2o_agua * 0.07
 */
export function calculateCustoAgua(ch2oAgua: number): number {
  return ch2oAgua * 0.07;
}

/**
 * Calcula o PDM (Potencial Desflorestador Monetizado).
 * Fórmula: ch2o_agua + custo_agua
 */
export function calculatePDM(ch2oAgua: number, custoAgua: number): number {
  return ch2oAgua + custoAgua;
}

/**
 * Calcula o UCS (Unidade de Crédito de Sustentabilidade).
 * Fórmula: (pdm / 900) / 2
 */
export function calculateUCS(pdm: number): number {
  return (pdm / 900) / 2;
}

/**
 * Calcula o UCS ASE (Índice Final) e suas conversões.
 * Fórmula: ucs * 2
 */
export function calculateUCSASE(ucs: number, cotacaoUSD: number, cotacaoEUR: number): {
  valor_brl: number; valor_usd: number; valor_eur: number;
  componentes: Record<string, number>; conversions: Record<string, string>;
} {
  const ucsASEBRL = ucs * 2;
  const ucsASEUSD = cotacaoUSD > 0 ? ucsASEBRL / cotacaoUSD : 0;
  const ucsASEEUR = cotacaoEUR > 0 ? ucsASEBRL / cotacaoEUR : 0;

  return {
    valor_brl: ucsASEBRL,
    valor_usd: ucsASEUSD,
    valor_eur: ucsASEEUR,
    componentes: {
      ucs_original_brl: ucs,
      resultado_final_brl: ucsASEBRL,
      resultado_final_usd: ucsASEUSD,
      resultado_final_eur: ucsASEEUR
    },
    conversions: {
      brl_para_usd: `${ucsASEBRL.toFixed(4)} / ${cotacaoUSD.toFixed(4)} = ${ucsASEUSD.toFixed(4)}`,
      brl_para_eur: `${ucsASEBRL.toFixed(4)} / ${cotacaoEUR.toFixed(4)} = ${ucsASEEUR.toFixed(4)}`
    }
  };
}


// ============= SIMULAÇÃO COMPLETA COM FÓRMULAS REAIS =============

/**
 * Executa simulação completa usando as fórmulas EXATAS do documento.
 */
export function runCompleteSimulation(input: SimulationInput): CalculationResult[] {
  try {
    // Nível 2: Calcular rentabilidades médias
    const rentMediaSoja = calculateRentMediaSoja(input.soja, input.usd);
    const rentMediaMilho = calculateRentMediaMilho(input.milho);
    const rentMediaBoi = calculateRentMediaBoi(input.boi_gordo);
    const rentMediaCarbono = calculateRentMediaCarbono(input.carbono, input.eur);
    const rentMediaMadeira = calculateRentMediaMadeira(input.madeira, input.usd);

    // Nível 3: Calcular índices de composição
    const vus = calculateVUS(rentMediaBoi, rentMediaMilho, rentMediaSoja);
    const vmad = calculateVMAD(rentMediaMadeira);
    const carbonoCrs = calculateCarbonoCRS(rentMediaCarbono);
    const ch2oAgua = calculateCH2OAgua(rentMediaBoi, rentMediaMilho, rentMediaSoja, rentMediaMadeira, rentMediaCarbono);

    // Nível 4: Calcular índices finais (Cascata)
    const custoAgua = calculateCustoAgua(ch2oAgua);
    const pdm = calculatePDM(ch2oAgua, custoAgua);
    const ucs = calculateUCS(pdm);
    const ucsAseData = calculateUCSASE(ucs, input.usd, input.eur);
    
    // O documento menciona um ativo `Agua_CRS` que é derivado. 
    // Com base na fórmula `valor_uso_solo`, Agua_CRS é o próprio `ch2o_agua`.
    const aguaCrs = ch2oAgua;
    const valorUsoSolo = vus + vmad + carbonoCrs + aguaCrs;


    // Estrutura para armazenar todos os valores calculados
    const calculatedValues = {
      vus, vmad, carbono_crs: carbonoCrs, ch2o_agua: ch2oAgua, custo_agua: custoAgua, 
      Agua_CRS: aguaCrs, valor_uso_solo: valorUsoSolo, pdm, ucs, ucs_ase: ucsAseData.valor_brl
    };
    
    // Mapeamento de Fórmulas para Exibição
    const formulas: Record<string, string> = {
      vus: '((rentBoi * 0.35) + (rentMilho * 0.30) + (rentSoja * 0.35)) * (1 - 0.048) * 25',
      vmad: 'rent_media_madeira * 5',
      carbono_crs: 'rent_media_carbono * 25',
      ch2o_agua: '(rentBoi*35%)+(rentMilho*30%)+(rentSoja*35%)+Madeira+Carbono',
      custo_agua: 'ch2o_agua * 0.07',
      Agua_CRS: 'valor_CH2O',
      valor_uso_solo: 'VUS + Vmad + Carbono_CRS + Agua_CRS',
      pdm: 'ch2o_agua + custo_agua',
      ucs: '(PDM / 900) / 2',
      ucs_ase: 'UCS * 2',
    };

    // Gera o resultado final
    return Object.entries(calculatedValues).map(([assetId, newValue]) => {
      const currentValueKey = `current_${assetId}` as keyof SimulationInput;
      const currentValue = input[currentValueKey] as number || 0;
      
      let result: CalculationResult = {
        id: assetId,
        name: getAssetDisplayName(assetId),
        currentValue: currentValue,
        newValue: newValue,
        formula: formulas[assetId] || 'N/A',
      };
      
      if(assetId === 'ucs_ase') {
        result.components = ucsAseData.componentes;
        result.conversions = ucsAseData.conversions;
      }
      
      return result;
    });

  } catch (error) {
    console.error('Erro na simulação completa:', error);
    return [];
  }
}

function getAssetDisplayName(assetId: string): string {
  const names: Record<string, string> = {
    vus: 'VUS', vmad: 'VMAD', carbono_crs: 'Carbono CRS', ch2o_agua: 'CH2O Água',
    custo_agua: 'Custo Água', Agua_CRS: 'Água CRS', valor_uso_solo: 'Valor Uso Solo',
    pdm: 'PDM', ucs: 'UCS', ucs_ase: 'UCS ASE'
  };
  return names[assetId] || assetId;
}
