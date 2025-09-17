

/**
 * @fileOverview A pure, synchronous service for performing UCS Index calculations.
 * This file should NOT be marked with 'use server' as it contains only calculation logic
 * and is designed to be imported by server-side modules without causing build conflicts.
 * This version is refactored to perfectly match the logic from the user-provided detailed breakdown.
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
        // Log a warning if a price is not found, which helps in debugging.
        // console.warn(`[CalculationService] Price not found for category '${category}' ${nameIncludes ? `with name including '${nameIncludes}'` : ''}. Defaulting to 0.`);
        return 0;
    }
    return asset.price;
}

/**
 * Pure calculation function for the UCS Index, precisely following the user's spreadsheet logic.
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
      
      // --- Price Lookups & Conversions ---
      const taxa_usd_brl = findPrice(commodities, 'exchange', 'dólar');
      const taxa_eur_brl = findPrice(commodities, 'exchange', 'euro');

      const preco_madeira_serrada_usd = findPrice(commodities, 'vmad');
      const preco_boi_arroba_brl = findPrice(commodities, 'vus', 'boi');
      const preco_milho_saca_brl = findPrice(commodities, 'vus', 'milho');
      const preco_soja_saca_usd = findPrice(commodities, 'vus', 'soja');
      const preco_carbono_eur = findPrice(commodities, 'crs');
      
      // Conversões de Preço
      const preco_madeira_tora_usd = preco_madeira_serrada_usd * params.FATOR_CONVERSAO_SERRADA_TORA;
      const preco_madeira_tora_brl = preco_madeira_tora_usd * taxa_usd_brl;

      const preco_milho_ton_brl = (preco_milho_saca_brl / 60) * 1000;
      const preco_soja_saca_brl = preco_soja_saca_usd * taxa_usd_brl;
      const preco_soja_ton_brl = (preco_soja_saca_brl / 60) * 1000;
      const preco_carbono_brl = preco_carbono_eur * taxa_eur_brl;

      // --- Rentabilidade por Hectare (R$/ha) ---
      const renda_pecuaria_ha = params.produtividade_boi * preco_boi_arroba_brl;
      const renda_milho_ha = params.produtividade_milho * preco_milho_ton_brl;
      const renda_soja_ha = params.produtividade_soja * preco_soja_ton_brl;
      const renda_madeira_ha = params.produtividade_madeira * preco_madeira_tora_brl;
      const renda_carbono_ha = params.FATOR_CARBONO * preco_carbono_brl; // FATOR_CARBONO is 2.59

      // --- 1. VMAD (Valor da Madeira) ---
      const VMAD = renda_madeira_ha * params.area_total;

      // --- 2. VUS (Valor de Uso do Solo) ---
      const renda_bruta_ponderada_ha_vus = 
          (renda_pecuaria_ha * params.fator_pecuaria) + 
          (renda_milho_ha * params.fator_milho) + 
          (renda_soja_ha * params.fator_soja);
      const vus_por_ha = renda_bruta_ponderada_ha_vus * params.fator_arrendamento;
      const VUS = vus_por_ha * params.area_total;

      // --- 3. CRS (Custo da Responsabilidade Socioambiental) ---
      // 3.a Crédito de Carbono (CC)
      const valor_carbono_total = renda_carbono_ha * params.area_total;
      
      // 3.b Custo da Água (cH2O)
      const base_calculo_agua_ha = 
          (renda_pecuaria_ha * params.fator_pecuaria) + 
          (renda_milho_ha * params.fator_milho) + 
          (renda_soja_ha * params.fator_soja) + 
          renda_madeira_ha + 
          renda_carbono_ha;
          
      const valor_agua_total = (base_calculo_agua_ha * params.fator_agua) * params.area_total;
      
      const CRS = valor_carbono_total + valor_agua_total;
      
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
  
      // Detalhamento do VUS para o modal (proporcional ao VUS total)
      const vus_pecuaria = renda_bruta_ponderada_ha_vus > 0 ? (renda_pecuaria_ha * params.fator_pecuaria / renda_bruta_ponderada_ha_vus) * VUS : 0;
      const vus_milho = renda_bruta_ponderada_ha_vus > 0 ? (renda_milho_ha * params.fator_milho / renda_bruta_ponderada_ha_vus) * VUS : 0;
      const vus_soja = renda_bruta_ponderada_ha_vus > 0 ? (renda_soja_ha * params.fator_soja / renda_bruta_ponderada_ha_vus) * VUS : 0;

      return { 
          indexValue: parseFloat(ucsValue.toFixed(4)),
          isConfigured: params.isConfigured,
          components: {
              vm: parseFloat(VMAD.toFixed(2)),
              vus: parseFloat(VUS.toFixed(2)),
              crs: parseFloat(CRS.toFixed(2)),
          },
          vusDetails: {
              pecuaria: isFinite(vus_pecuaria) ? parseFloat(vus_pecuaria.toFixed(2)) : 0,
              milho: isFinite(vus_milho) ? parseFloat(vus_milho.toFixed(2)) : 0,
              soja: isFinite(vus_soja) ? parseFloat(vus_soja.toFixed(2)) : 0,
          }
      };
}
    