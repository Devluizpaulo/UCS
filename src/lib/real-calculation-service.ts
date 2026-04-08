
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
 * Fórmula: ((rentBoi * 0.35) + (rentMilho * 0.30) + (rentSoja * 0.35)) * 4.80 * 25
 */
export function calculateVUS(rentMediaBoi: number, rentMediaMilho: number, rentMediaSoja: number): number {
  const somaPonderada = (rentMediaBoi * 0.35) + (rentMediaMilho * 0.30) + (rentMediaSoja * 0.35);
  return somaPonderada * 4.80 * 25;
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
    // Garantir que os inputs básicos sejam números válidos
    const usd = Number(input.usd) || 0;
    const eur = Number(input.eur) || 0;
    const soja = Number(input.soja) || 0;
    const milho = Number(input.milho) || 0;
    const boi = Number(input.boi_gordo) || 0;
    const carbono = Number(input.carbono) || 0;
    const madeira = Number(input.madeira) || 0;

    const rentMediaSoja = calculateRentMediaSoja(soja, usd);
    const rentMediaMilho = calculateRentMediaMilho(milho);
    const rentMediaBoi = calculateRentMediaBoi(boi);
    const rentMediaCarbono = calculateRentMediaCarbono(carbono, eur);
    const rentMediaMadeira = calculateRentMediaMadeira(madeira, usd);

    // Nível 3: Calcular índices de composição
    // Nota: O multiplicador 4.80 (VUS_INTERMEDIATE_MULTIPLIER) é usado aqui em vez de (1 - 0.048)
    const somaPonderadaVUS = (rentMediaBoi * 0.35) + (rentMediaMilho * 0.30) + (rentMediaSoja * 0.35);
    const vus = somaPonderadaVUS * 4.80 * 25;
    
    const vmad = calculateVMAD(rentMediaMadeira);
    const carbonoCrs = calculateCarbonoCRS(rentMediaCarbono);
    
    // O CH2O Água é a base para o Água CRS e para o PDM
    const ch2oAgua = (rentMediaBoi * 0.35) + (rentMediaMilho * 0.30) + (rentMediaSoja * 0.35) + rentMediaMadeira + rentMediaCarbono;

    // Nível 4: Calcular índices finais (Cascata)
    const custoAgua = ch2oAgua * 0.07;
    const pdm = ch2oAgua + custoAgua;
    const ucs = (pdm / 900) / 2;
    const ucsAseData = calculateUCSASE(ucs, usd, eur);
    
    // Agua_CRS é o próprio ch2o_agua
    const aguaCrs = ch2oAgua;
    const valorUsoSolo = vus + vmad + carbonoCrs + aguaCrs;

    // Estrutura para armazenar todos os valores calculados
    const calculatedValues = {
      vus, 
      vmad, 
      carbono_crs: carbonoCrs, 
      ch2o_agua: ch2oAgua, 
      custo_agua: custoAgua, 
      Agua_CRS: aguaCrs, 
      valor_uso_solo: valorUsoSolo, 
      pdm, 
      ucs, 
      ucs_ase: ucsAseData.valor_brl
    };
    
    // Mapeamento de Fórmulas para Exibição
    const formulas: Record<string, string> = {
      vus: '((rentBoi * 35%) + (rentMilho * 30%) + (rentSoja * 35%)) * 4.8 * 25',
      vmad: 'rent_media_madeira * 5',
      carbono_crs: 'rent_media_carbono * 25',
      ch2o_agua: '(Boi*35%)+(Milho*30%)+(Soja*35%)+Madeira+Carbono',
      custo_agua: 'ch2o_agua * 0.07',
      Agua_CRS: 'ch2o_agua',
      valor_uso_solo: 'VUS + Vmad + Carbono_CRS + Agua_CRS',
      pdm: 'ch2o_agua + custo_agua',
      ucs: '(PDM / 900) / 2',
      ucs_ase: 'UCS * 2',
    };

    // Gera o resultado final garantindo que todos os itens existam
    return Object.entries(calculatedValues).map(([assetId, newValue]) => {
      const adjustedKey = assetId === 'Agua_CRS' ? 'current_agua_crs' : `current_${assetId}`;
      const currentValue = (input as any)[adjustedKey] || 0;
      
      const result: CalculationResult = {
        id: assetId,
        name: getAssetDisplayName(assetId),
        currentValue: Number(currentValue) || 0,
        newValue: Number(newValue) || 0,
        formula: formulas[assetId] || 'N/A',
      };
      
      if (assetId === 'ucs_ase' && ucsAseData) {
        result.components = ucsAseData.componentes;
        result.conversions = ucsAseData.conversions;
      }
      
      return result;
    });

  } catch (error) {
    console.error('CRITICAL: Erro na simulação completa:', error);
    // Retorna um fallback em vez de array vazio para evitar que o modal trave
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
