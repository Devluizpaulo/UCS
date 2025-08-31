'use server';

import { COMMODITY_TICKER_MAP } from './yahoo-finance-config-data';

// Helper functions
export async function getCommodityByTicker(ticker: string) {
  return Object.entries(COMMODITY_TICKER_MAP).find(
    ([_, config]) => config.ticker === ticker
  )?.[1];
}

export async function getCommoditiesByCategory(category: string) {
  return Object.entries(COMMODITY_TICKER_MAP).filter(
    ([_, config]) => config.category === category
  );
}

export async function getAllTickers(): Promise<string[]> {
  return Object.values(COMMODITY_TICKER_MAP).map(config => config.ticker);
}

export async function getConversionTickers(): Promise<string[]> {
  return ['BRL=X', 'EURBRL=X'];
}
