import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ChartData } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Generates a more realistic-looking historical data series for charts.
 * Instead of pure random noise, it simulates a smoother, trend-following path.
 * @param finalValue The last value in the series, which should be the current, real value.
 * @param points The number of data points to generate.
 * @param volatility A factor to control the magnitude of price swings (e.g., 0.1 for 10%).
 * @param timeUnit The unit for the time labels ('day' or 'minute').
 * @returns An array of ChartData objects.
 */
export const generateRealisticHistoricalData = (
    finalValue: number,
    points: number = 30,
    volatility: number = 0.05,
    timeUnit: 'day' | 'minute' = 'day'
): ChartData[] => {
    const data: ChartData[] = [];
    const now = new Date();
    let currentValue = finalValue;

    // We generate data backwards from the final value
    for (let i = 0; i < points; i++) {
        const date = new Date(now.getTime() - i * (timeUnit === 'day' ? 24 * 60 : 1) * 60 * 1000);
        let timeLabel: string;

        if (timeUnit === 'day') {
            timeLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        } else {
            timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
        
        data.push({
            time: timeLabel,
            value: currentValue,
        });

        // For the next point (going back in time), we make a "reverse" jump.
        // This creates a path that leads *to* the finalValue.
        const changePercent = (Math.random() - 0.5) * 2 * volatility;
        currentValue = currentValue / (1 + changePercent);
    }
    
    // Reverse the array to have the chronological order
    return data.reverse();
};
