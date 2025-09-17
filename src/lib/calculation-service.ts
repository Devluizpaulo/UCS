

/**
 * @fileOverview A pure, synchronous service for performing UCS Index calculations.
 * This file should NOT be marked with 'use server' as it contains only calculation logic
 * and is designed to be imported by server-side modules without causing build conflicts.
 */

import type { FormulaParameters, CalculateUcsIndexOutput, CommodityPriceData } from './types';


/**
 * Helper function to find a price by category and an optional name keyword.
 * It makes the calculation robust against name changes in the config.
 */
function findPrice(commodities: CommodityPriceData[], category: CommodityPriceData['category'], nameIncludes?: string): number {
    const asset = commodities.find(c => 
        c.category === category && 
        (nameIncludes ? c.name.toLowerCase().includes(nameIncludes.toLowerCase()) : true)
    );
    if (!asset || asset.price === undefined || asset.price === null) {
        // This warning is expected for assets that might not have a price yet.
        // console.warn(`[CalculationService] Missing price for asset in category: ${category} ${nameIncludes ? `(with keyword: ${nameIncludes})` : ''}. Defaulting to 0.`);
        return 0;
    }
    return asset.price;
}


/**
 * Pure calculation function for the UCS Index. This is not a flow and can be called from anywhere.
 * @param commodities - An array of all commodity price data objects.
 * @param params - The formula parameters.
 * @returns {CalculateUcsIndexOutput} The calculated index data.
 */
export function calculateIndex(commodities: CommodityPriceData[], params: FormulaParameters): CalculateUcsIndexOutput {
      const defaultResult = { 
          indexValue: 0, 
          isConfigured: params.isConfigured,
          components: { vm: 0, vus: 0, crs: 0 }, 
          vusDetails: { pecuaria: 0, milho: 0, soja: 0 }
      };
      
      if (!params.isConfigured) {
          return defaultResult;
      }
      
      // --- Dynamic Price Lookups based on Category ---
      const taxa_usd_brl_asset = commodities.find(c => c.ticker === 'BRL=X');
      const taxa_eur_brl_asset = commodities.find(c => c.ticker === 'EURBRL=X');
      
      const taxa_usd_brl = taxa_usd_brl_asset ? taxa_usd_brl_asset.price : 0;
      const taxa_eur_brl = taxa_eur_brl_asset ? taxa_eur_brl_asset.price : 0;

      const preco_madeira_usd = findPrice(commodities, 'vmad', 'madeira');
      const preco_boi_arroba_brl = findPrice(commodities, 'vus', 'boi');
      const preco_milho_saca_brl = findPrice(commodities, 'vus', 'milho');
      const preco_soja_saca_usd = findPrice(commodities, 'vus', 'soja');
      const preco_carbono_eur = findPrice(commodities, 'crs', 'carbono');
  
      // --- Data Validation ---
      const prices = {taxa_usd_brl, taxa_eur_brl, preco_madeira_usd, preco_boi_arroba_brl, preco_milho_saca_brl, preco_soja_saca_usd, preco_carbono_eur};
      for (const [key, value] of Object.entries(prices)) {
         if (value === 0) {
            console.error(`[CalculationService] Price for ${key} is zero or missing. Aborting calculation.`);
            return { ...defaultResult, isConfigured: true };
         }
      }
  
      // --- Price Conversions ---
      const preco_madeira_brl = preco_madeira_usd * taxa_usd_brl;
      const preco_soja_saca_brl = preco_soja_saca_usd * taxa_usd_brl;
      const preco_milho_ton_brl = (preco_milho_saca_brl / 60) * 1000;
      const preco_soja_ton_brl = (preco_soja_saca_brl / 60) * 1000;
      const preco_carbono_brl = preco_carbono_eur * taxa_eur_brl;

      // --- 1. VUS (Valor de Uso do Solo) ---
      const renda_pecuaria_ha = params.produtividade_boi * preco_boi_arroba_brl;
      const renda_milho_ha = params.produtividade_milho * preco_milho_ton_brl;
      const renda_soja_ha = params.produtividade_soja * preco_soja_ton_brl;
      
      const renda_bruta_ponderada_ha = (renda_pecuaria_ha * params.fator_pecuaria) + (renda_milho_ha * params.fator_milho) + (renda_soja_ha * params.fator_soja);
      const vus_por_ha = renda_bruta_ponderada_ha * params.fator_arrendamento;
      const VUS = vus_por_ha * params.area_total;
      
      // --- 2. VMAD (Valor da Madeira) ---
      const VMAD = params.produtividade_madeira * preco_madeira_brl * params.area_total;

      // --- 3. CRS (Custo da Responsabilidade Socioambiental) ---
      const tCo2_por_hectare = 2.59;
      const valor_carbono = preco_carbono_brl * tCo2_por_hectare * params.area_total;
      const valor_agua = params.pib_por_hectare * params.fator_agua * params.area_total;
      const CRS = valor_carbono + valor_agua;
      
      // --- 4. UCS INDEX (Final Value) ---
      const PDM = VMAD + VUS + CRS;
      const CE = params.produtividade_carbono * params.area_total;
      if (CE === 0) {
        console.error('[CalculationService] Carbono Estocado (CE) is zero. Division by zero would occur. Aborting calculation.');
        return { ...defaultResult, isConfigured: true };
      }
      const IVP = (PDM / CE) / 2;
      const ucsValue = params.fator_ucs * IVP;
  
      if (!isFinite(ucsValue)) {
          console.error('[CalculationService] UCS calculation resulted in a non-finite number. Returning default.');
          return { ...defaultResult, isConfigured: true };
      }
  
      return { 
          indexValue: parseFloat(ucsValue.toFixed(4)),
          isConfigured: params.isConfigured,
          components: {
              vm: parseFloat(VMAD.toFixed(2)),
              vus: parseFloat(VUS.toFixed(2)),
              crs: parseFloat(CRS.toFixed(2)),
          },
          vusDetails: {
              pecuaria: parseFloat((renda_pecuaria_ha * params.fator_pecuaria * params.area_total * params.fator_arrendamento).toFixed(2)),
              milho: parseFloat((renda_milho_ha * params.fator_milho * params.area_total * params.fator_arrendamento).toFixed(2)),
              soja: parseFloat((renda_soja_ha * params.fator_soja * params.area_total * params.fator_arrendamento).toFixed(2)),
          }
      };
}
    
