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
 * It handles arrays of different lengths by using the overlapping data points.
 * @param returns1 - An array of returns for the first asset.
 * @param returns2 - An array of returns for the second asset.
 * @returns The correlation coefficient (between -1 and 1).
 */
export function calculate_correlation(returns1: number[], returns2: number[]): number {
    const minLength = Math.min(returns1.length, returns2.length);
    if (minLength < 2) {
        return 0;
    }
    
    // Use the most recent 'minLength' data points from both arrays
    const slicedReturns1 = returns1.slice(-minLength);
    const slicedReturns2 = returns2.slice(-minLength);
    
    const correlation = sampleCorrelation(slicedReturns1, slicedReturns2);
    return correlation;
}
