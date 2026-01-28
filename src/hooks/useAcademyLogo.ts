'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiClient } from '@/lib/api-client';

export function useAcademyLogo() {
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogo();
  }, [user]);

  const loadLogo = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (user.role === 'ACADEMY') {
        // Get academy logo
        const res = await apiClient('/academies');
        const result = await res.json();
        if (result.success && result.data.length > 0) {
          setLogoUrl(result.data[0].logoUrl || null);
        }
      } else if (user.role === 'TEACHER') {
        // Get teacher's academy logo
        const res = await apiClient('/teachers/me');
        const result = await res.json();
        if (result.success && result.data?.academy?.logoUrl) {
          setLogoUrl(result.data.academy.logoUrl);
        }
      } else if (user.role === 'STUDENT') {
        // Get first enrolled class's academy logo
        const res = await apiClient('/classes/enrolled');
        const result = await res.json();
        if (result.success && result.data.length > 0) {
          const firstClass = result.data[0];
          if (firstClass.academyLogoUrl) {
            setLogoUrl(firstClass.academyLogoUrl);
          }
        }
      }
    } catch (error) {
      console.error('Error loading academy logo:', error);
    } finally {
      setLoading(false);
    }
  };

  return { logoUrl, loading };
}
