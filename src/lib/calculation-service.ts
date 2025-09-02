
/**
 * @fileOverview A pure, synchronous service for performing UCS Index calculations.
 * This file should NOT be marked with 'use server' as it contains only calculation logic
 * and is designed to be imported by server-side modules without causing build conflicts.
 */

import type { FormulaParameters, CalculateUcsIndexOutput } from './types';


/**
 * Pure calculation function for the UCS Index. This is not a flow and can be called from anywhere.
 * @param prices - A dictionary of asset names to their latest prices.
 * @param params - The formula parameters.
 * @returns {CalculateUcsIndexOutput} The calculated index data.
 */
export function calculateIndex(prices: { [key: string]: number }, params: FormulaParameters): CalculateUcsIndexOutput {
      const defaultResult = { 
          indexValue: 0, 
          isConfigured: params.isConfigured,
          components: { vm: 0, vus: 0, crs: 0 }, 
          vusDetails: { pecuaria: 0, milho: 0, soja: 0 }
      };
      
      if (!params.isConfigured) {
          return defaultResult;
      }
  
      // --- Data Validation ---
      const requiredAssets = [
          'USD/BRL Histórico', 'EUR/BRL Histórico', 'Madeira Futuros',
          'Boi Gordo Futuros - Ago 25 (BGIc1)', 'Milho Futuros', 'Soja Futuros', 'Carbono Futuros'
      ];
      for (const asset of requiredAssets) {
          if (prices[asset] === undefined || prices[asset] === null || prices[asset] === 0) {
              console.error(`[LOG] Missing or zero price for required asset in calculation: ${asset}.`);
              return { ...defaultResult, isConfigured: true }; // Return default but indicate it was configured
          }
      }
  
      // Exchange Rates
      const taxa_usd_brl = prices['USD/BRL Histórico'];
      const taxa_eur_brl = prices['EUR/BRL Histórico'];
  
      // Prices (raw)
      const preco_lumber_mbf = prices['Madeira Futuros'];
      const preco_boi_arroba = prices['Boi Gordo Futuros - Ago 25 (BGIc1)'];
      const preco_milho_bushel_cents = prices['Milho Futuros'];
      const preco_soja_bushel_cents = prices['Soja Futuros'];
      const preco_carbono_eur = prices['Carbono Futuros'];
  
      // --- Price Conversions ---
      const preco_madeira_serrada_m3_usd = (preco_lumber_mbf / 1000) * 424;
      const preco_madeira_serrada_m3_brl = preco_madeira_serrada_m3_usd * taxa_usd_brl;
      const preco_madeira_tora_m3_brl = preco_madeira_serrada_m3_brl * params.FATOR_CONVERSAO_SERRADA_TORA;
      const preco_milho_ton_usd = (preco_milho_bushel_cents / 100) * (1000 / 25.4);
      const preco_milho_ton_brl = preco_milho_ton_usd * taxa_usd_brl;
      const preco_soja_ton_usd = (preco_soja_bushel_cents / 100) * (1000 / 27.2);
      const preco_soja_ton_brl = preco_soja_ton_usd * taxa_usd_brl;
      const preco_carbono_brl = preco_carbono_eur * taxa_eur_brl;
      
      // --- Formula Calculation ---
      const VM = preco_madeira_tora_m3_brl * params.VOLUME_MADEIRA_HA;
      const renda_pecuaria = params.PROD_BOI * preco_boi_arroba * params.PESO_PEC;
      const renda_milho = params.PROD_MILHO * preco_milho_ton_brl * params.PESO_MILHO;
      const renda_soja = params.PROD_SOJA * preco_soja_ton_brl * params.PESO_SOJA;
      const renda_bruta_ha = renda_pecuaria + renda_milho + renda_soja;
      const VUS = renda_bruta_ha / params.FATOR_ARREND;
      const valor_carbono = preco_carbono_brl * params.VOLUME_MADEIRA_HA * params.FATOR_CARBONO;
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
