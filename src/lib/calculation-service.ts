
'use server';

/**
 * @fileOverview A pure, synchronous service for performing UCS Index calculations.
 * It assumes all incoming prices from data-service are pre-converted to their final units and currency (BRL).
 */

import type { FormulaParameters, CalculateUcsIndexOutput, CommodityPriceData } from './types';

/**
 * Helper to find a price by its unique ID.
 * Returns 0 if not found, as the price is required for calculation.
 */
function findPrice(commodities: CommodityPriceData[], id: string): number {
    const asset = commodities.find(c => c.id === id);
    return asset?.price || 0;
}

/**
 * Calculates the UCS Index using pre-converted prices.
 * @param commodities - An array of all commodity price data objects, with prices in BRL and final units.
 * @param params - The formula parameters.
 * @returns {CalculateUcsIndexOutput} The calculated index data.
 */
export async function calculateIndex(commodities: CommodityPriceData[], params: FormulaParameters): Promise<CalculateUcsIndexOutput> {
    const defaultResult: CalculateUcsIndexOutput = {
        ucsCF: 0,
        ucsASE: 0,
        ivp: 0,
        pdm: 0,
        isConfigured: params.isConfigured,
        components: { vus: 0, vmad: 0, crs: 0 },
        vusDetails: { pecuaria: 0, milho: 0, soja: 0 },
    };

    if (!params.isConfigured) {
        return defaultResult;
    }

    // --- 1. Price Lookups (prices are already converted) ---
    // The `findPrice` function will get the 'ultimo' value which n8n has already converted to BRL/ton, BRL/m³, etc.
    const preco_boi_brl = findPrice(commodities, 'boi_gordo_futuros');
    const preco_milho_brl = findPrice(commodities, 'milho_futuros');
    const preco_soja_brl = findPrice(commodities, 'soja_futuros');
    const preco_madeira_tora_brl = findPrice(commodities, 'madeira_serrada_futuros'); // Assumes n8n converts to 'tora'
    const preco_carbono_brl = findPrice(commodities, 'credito_carbono_futuros');

    // --- 2. Calculate Rendas por Hectare (R$/ha) ---
    const renda_boi_ha = preco_boi_brl * params.produtividade_boi;
    const renda_milho_ha = preco_milho_brl * params.produtividade_milho;
    const renda_soja_ha = preco_soja_brl * params.produtividade_soja;
    const renda_madeira_ha = preco_madeira_tora_brl * params.produtividade_madeira;
    const renda_carbono_ha = preco_carbono_brl * params.FATOR_CARBONO;
    
    // --- 3. Calculate PDM Components (vUS, vMAD, cRS) por Hectare ---
    const vus_ha = ((renda_boi_ha * params.fator_pecuaria) + 
                   (renda_milho_ha * params.fator_milho) + 
                   (renda_soja_ha * params.fator_soja)) * (1 - params.fator_arrendamento);

    const vmad_ha = renda_madeira_ha;

    const base_agua_ha = vus_ha + vmad_ha + renda_carbono_ha;
    const crs_ha = renda_carbono_ha + (base_agua_ha * params.fator_agua);

    // --- 4. Calculate Final PDM Components using final multipliers ---
    const vus_final = vus_ha * params.fator_vus_final;
    const vmad_final = vmad_ha * params.fator_multiplicador_madeira;
    const crs_final = crs_ha * params.fator_crs_final;
    
    // --- 5. PDM Total ---
    const pdm = vus_final + vmad_final + crs_final;
    
    // --- 6. CE & IVP (Carbono Estocado & Índice de Viabilidade de Projeto) ---
    const carbono_estocado_total = params.produtividade_carbono * params.area_total;
    const ivp = carbono_estocado_total > 0 ? pdm / carbono_estocado_total : 0;
    
    // --- 7. UCS (Unidade de Crédito de Sustentabilidade) ---
    const ucsCF = ivp; 
    const ucsASE = ucsCF * params.fator_ucs;

    const finalResult = {
        ucsCF: isFinite(ucsCF) ? ucsCF : 0,
        ucsASE: isFinite(ucsASE) ? ucsASE : 0,
        ivp: isFinite(ivp) ? ivp : 0,
        pdm: isFinite(pdm) ? pdm : 0,
        isConfigured: true,
        components: {
            vus: isFinite(vus_final) ? vus_final : 0,
            vmad: isFinite(vmad_final) ? vmad_final : 0,
            crs: isFinite(crs_final) ? crs_final : 0,
        },
        vusDetails: {
            pecuaria: isFinite(renda_boi_ha) ? renda_boi_ha : 0,
            milho: isFinite(renda_milho_ha) ? renda_milho_ha : 0,
            soja: isFinite(renda_soja_ha) ? renda_soja_ha : 0,
        }
    };
    
    return finalResult;
}
