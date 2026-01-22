'use client';

import { useState } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  price: number;
  currency: string;
  onPaymentComplete: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  classId,
  className,
  price,
  currency,
  onPaymentComplete,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'stripe' | 'bizum' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [confirmingCash, setConfirmingCash] = useState(false);

  if (!isOpen) return null;

  const handleCashPayment = () => {
    setConfirmingCash(true);
  };

  const handleConfirmCash = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          classId, 
          paymentMethod: 'cash' 
        }),
      });

      const result = await res.json();
      if (result.success) {
        alert('Pago en efectivo registrado. Esperando aprobación de la academia.');
        onPaymentComplete();
      } else {
        throw new Error(result.error || 'Error al registrar pago');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setProcessing(false);
      setConfirmingCash(false);
    }
  };

  const handleStripePayment = async () => {
    setProcessing(true);
    try {
      // TODO: Implement Stripe Connect integration
      alert('Stripe Connect aún no está configurado. Por favor, paga en efectivo.');
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleBizumPayment = async () => {
    setProcessing(true);
    try {
      // Bizum is available through Stripe in Spain
      alert('Bizum aún no está configurado. Por favor, paga en efectivo.');
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (amount: number, curr: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: curr || 'EUR',
    }).format(amount);
  };

  // Cash confirmation dialog
  if (confirmingCash) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-6">
        <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirmar Pago en Efectivo</h3>
            <p className="text-gray-600">
              Estás a punto de registrar un pago en efectivo por <strong className="text-gray-900">{formatPrice(price, currency)}</strong>
            </p>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> Tu solicitud quedará pendiente hasta que la academia confirme haber recibido el pago. No tendrás acceso a la clase hasta la aprobación.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setConfirmingCash(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmCash}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-xl font-semibold hover:from-yellow-700 hover:to-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Procesando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-6">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Método de Pago</h2>
              <p className="text-gray-600 mt-1">
                <span className="font-medium text-brand-600">{className}</span> — {formatPrice(price, currency)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Payment Options */}
        <div className="p-8">
          <div className="space-y-4">
            {/* Cash Payment */}
            <button
              onClick={() => {
                setSelectedMethod('cash');
                handleCashPayment();
              }}
              className={`w-full p-6 border-2 rounded-2xl text-left transition-all hover:border-yellow-400 hover:shadow-lg ${
                selectedMethod === 'cash' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Pago en Efectivo</h3>
                  <p className="text-sm text-gray-600">
                    Paga directamente a la academia. Tu solicitud quedará pendiente de aprobación.
                  </p>
                  <div className="mt-2 inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                    Requiere aprobación manual
                  </div>
                </div>
              </div>
            </button>

            {/* Stripe Payment */}
            <button
              onClick={() => {
                setSelectedMethod('stripe');
                handleStripePayment();
              }}
              disabled
              className="w-full p-6 border-2 border-gray-200 rounded-2xl text-left transition-all opacity-50 cursor-not-allowed"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Tarjeta de Crédito/Débito</h3>
                  <p className="text-sm text-gray-600">
                    Pago seguro con Stripe. Acceso inmediato tras confirmar pago.
                  </p>
                  <div className="mt-2 inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    Próximamente
                  </div>
                </div>
              </div>
            </button>

            {/* Bizum Payment */}
            <button
              onClick={() => {
                setSelectedMethod('bizum');
                handleBizumPayment();
              }}
              disabled
              className="w-full p-6 border-2 border-gray-200 rounded-2xl text-left transition-all opacity-50 cursor-not-allowed"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Bizum</h3>
                  <p className="text-sm text-gray-600">
                    Pago instantáneo con tu banco español. Acceso inmediato.
                  </p>
                  <div className="mt-2 inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    Próximamente
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <strong className="font-semibold">Nota importante:</strong> Después de completar el pago, también deberás firmar el documento de consentimiento para acceder a la clase.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
