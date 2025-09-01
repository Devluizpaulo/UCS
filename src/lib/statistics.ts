'use server';

import { standardDeviation, sampleCorrelation } from 'simple-statistics';

/**
 * Calculates the annualized volatility of a series of returns.
 * @param returns - An array of daily percentage returns (e.g., 0.01 for 1%).
 * @returns The annualized volatility.
 */
export function calculate_volatility(returns: number[]): number {
    if (returns.length < 2) {
        return 0;
    }
    // Simple-statistics calculates sample standard deviation, which is what we want.
    const dailyVolatility = standardDeviation(returns);
    // Annualize the volatility (assuming 252 trading days in a year)
    const annualizedVolatility = dailyVolatility * Math.sqrt(252) * 100;
    return annualizedVolatility;
}

/**
 * Calculates the Pearson correlation coefficient between two series of returns.
 * @param returns1 - An array of returns for the first asset.
 * @param returns2 - An array of returns for the second asset.
 * @returns The correlation coefficient (between -1 and 1).
 */
export function calculate_correlation(returns1: number[], returns2: number[]): number {
    if (returns1.length < 2 || returns1.length !== returns2.length) {
        return 0;
    }
    const correlation = sampleCorrelation(returns1, returns2);
    return correlation;
}
