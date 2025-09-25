
'use server';
import { CH2O_WEIGHTS } from './constants';
import { getQuoteByDate } from './data-service';

/**
 * Este serviço é responsável por todos os cálculos de ativos compostos.
 * Ele centraliza a lógica de negócio para a criação de índices como VUS, PDM, etc.
 */

// --- TIPOS E INTERFACES ---

interface CalculationConfig {
    components: readonly string[];
    calculationFn: (componentData: Record<string, number>) => Promise<number>;
}

// --- LÓGICA DE CÁLCULO ESPECÍFICA ---

/**
 * Calcula o valor do 'Valor de Uso do Solo' (VUS).
 * Fórmula: SOMA(((rent_media_boi * 35% + rent_media_milho * 30% + rent_media_soja * 35%) - (soma ponderada) * CRS) * 25)
 * Onde CRS é um fator de custo.
 */
async function calculateVUS(componentData: Record<string, number>): Promise<number> {
    const { boi_gordo = 0, milho = 0, soja = 0, crs = 0.048 } = componentData;
    
    const weightedSum = 
        (boi_gordo * CH2O_WEIGHTS.boi_gordo) +
        (milho * CH2O_WEIGHTS.milho) +
        (soja * CH2O_WEIGHTS.soja);

    // O cálculo `X - X * F` é o mesmo que `X * (1 - F)`
    const valueAfterCrs = weightedSum * (1 - crs);

    const finalValue = valueAfterCrs * 25;

    return Promise.resolve(finalValue);
}

/**
 * Calcula o valor do 'Potencial Desflorestador Monetizado' (PDM).
 * Atualmente, uma simples soma de seus componentes.
 */
async function calculatePDM(componentData: Record<string, number>): Promise<number> {
    const { vmad = 0, vus = 0, crs = 0 } = componentData;
    return Promise.resolve(vmad + vus + crs);
}

/**
 * Calcula o valor do 'Valor da Madeira' (VMAD).
 * Fórmula: rent_media da madeira * 5
 */
async function calculateVMAD(componentData: Record<string, number>): Promise<number> {
    const { madeira = 0 } = componentData;
    return Promise.resolve(madeira * 5);
}

/**
 * Calcula o valor do Custo de Responsabilidade Socioambiental (CRS), baseado no carbono.
 * Fórmula: rent_media do carbono * 25
 */
async function calculateCRS(componentData: Record<string, number>): Promise<number> {
    const { carbono = 0, custo_agua = 0 } = componentData;
    // A fórmula mencionou apenas o carbono, mas adicionamos água para flexibilidade futura.
    // Atualmente, a fórmula do usuário é `rent_media carbono * 25`.
    return Promise.resolve(carbono * 25);
}


// --- CONFIGURAÇÃO CENTRAL DE CÁLCULOS ---

// Mapeia o ID de um ativo calculável para seus componentes e a função de cálculo.
const CALCULATION_CONFIGS: Record<string, CalculationConfig> = {
    'vus': {
        components: ['boi_gordo', 'milho', 'soja', 'crs'],
        calculationFn: calculateVUS,
    },
    'vmad': {
        components: ['madeira'],
        calculationFn: calculateVMAD,
    },
    'crs': {
        components: ['carbono', 'custo_agua'],
        calculationFn: calculateCRS,
    },
    'pdm': {
        components: ['vmad', 'vus', 'crs'],
        calculationFn: calculatePDM,
    },
     'ucs': {
        components: ['pdm'], // Exemplo, pode ser mais complexo
        calculationFn: async (data) => data['pdm'] || 0,
    },
    'ucs_ase': {
        components: ['ucs', 'pdm'], // Exemplo
        calculationFn: async (data) => (data['ucs'] || 0) + (data['pdm'] || 0),
    }
};

// --- FUNÇÕES DE SERVIÇO EXPORTADAS ---

/**
 * Verifica se um ativo é calculável (ou seja, se existe em nossa configuração).
 * @param assetId O ID do ativo.
 * @returns Uma promessa que resolve para `true` se o ativo for calculável.
 */
export async function isCalculableAsset(assetId: string): Promise<boolean> {
    return Promise.resolve(assetId in CALCULATION_CONFIGS);
}

/**
 * Obtém a configuração de cálculo para um ativo específico.
 * @param assetId O ID do ativo.
 * @returns A configuração de cálculo ou nulo se não for um ativo calculável.
 */
export async function getCalculationConfig(assetId: string): Promise<CalculationConfig | null> {
    return Promise.resolve(CALCULATION_CONFIGS[assetId] || null);
}

/**
 * Retorna a lista de componentes para um ativo calculável.
 * @param assetId O ID do ativo.
 * @returns Uma lista de strings com os IDs dos componentes, ou um array vazio.
 */
export async function getAssetCompositionConfig(assetId: string): Promise<readonly string[]> {
    const config = await getCalculationConfig(assetId);
    return config?.components || [];
}

/**
 * Executa o cálculo para um ativo com base nos valores de seus componentes.
 * @param assetId O ID do ativo a ser calculado.
 * @param componentData Um record com os valores dos componentes.
 * @returns O valor calculado do ativo.
 */
export async function calculateAssetValue(assetId: string, componentData: Record<string, number>): Promise<number> {
    const config = await getCalculationConfig(assetId);
    if (!config) {
        console.error(`[calculation-service] Tentativa de calcular um ativo não configurado: ${assetId}`);
        return 0;
    }
    return config.calculationFn(componentData);
}
