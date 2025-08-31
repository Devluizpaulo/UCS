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
    timeUnit: 'day' | 'minute' | 'week' | 'month' = 'day'
): ChartData[] => {
    const data: ChartData[] = [];
    const now = new Date();
    let currentValue = finalValue;

    // We generate data backwards from the final value
    for (let i = 0; i < points; i++) {
        let date: Date;
        let timeLabel: string;

        switch (timeUnit) {
            case 'day':
                date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                timeLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                break;
            case 'week':
                date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
                 timeLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                break;
            case 'month':
                 date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                 timeLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                break;
            case 'minute':
                date = new Date(now.getTime() - i * 60 * 1000);
                 timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                break;
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
