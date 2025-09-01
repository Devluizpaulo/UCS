
'use server';

import { getCommodityConfig } from './commodity-config-service';

// Helper functions
export async function getCommodityByTicker(ticker: string) {
  const { commodityMap } = await getCommodityConfig();
  const entry = Object.entries(commodityMap).find(
    ([_, config]) => config.ticker === ticker
  );
  return entry ? { name: entry[0], ...entry[1] } : undefined;
}

export async function getCommoditiesByCategory(category: string) {
  const { commodityMap } = await getCommodityConfig();
  return Object.entries(commodityMap).filter(
    ([_, config]) => config.category === category
  ).map(([name, config]) => ({ name, ...config }));
}

export async function getAllTickers(): Promise<string[]> {
  const { commodityMap } = await getCommodityConfig();
  return Object.values(commodityMap).map(config => config.ticker);
}

export async function getConversionTickers(): Promise<string[]> {
  const { commodityMap } = await getCommodit