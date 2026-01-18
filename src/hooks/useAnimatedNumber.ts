import { useState, useEffect } from 'react';

/**
 * Hook to animate a number from 0 to target value
 * @param target - The target number to animate to
 * @param duration - Animation duration in milliseconds (default: 1000)
 * @returns The current animated value
 */
export function useAnimatedNumber(target: number, duration: number = 1000): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic ease-out for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const newValue = Math.round(startValue + (target - startValue) * easeOut);
      
      setCurrent(newValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [target, duration]);

  return current;
}
