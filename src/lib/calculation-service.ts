
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
        console.error(`[LOG] Missing or zero price for required asset in category: ${category} ${nameIncludes ? `(with keyword: ${nameIncludes})` : ''}.`);
        return 0; // Return 0 to prevent calculation errors, the main function will handle this.
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
      const taxa_usd_brl = findPrice(commodities, 'exchange', 'USD/BRL');
      const taxa_eur_brl = findPrice(commodities, 'exchange', 'EUR/BRL');
      const preco_lumber_mbf = findPrice(commodities, 'forestry'); // Assumes only one forestry product
      const preco_boi_arroba = findPrice(commodities, 'agriculture', 'Boi');
      const preco_milho_brl = findPrice(commodities, 'agriculture', 'Milho');
      const preco_soja_usd = findPrice(commodities, 'agriculture', 'Soja');
      const preco_carbono_eur = findPrice(commodities, 'carbon'); // Assumes only one carbon product
  
      // --- Data Validation ---
      const prices = [taxa_usd_brl, taxa_eur_brl, preco_lumber_mbf, preco_boi_arroba, preco_milho_brl, preco_soja_usd, preco_carbono_eur];
      if (prices.some(p => p === 0)) {
          console.error("[LOG] One or more required asset prices are zero or missing. Aborting calculation.");
          return { ...defaultResult, isConfigured: true }; // Return default but indicate it was configured
      }
  
      // --- Price Conversions ---
      const preco_madeira_serrada_m3_usd = (preco_lumber_mbf / 1000) * 424;
      const preco_madeira_serrada_m3_brl = preco_madeira_serrada_m3_usd * taxa_usd_brl;
      const preco_madeira_tora_m3_brl = preco_madeira_serrada_m3_brl * params.FATOR_CONVERSAO_SERRADA_TORA;
      const preco_milho_ton_brl = preco_milho_brl * (1000 / 60);
      const preco_soja_ton_usd = preco_soja_usd * (1000 / 60);
      const preco_soja_ton_brl = preco_soja_ton_usd * taxa_usd_brl;
      const preco_carbono_brl = preco_carbono_eur * taxa_eur_brl;
      
      // --- Formula Calculation ---
      const VM = preco_madeira_tora_m3_brl * params.VOLUME_MADEIRA_HA;
      const renda_pecuaria = params.PROD_BOI * preco_boi_arroba * params.PESO_PEC;
      const renda_milho = params.PROD_MILHO * preco_milho_ton_brl * params.PESO_MILHO;
      const renda_soja = params.PROD_SOJA * preco_soja_ton_brl * params.PESO_SOJA;
      const renda_bruta_ha = renda_pecuaria + renda_milho + renda_soja;
      const VUS = renda_bruta_ha / params.FATOR_ARREND;
      const valor_carbono = preco_carbono_brl * params.VOLUME_MADEIA_HA * params.FATOR_CARBONO;
      const valor_agua = VUS * params.FATOR_AGUA;
      const CRS = valor_carbono + valor_agua;
      
      const ucsValue = VM + VUS + CRS;
  
      if (!isFinite(ucsValue)) {
          console.error('[LOG] UCS calculation resulted in a non-finite number. Returning default.');
          return { ...defaultResult, isConfigured: true };
      }
  
      return { 
          indexValue: parseFloat(ucsValue.toFixed(2)),
          isConfigured: params.isConfigured,
          components: {
              vm: parseFloat(VM.toFixed(2)),
              vus: parseFloat(VUS.toFixed(2)),
              crs: parseFloat(CRS.toFixed(2)),
          },
          vusDetails: {
              pecuaria: parseFloat((renda_pecuaria / params.FATOR_ARREND).toFixed(2)),
              milho: parseFloat((renda_milho / params.FATOR_ARREND).toFixed(2)),
              soja: parseFloat((renda_soja / params.FATOR_ARREND).toFixed(2)),
          }
      };
}
