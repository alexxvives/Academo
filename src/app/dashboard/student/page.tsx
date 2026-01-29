'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderPinwheelIcon } from '@/components/ui/LoaderPinwheelIcon';

export default function StudentDashboardRedirect() {
  const router = useRouter();
  const loaderRef = useRef<any>(null);

  useEffect(() => {
    loaderRef.current?.startAnimation();
    router.replace('/dashboard/student/classes');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoaderPinwheelIcon ref={loaderRef} size={32} className="text-black" />
    </div>
  );
}
