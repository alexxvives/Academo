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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Confirmar Pago en Efectivo</h3>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-gray-700">
                Estás a punto de registrar un pago en efectivo por:
              </p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(price, currency)}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                Tu solicitud quedará pendiente hasta que la academia confirme haber recibido el pago. No tendrás acceso a la clase hasta la aprobación.
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => setConfirmingCash(false)}
              disabled={processing}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmCash}
              disabled={processing}
              className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Procesando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Seleccionar Método de Pago</h2>
              <p className="text-sm text-gray-600 mt-1">
                {className}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Price Display */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-600">Total a pagar</span>
            <span className="text-2xl font-bold text-gray-900">{formatPrice(price, currency)}</span>
          </div>
        </div>

        {/* Payment Options */}
        <div className="p-6 space-y-3">
          {/* Cash Payment */}
          <button
            onClick={() => {
              setSelectedMethod('cash');
              handleCashPayment();
            }}
            className="w-full p-4 border border-gray-300 rounded-lg text-left transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Efectivo</h3>
                <p className="text-sm text-gray-600">
                  Paga directamente a la academia
                </p>
                <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Requiere aprobación manual
                </span>
              </div>
            </div>
          </button>

          {/* Bank Transfer (Stripe) */}
          <button
            onClick={() => {
              setSelectedMethod('stripe');
              handleStripePayment();
            }}
            className="w-full p-4 border border-gray-300 rounded-lg text-left transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Transferencia Bancaria</h3>
                <p className="text-sm text-gray-600">
                  Pago seguro con tarjeta o cuenta bancaria
                </p>
                <span className="inline-block mt-2 text-xs text-white bg-gray-900 px-2 py-1 rounded">
                  Acceso inmediato
                </span>
              </div>
            </div>
          </button>

          {/* Bizum */}
          <button
            onClick={() => {
              setSelectedMethod('bizum');
              handleBizumPayment();
            }}
            className="w-full p-4 border border-gray-300 rounded-lg text-left transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Bizum</h3>
                <p className="text-sm text-gray-600">
                  Pago instantáneo con tu banco español
                </p>
                <span className="inline-block mt-2 text-xs text-white bg-gray-900 px-2 py-1 rounded">
                  Acceso inmediato
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
