
'use client';

import { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  formatter?: (value: number) => string;
}

export function AnimatedNumber({ value, formatter = (v) => v.toString() }: AnimatedNumberProps) {
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    // Basic animation can be improved, but for now, it just updates.
    // A more complex implementation would use requestAnimationFrame and easing functions.
    const timeout = setTimeout(() => {
      setCurrentValue(value);
    }, 150); // Small delay to trigger transition if any

    return () => clearTimeout(timeout);
  }, [value]);

  return <span>{formatter(currentValue)}</span>;
}
