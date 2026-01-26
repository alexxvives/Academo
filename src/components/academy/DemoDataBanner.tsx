'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export function DemoDataBanner() {
  const [academyId, setAcademyId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    // Get academy ID and user email
    const fetchData = async () => {
      try {
        const [academyRes, userRes] = await Promise.all([
          apiClient('/academies'),
          apiClient('/auth/me')
        ]);
        
        const academyResult = await academyRes.json();
        const userResult = await userRes.json();
        
        if (academyResult.success && academyResult.data?.[0]?.id) {
          setAcademyId(academyResult.data[0].id);
        }
        
        if (userResult.success && userResult.data?.email) {
          setUserEmail(userResult.data.email);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleActivateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const message = `⚠️ IMPORTANTE: Para activar tu academia, debes usar el correo registrado en Stripe:\n\n📧 ${userEmail}\n\n✅ Usa EXACTAMENTE este correo en el formulario de pago de Stripe.\n\n¿Continuar al pago?`;
    
    if (confirm(message)) {
      window.location.href = 'https://buy.stripe.com/test_aFa14m20ndS212ReGr77O01';
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-red-600 to-red-700 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">
                Modo de Demostración Activo
              </p>
              <p className="text-red-100 text-xs">
                Los datos mostrados son ejemplos ilustrativos. Active su academia para acceder a funcionalidad completa.
              </p>
            </div>
          </div>
          <button
            onClick={handleActivateClick}
            className="flex-shrink-0 px-5 py-2 bg-white text-red-700 font-semibold rounded-md hover:bg-red-50 transition-colors shadow-sm text-sm whitespace-nowrap"
          >
            Activar Academia
          </button>
        </div>
      </div>
    </div>
  );
}
