

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
      const preco_soja_saca_usd = findprice(commodities, 'vus', 'Soja');
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
      const preco_madeira_brl = preco_madeira_usd * taxa_usd_brl;
      const preco_soja_saca_brl = preco_soja_saca_usd * taxa_usd_brl;
      // Convert price per 60kg saca to price per 1000kg (ton)
      const preco_milho_ton_brl = (preco_milho_saca_brl / 60) * 1000;
      const preco_soja_ton_brl = (preco_soja_saca_brl / 60) * 1000;
      const preco_carbono_brl = preco_carbono_eur * taxa_eur_brl;

      // --- 1. VUS (Valor de Uso do Solo) ---
      // Renda = Produtividade (em @, ton, etc.) * Preço (na mesma unidade)
      const renda_pecuaria_ha = params.PROD_BOI * preco_boi_arroba_brl;
      const renda_milho_ha = params.PROD_MILHO * preco_milho_ton_brl;
      const renda_soja_ha = params.PROD_SOJA * preco_soja_ton_brl;
      
      const renda_bruta_ponderada_ha = (renda_pecuaria_ha * params.PESO_PEC) + (renda_milho_ha * params.PESO_MILHO) + (renda_soja_ha * params.PESO_SOJA);
      const vus_por_ha = renda_bruta_ponderada_ha * params.FATOR_ARREND;
      const VUS = vus_por_ha * params.area_total;
      
      // --- 2. VMAD (Valor da Madeira) ---
      // Based on LOGICA_FORMULA_UCS.md: vMAD = produtividade_madeira × preço_madeira_m3 × area_total
      const VMAD = params.produtividade_madeira * preco_madeira_brl * params.area_total;

      // --- 3. CRS (Custo da Responsabilidade Socioambiental) ---
      // CRS = CC + cH2O
      // CC = CCc × tCo2(n) onde tCo2(n) = 2.59 unidades de Cc por hectare
      // cH2O = FCH2O = 7% do PIB por hectare
      const tCo2_por_hectare = 2.59;
      const valor_carbono = preco_carbono_brl * tCo2_por_hectare * params.area_total;
      const valor_agua = params.pib_por_hectare * params.fator_agua * params.area_total;
      const CRS = valor_carbono + valor_agua;
      
      // --- 4. UCS INDEX (Final Value) ---
      // Based on LOGICA_FORMULA_UCS.md
      // PDM = Potencial Desflorestador Monetizado = vMAD + vUS + cRS
      const PDM = VMAD + VUS + CRS;
      // CE = Carbono Estocado em equivalência à tCO2 = produtividade_carbono × area_total
      const CE = params.produtividade_carbono * params.area_total;
      if (CE === 0) {
        console.error('[LOG] Carbono Estocado (CE) is zero. Division by zero would occur. Aborting calculation.');
        return { ...defaultResult, isConfigured: true };
      }
      // IVP = Índice de Viabilidade de Projeto = (PDM / CE) / 2
      const IVP = (PDM / CE) / 2;
      // UCS = FATOR_UCS × IVP
      const ucsValue = params.fator_ucs * IVP;
  
      if (!isFinite(ucsValue)) {
          console.error('[LOG] UCS calculation resulted in a non-finite number. Returning default.');
          return { ...defaultResult, isConfigured: true };
      }
  
      return { 
          indexValue: parseFloat(ucsValue.toFixed(4)), // Increased precision
          isConfigured: params.isConfigured,
          components: {
              vm: parseFloat(VMAD.toFixed(2)),
              vus: parseFloat(VUS.toFixed(2)),
              crs: parseFloat(CRS.toFixed(2)),
          },
          vusDetails: {
              pecuaria: parseFloat((renda_pecuaria_ha * params.PESO_PEC * params.FATOR_ARREND * params.area_total).toFixed(2)),
              milho: parseFloat((renda_milho_ha * params.PESO_MILHO * params.FATOR_ARREND * params.area_total).toFixed(2)),
              soja: parseFloat((renda_soja_ha * params.PESO_SOJA * params.FATOR_ARREND * params.area_total).toFixed(2)),
          }
      };
}


    