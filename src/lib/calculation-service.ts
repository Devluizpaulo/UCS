

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
      const defaultResult: CalculateUcsIndexOutput = {
          ivp: 0,
          ucsCF: 0,
          ucsASE: 0,
          isConfigured: params.isConfigured,
          components: { vm: 0, vus: 0, crs: 0 }, 
          vusDetails: { pecuaria: 0, milho: 0, soja: 0 }
      };
      
      if (!params.isConfigured) {
          return defaultResult;
      }
      
      // --- 1. Price Lookups & Conversions (Camada de Conversão) ---
      
      const taxa_usd_brl = findPrice(commodities, 'exchange', 'dólar');
      const taxa_eur_brl = findPrice(commodities, 'exchange', 'euro');

      const preco_madeira_serrada_usd = findPrice(commodities, 'vmad', 'madeira');
      const preco_boi_arroba_brl = findPrice(commodities, 'vus', 'boi');
      const preco_milho_saca_brl = findPrice(commodities, 'vus', 'milho');
      const preco_soja_saca_usd = findPrice(commodities, 'vus', 'soja');
      const preco_carbono_eur = findPrice(commodities, 'crs', 'carbono');
      
      const preco_madeira_tora_brl = (preco_madeira_serrada_usd * params.FATOR_CONVERSAO_SERRADA_TORA) * taxa_usd_brl;
      const preco_milho_ton_brl = (preco_milho_saca_brl / 60) * 1000;
      const preco_soja_ton_brl = ((preco_soja_saca_usd * taxa_usd_brl) / 60) * 1000;
      const preco_carbono_brl = preco_carbono_eur * taxa_eur_brl;

      // --- 2. Rendas Brutas por Hectare (R$/ha) ---
      const renda_pecuaria_ha = params.produtividade_boi * preco_boi_arroba_brl;
      const renda_milho_ha = params.produtividade_milho * preco_milho_ton_brl;
      const renda_soja_ha = params.produtividade_soja * preco_soja_ton_brl;
      const renda_madeira_ha = params.produtividade_madeira * preco_madeira_tora_brl;
      const renda_carbono_ha = params.FATOR_CARBONO * preco_carbono_brl;

      // --- 3. Componentes do Índice ---
      const VMAD = renda_madeira_ha * params.area_total;

      const renda_bruta_ponderada_ha_vus = 
          (renda_pecuaria_ha * params.fator_pecuaria) + 
          (renda_milho_ha * params.fator_milho) + 
          (renda_soja_ha * params.fator_soja);
          
      const vus_por_ha = renda_bruta_ponderada_ha_vus * params.fator_arrendamento;
      const VUS = vus_por_ha * params.area_total;

      const base_calculo_agua_ha = renda_bruta_ponderada_ha_vus + renda_madeira_ha + renda_carbono_ha;
      const valor_carbono_total = renda_carbono_ha * params.area_total;
      const valor_agua_total = (base_calculo_agua_ha * params.fator_agua) * params.area_total;
      
      const CRS = valor_carbono_total + valor_agua_total;
      
      // --- 4. Finalização do Cálculo do Índice UCS ---
      const PDM = VMAD + VUS + CRS;
      const CE = params.produtividade_carbono * params.area_total;
      
      if (CE === 0) {
        console.error('[CalculationService] Carbono Estocado (CE) é zero. Divisão por zero ocorreria. Abortando cálculo.');
        return { ...defaultResult, isConfigured: true };
      }
      
      const ivp = PDM / CE;
      const ucsCF = ivp / 2; // O fator de multiplicação final é 0.5 (dividir por 2)
      const ucsASE = ucsCF * 2;
  
      if (!isFinite(ucsCF)) {
          console.error('[CalculationService] Cálculo do UCS resultou em um número não finito. Retornando valor padrão.');
          return { ...defaultResult, isConfigured: true };
      }
  
      const vus_pecuaria_detalhe = renda_bruta_ponderada_ha_vus > 0 ? (renda_pecuaria_ha * params.fator_pecuaria / renda_bruta_ponderada_ha_vus) * VUS : 0;
      const vus_milho_detalhe = renda_bruta_ponderada_ha_vus > 0 ? (renda_milho_ha * params.fator_milho / renda_bruta_ponderada_ha_vus) * VUS : 0;
      const vus_soja_detalhe = renda_bruta_ponderada_ha_vus > 0 ? (renda_soja_ha * params.fator_soja / renda_bruta_ponderada_ha_vus) * VUS : 0;

      return { 
          ivp: parseFloat(ivp.toFixed(4)),
          ucsCF: parseFloat(ucsCF.toFixed(4)),
          ucsASE: parseFloat(ucsASE.toFixed(4)),
          isConfigured: params.isConfigured,
          components: {
              vm: parseFloat(VMAD.toFixed(2)),
              vus: parseFloat(VUS.toFixed(2)),
              crs: parseFloat(CRS.toFixed(2)),
          },
          vusDetails: {
              pecuaria: isFinite(vus_pecuaria_detalhe) ? parseFloat(vus_pecuaria_detalhe.toFixed(2)) : 0,
              milho: isFinite(vus_milho_detalhe) ? parseFloat(vus_milho_detalhe.toFixed(2)) : 0,
              soja: isFinite(vus_soja_detalhe) ? parseFloat(vus_soja_detalhe.toFixed(2)) : 0,
          }
      };
}
    

    