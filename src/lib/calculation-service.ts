
'use server';

/**
 * @fileOverview A pure, synchronous service for performing UCS Index calculations,
 * meticulously mirroring the user's provided Excel spreadsheet logic.
 */

import type { FormulaParameters, CalculateUcsIndexOutput, CommodityPriceData } from './types';

/**
 * Helper to find a price by its unique ID (ticker/name).
 */
function findPrice(commodities: CommodityPriceData[], id: string): number {
    const asset = commodities.find(c => c.id === id);
    return asset?.price || 0;
}

/**
 * Calculates the UCS Index, precisely following the user-provided Excel formulas.
 * @param commodities - An array of all commodity price data objects.
 * @param params - The formula parameters, aligned with the spreadsheet.
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

    // --- 1. Price Lookups & Unit Conversions ---
    const taxa_usd_brl = findPrice(commodities, 'usd_brl___dolar_americano_real_brasileiro');
    const taxa_eur_brl = findPrice(commodities, 'eur_brl___euro_real_brasileiro');
    
    // Prices from 'getCommodityPrices' are already in the base unit (e.g., BRL/arroba, USD/saca)
    const preco_boi_brl_arroba = findPrice(commodities, 'boi_gordo_futuros');
    const preco_milho_usd_saca = findPrice(commodities, 'milho_futuros');
    const preco_soja_usd_saca = findPrice(commodities, 'soja_futuros');
    const preco_madeira_usd_mbf = findPrice(commodities, 'madeira_serrada_futuros'); // Price per 1,000 board feet
    const preco_carbono_eur_ton = findPrice(commodities, 'credito_carbono_futuros');

    // Convert all prices to BRL and correct final units (R$/ha)
    const preco_milho_brl_ton = (preco_milho_usd_saca * taxa_usd_brl / 60) * 1000;
    const preco_soja_brl_ton = (preco_soja_usd_saca * taxa_usd_brl / 60) * 1000;
    
    // The price of "Madeira Serrada" is for 1,000 board feet. We need to get it to m³.
    // As per standard conversion, 1 m³ ≈ 424 board feet. So, price per m³ = (price_mbf / 1000) * 424.
    // For now, we use a direct conversion factor from the user's sheet.
    const preco_madeira_brl_m3 = (preco_madeira_usd_mbf * taxa_usd_brl);
    
    const preco_carbono_brl_ton = preco_carbono_eur_ton * taxa_eur_brl;

    // --- 2. Calculate Individual Rents per Hectare (R$/ha) ---
    const renda_boi_ha = preco_boi_brl_arroba * params.produtividade_boi;
    const renda_milho_ha = preco_milho_brl_ton * params.produtividade_milho;
    const renda_soja_ha = preco_soja_brl_ton * params.produtividade_soja;
    const renda_madeira_ha = preco_madeira_brl_m3 * params.fator_conversao_madeira * params.produtividade_madeira;
    const renda_carbono_ha = preco_carbono_brl_ton * params.FATOR_CARBONO;

    // --- 3. Calculate Total Component Values (Multiplied by Area) ---

    // 3a. VUS (Valor de Uso do Solo)
    const vus_ponderado_ha = (renda_boi_ha * params.fator_pecuaria) + 
                             (renda_milho_ha * params.fator_milho) + 
                             (renda_soja_ha * params.fator_soja);
    const vus = vus_ponderado_ha * params.fator_arrendamento * params.area_total;

    // 3b. VMAD (Valor da Madeira)
    const vmad = renda_madeira_ha * params.area_total;

    // 3c. CRS (Custo Responsabilidade Socioambiental)
    const base_calculo_agua_ha = vus_ponderado_ha + renda_madeira_ha + renda_carbono_ha;
    const custo_agua_total = base_calculo_agua_ha * params.fator_agua * params.area_total;
    const custo_carbono_total = renda_carbono_ha * params.area_total;
    const crs = custo_agua_total + custo_carbono_total;
    
    // --- 4. PDM (Potencial Desflorestador Monetizado) ---
    const pdm = vus + vmad + crs;

    // --- 5. CE & IVP (Carbono Estocado & Índice de Viabilidade de Projeto) ---
    const ce = params.produtividade_carbono * params.area_total;
    const ivp = ce > 0 ? pdm / ce : 0;

    // --- 6. UCS (Unidade de Crédito de Sustentabilidade) ---
    // According to the sheet, UCS CF is the IVP. The final factor is for UCS ASE.
    const ucsCF = ivp; 
    const ucsASE = ucsCF * params.fator_ucs; // 'fator_ucs' is now the multiplier for ASE, e.g., 2.

    const finalResult = {
        ucsCF: isFinite(ucsCF) ? ucsCF : 0,
        ucsASE: isFinite(ucsASE) ? ucsASE : 0,
        ivp: isFinite(ivp) ? ivp : 0,
        pdm: isFinite(pdm) ? pdm : 0,
        isConfigured: true,
        components: {
            vus: isFinite(vus) ? vus : 0,
            vmad: isFinite(vmad) ? vmad : 0,
            crs: isFinite(crs) ? crs : 0,
        },
        vusDetails: {
            pecuaria: isFinite(renda_boi_ha) ? renda_boi_ha : 0,
            milho: isFinite(renda_milho_ha) ? renda_milho_ha : 0,
            soja: isFinite(renda_soja_ha) ? renda_soja_ha : 0,
        }
    };
    
    return finalResult;
}
