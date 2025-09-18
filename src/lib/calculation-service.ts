
/**
 * @fileOverview A pure, synchronous service for performing UCS Index calculations
 * based on the new simplified methodology.
 */

import type { FormulaParameters, CalculateUcsIndexOutput, CommodityPriceData } from './types';

/**
 * Helper to find a price by category, falling back to name search.
 */
function findPrice(commodities: CommodityPriceData[], category: CommodityPriceData['category'], nameIncludes?: string): number {
    const asset = commodities.find(c => 
        c.category === category && 
        (nameIncludes ? c.name.toLowerCase().includes(nameIncludes.toLowerCase()) : true)
    );
    return asset?.price || 0;
}

/**
 * New calculation function for the UCS Index, precisely following the simplified formulas.
 * @param commodities - An array of all commodity price data objects.
 * @param params - The new simplified formula parameters.
 * @returns {CalculateUcsIndexOutput} The calculated index data.
 */
export function calculateIndex(commodities: CommodityPriceData[], params: FormulaParameters): CalculateUcsIndexOutput {
    const defaultResult: CalculateUcsIndexOutput = {
        ucs: 0,
        ivp: 0,
        pdm: 0,
        ucs_eur: 0,
        ucs_usd: 0,
        isConfigured: params.isConfigured,
        components: { vus: 0, vmad: 0, crs: 0 },
    };

    if (!params.isConfigured) {
        return defaultResult;
    }

    // --- 1. Price Lookups & Conversions ---
    const taxa_usd_brl = findPrice(commodities, 'exchange', 'dólar');
    const taxa_eur_brl = findPrice(commodities, 'exchange', 'euro');

    const preco_boi_brl = findPrice(commodities, 'vus', 'boi');
    const preco_milho_saca_brl = findPrice(commodities, 'vus', 'milho');
    const preco_soja_saca_usd = findPrice(commodities, 'vus', 'soja');
    const preco_madeira_usd_m3 = findPrice(commodities, 'vmad', 'madeira');
    const preco_carbono_eur = findPrice(commodities, 'crs', 'carbono');

    // Assume a placeholder for water price as it's not in commodities
    const preco_agua_brl_m3 = 0; 

    // Convert all prices to BRL and correct units
    const preco_milho_brl_ton = (preco_milho_saca_brl / 60) * 1000;
    const preco_soja_brl_ton = ((preco_soja_saca_usd * taxa_usd_brl) / 60) * 1000;
    const preco_madeira_brl_m3 = preco_madeira_usd_m3 * taxa_usd_brl;
    const preco_carbono_brl = preco_carbono_eur * taxa_eur_brl;

    // --- 2. Component Calculations ---

    // 2a. vUS (Valor de Uso da Terra)
    const vUS_base = (preco_boi_brl * params.produtividade_boi) +
                     (preco_milho_brl_ton * params.produtividade_milho) +
                     (preco_soja_brl_ton * params.produtividade_soja);
    const vUS = vUS_base * params.fator_uso_terra;

    // 2b. vMAD (Valor da Madeira)
    const vMAD = preco_madeira_brl_m3 * params.produtividade_madeira;

    // 2c. cRS (Custo Responsabilidade Socioambiental)
    const cRS = (preco_carbono_brl * params.credito_carbono_param) + 
                (preco_agua_brl_m3 * params.consumo_agua_param);

    // 3. PDM (Potencial Desflorestador Monetizado)
    const pdm = vUS + vMAD + cRS;
    
    // 4. IVP (Índice de Viabilidade de Projeto)
    const ivp = preco_carbono_brl > 0 ? pdm / preco_carbono_brl : 0;

    // 5. UCS (Unidade de Crédito de Sustentabilidade)
    const ucs = ivp * params.fator_ucs;

    // 6. Final Conversions
    const ucs_eur = taxa_eur_brl > 0 ? ucs / taxa_eur_brl : 0;
    const ucs_usd = taxa_usd_brl > 0 ? ucs / taxa_usd_brl : 0;

    // --- 7. Final Result Object ---
    const finalResult = {
        ucs: isFinite(ucs) ? ucs : 0,
        ivp: isFinite(ivp) ? ivp : 0,
        pdm: isFinite(pdm) ? pdm : 0,
        ucs_eur: isFinite(ucs_eur) ? ucs_eur : 0,
        ucs_usd: isFinite(ucs_usd) ? ucs_usd : 0,
        isConfigured: true,
        components: {
            vus: isFinite(vUS) ? vUS : 0,
            vmad: isFinite(vMAD) ? vMAD : 0,
            crs: isFinite(cRS) ? cRS : 0,
        }
    };
    
    return finalResult;
}
