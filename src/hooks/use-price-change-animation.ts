
'use client';

import { useState, useEffect, useRef } from 'react';
import type { CommodityPriceData } from '@/lib/types';

type AnimationClasses = {
  [assetId: string]: 'animate-flash-green' | 'animate-flash-red' | '';
};

/**
 * Custom hook to detect price changes in commodity data and apply a temporary animation class.
 * @param data The array of commodity price data.
 * @returns A dictionary mapping asset IDs to their corresponding animation class.
 */
export function usePriceChangeAnimation(data: CommodityPriceData[]): AnimationClasses {
  const [animationClasses, setAnimationClasses] = useState<AnimationClasses>({});
  const prevDataRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const newAnimationClasses: AnimationClasses = {};
    
    // Create a map of the current prices for easy lookup
    const currentDataMap = new Map(data.map(item => [item.id, item.price]));

    // Iterate over current data to compare with previous data
    for (const item of data) {
      const prevPrice = prevDataRef.current.get(item.id);
      
      if (prevPrice !== undefined && item.price !== prevPrice) {
        newAnimationClasses[item.id] = item.price > prevPrice ? 'animate-flash-green' : 'animate-flash-red';
      } else {
        newAnimationClasses[item.id] = '';
      }
    }

    setAnimationClasses(newAnimationClasses);

    // Update the ref with the latest prices for the next render
    prevDataRef.current = currentDataMap;

    // Set a timeout to clear the animation classes after the animation finishes
    const timer = setTimeout(() => {
      setAnimationClasses({});
    }, 1500); // The animation duration is 1.5s

    return () => clearTimeout(timer);
    
  // We only want to run this effect when the `data` itself changes.
  // Using a deep comparison of the data array would be expensive.
  // A simple stringified version provides a reasonable dependency check.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);

  return animationClasses;
}
