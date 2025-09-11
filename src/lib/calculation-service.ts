
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
      const preco_madeira_usd = findPrice(commodities, 'vmad'); // Lumber price from CME
      const preco_boi_arroba_brl = findPrice(commodities, 'vus', 'Boi');
      const preco_milho_saca_brl = findPrice(commodities, 'vus', 'Milho');
      const preco_soja_saca_usd = findPrice(commodities, 'vus', 'Soja');
      const preco_carbono_eur = findPrice(commodities, 'crs'); // Carbon credit price
  
      // --- Data Validation ---
      const prices = {taxa_usd_brl, taxa_eur_brl, preco_madeira_usd, preco_boi_arroba_brl, preco_milho_saca_brl, preco_soja_saca_usd, preco_carbono_eur};
      for (const [key, value] of Object.entries(prices)) {
         if (value === 0) {
            console.error(`[LOG] Price for ${key} is zero or missing. Aborting calculation.`);
            return { ...defaultResult, isConfigured: true }; // Return default but indicate it was configured
         }
      }
  
      // --- Price Conversions ---
      const preco_soja_saca_brl = preco_soja_saca_usd * taxa_usd_brl;
      const preco_milho_ton_brl = preco_milho_saca_brl * (1000 / 60);
      const preco_soja_ton_brl = preco_soja_saca_brl * (1000 / 60);
      const preco_carbono_brl = preco_carbono_eur * taxa_eur_brl;

      // --- 1. VUS (Valor de Uso do Solo) ---
      const renda_pecuaria = params.PROD_BOI * preco_boi_arroba_brl;
      const renda_milho = params.PROD_MILHO * preco_milho_ton_brl;
      const renda_soja = params.PROD_SOJA * preco_soja_ton_brl;
      
      const renda_bruta_ponderada = (renda_pecuaria * params.PESO_PEC) + (renda_milho * params.PESO_MILHO) + (renda_soja * params.PESO_SOJA);
      const VUS = renda_bruta_ponderada / params.FATOR_ARREND;
      
      // --- 2. VMAD (Valor da Madeira) ---
      // According to user: VMAD = (Fator_m3 × preço_madeira) × fator_conversão
      // Assuming Fator_m3 is volume, price is per unit, and conversion adjusts it.
      const VMAD = (params.VOLUME_MADEIRA_HA * (preco_madeira_usd * taxa_usd_brl)) * params.FATOR_CONVERSAO_SERRADA_TORA;

      // --- 3. CRS (Custo da Responsabilidade Socioambiental) ---
      // CRS = CC + cH2O
      // CC = CCc × tCo2(n) onde tCo2(n) = 2.59 unidades de Cc por hectare
      // cH2O = FCH2O = 7% do PIB por hectare
      const tCo2_por_hectare = 2.59;
      const valor_carbono = preco_carbono_brl * tCo2_por_hectare * params.area_total;
      const valor_agua = params.pib_por_hectare * params.fator_agua * params.area_total;
      const CRS = valor_carbono + valor_agua;
      
      // --- 4. UCS INDEX (Final Value) ---
      const ucsValue = VUS + VMAD + CRS;
  
      if (!isFinite(ucsValue)) {
          console.error('[LOG] UCS calculation resulted in a non-finite number. Returning default.');
          return { ...defaultResult, isConfigured: true };
      }
  
      return { 
          indexValue: parseFloat(ucsValue.toFixed(2)),
          isConfigured: params.isConfigured,
          components: {
              vm: parseFloat(VMAD.toFixed(2)),
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
