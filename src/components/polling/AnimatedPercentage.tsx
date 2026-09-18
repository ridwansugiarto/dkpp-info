'use client';

import React, { useEffect, useState } from 'react';

interface AnimatedPercentageProps {
  value: number;
  duration?: number;
}

export const AnimatedPercentage: React.FC<AnimatedPercentageProps> = ({ value, duration = 800 }) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const targetValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      const current = startValue + (targetValue - startValue) * easeProgress;
      setDisplayValue(Math.round(current * 10) / 10);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{displayValue.toFixed(1)}%</span>;
};
