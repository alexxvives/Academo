'use client';

import { LoaderPinwheelIcon } from './LoaderPinwheelIcon';
import { useEffect, useRef } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
};

export function LoadingSpinner({ size = 'md', className = '', label }: LoadingSpinnerProps) {
  const loaderRef = useRef<any>(null);

  useEffect(() => {
    loaderRef.current?.startAnimation();
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <LoaderPinwheelIcon ref={loaderRef} size={sizeMap[size]} className="text-black" />
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  );
}

export default LoadingSpinner;
