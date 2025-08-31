'use client';

import { useState, useEffect, useRef } from 'react';

// Easing function for smoother animation
function easeOutCubic(t: number): number {
  return (--t) * t * t + 1;
}

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatter?: (value: number) => string;
  className?: string;
}

export function AnimatedNumber({ 
  value, 
  duration = 800, 
  formatter = (v) => v.toFixed(4),
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const frameRef = useRef<number>();

  useEffect(() => {
    const startValue = prevValueRef.current;
    // If startValue is 0 (initial load), start from a slightly lower number to have an animation effect.
    const effectiveStartValue = startValue === 0 && value !== 0 ? value * 0.9 : startValue;

    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsedTime = now - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentValue = effectiveStartValue + (endValue - effectiveStartValue) * easedProgress;
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure the final value is exactly what's expected
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    // Cancel any previous animation frame
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    
    // Start the new animation
    frameRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration]);

  return <span className={className}>{formatter(displayValue)}</span>;
}
