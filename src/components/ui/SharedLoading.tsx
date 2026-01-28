'use client';

import SpinningLogo from './SpinningLogo';

/**
 * Shared loading state for all dashboard routes
 * Uses spinning AKADEMO logo for consistent UX
 */
export default function SharedLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <SpinningLogo size={64} />
        <p className="text-gray-500 text-sm">Cargando...</p>
      </div>
    </div>
  );
}
