'use client';

import { LoaderPinwheelIcon } from './LoaderPinwheelIcon';
import { useEffect, useRef } from 'react';

/**
 * Shared loading state for all dashboard routes
 * Uses animated pinwheel loader for consistent UX
 */
export default function SharedLoading() {
  const loaderRef = useRef<any>(null);

  useEffect(() => {
    // Auto-start animation when component mounts
    loaderRef.current?.startAnimation();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <LoaderPinwheelIcon ref={loaderRef} size={64} className="text-brand-600 mx-auto" />
        <p className="text-gray-500 text-sm">Cargando...</p>
      </div>
    </div>
  );
}
