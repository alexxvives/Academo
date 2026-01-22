'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface ZoomAccount {
  id: string;
  accountName: string;
  accountId: string;
  createdAt: string;
}

interface Academy {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  address?: string;
  phone?: string;
  email?: string;
  feedbackAnonymous?: number;
  defaultWatermarkIntervalMins?: number;
  defaultMaxWatchTimeMultiplier?: number;
}

export default function ProfilePage() {
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [zoomAccounts, setZoomAccounts] = useState<ZoomAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    feedbackAnonymous: false,
    defaultWatermarkIntervalMins: 5,
    defaultMaxWatchTimeMultiplier: 2.0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [academyRes, zoomRes] = await Promise.all([
        apiClient('/academies'),
        apiClient('/zoom-accounts')
      ]);

      const academyResult = await academyRes.json();
      const zoomResult = await zoomRes.json();

      if (academyResult.success && academyResult.data.length > 0) {
        const academyData = academyResult.data[0];
        setAcademy(academyData);
        setFormData({
          name: academyData.name || '',
          address: academyData.address || '',
          phone: academyData.phone || '',
          email: academyData.email || '',
          feedbackAnonymous: academyData.feedbackAnonymous === 1,
          defaultWatermarkIntervalMins: academyData.defaultWatermarkIntervalMins || 5,
          defaultMaxWatchTimeMultiplier: academyData.defaultMaxWatchTimeMultiplier || 2.0
        });
      }

      if (zoomResult.success) {
        setZoomAccounts(zoomResult.data || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectZoom = () => {
    // Redirect to Zoom OAuth
    const clientId = process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID || 'sHMNFyqHQCGV5TpqkPo2Uw';
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/zoom/oauth/callback`);
    const state = academy?.id || '';
    
    window.location.href = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
  };

  const handleDisconnectZoom = async (accountId: string) => {
    if (!confirm('¿Estás seguro de que deseas desconectar esta cuenta de Zoom?')) {
      return;
    }

    try {
      const response = await apiClient(`/zoom-accounts/${accountId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setZoomAccounts(zoomAccounts.filter(acc => acc.id !== accountId));
      }
    } catch (error) {
      console.error('Error disconnecting Zoom:', error);
      alert('Error al desconectar la cuenta de Zoom');
    }
  };

  const handleSaveProfile = async () => {
    if (!academy) return;

    try {
      const response = await apiClient(`/academies/${academy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          feedbackAnonymous: formData.feedbackAnonymous ? 1 : 0,
          defaultWatermarkIntervalMins: formData.defaultWatermarkIntervalMins,
          defaultMaxWatchTimeMultiplier: formData.defaultMaxWatchTimeMultiplier
        })
      });

      const result = await response.json();
      if (result.success) {
        setEditing(false);
        loadData();
      } else {
        alert('Error al guardar los cambios');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error al guardar los cambios');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl text-gray-900">Perfil de Academia</h1>
        <p className="text-sm text-gray-600 mt-1">Gestiona la información de tu academia y cuentas conectadas</p>
      </div>

      {/* Academy Info */}
      {academy && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Información de la Academia</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: academy.name || '',
                      address: academy.address || '',
                      phone: academy.phone || '',
                      email: academy.email || '',
                      feedbackAnonymous: academy.feedbackAnonymous === 1,
                      defaultWatermarkIntervalMins: academy.defaultWatermarkIntervalMins || 5,
                      defaultMaxWatchTimeMultiplier: academy.defaultMaxWatchTimeMultiplier || 2.0
                    });
                  }}
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  Guardar
                </button>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nombre</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              ) : (
                <p className="text-gray-900 mt-1">{academy.name}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Dirección (para pagos en efectivo)</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Dirección física de la academia"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              ) : (
                <p className="text-gray-900 mt-1">{academy.address || 'No especificada'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email de contacto</label>
              {editing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@academia.com"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              ) : (
                <p className="text-gray-900 mt-1">{academy.email || 'No especificado'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Teléfono de contacto</label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+34 123 456 789"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              ) : (
                <p className="text-gray-900 mt-1">{academy.phone || 'No especificado'}</p>
              )}
            </div>
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Configuración de Feedback</h3>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Feedback anónimo</label>
                  <p className="text-xs text-gray-500 mt-1">Los estudiantes pueden dar feedback sin revelar su identidad</p>
                </div>
                {editing ? (
                  <button
                    onClick={() => setFormData({ ...formData, feedbackAnonymous: !formData.feedbackAnonymous })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.feedbackAnonymous ? 'bg-brand-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.feedbackAnonymous ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                ) : (
                  <span className={`text-sm font-medium ${
                    academy.feedbackAnonymous ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {academy.feedbackAnonymous ? 'Activado' : 'Desactivado'}
                  </span>
                )}
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Configuración de Vídeos (por defecto)</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Multiplicador de tiempo de visualización</label>
                  <p className="text-xs text-gray-500 mt-1">Cuántas veces puede ver un estudiante el vídeo</p>
                  {editing ? (
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="10"
                      value={formData.defaultMaxWatchTimeMultiplier}
                      onChange={(e) => setFormData({ ...formData, defaultMaxWatchTimeMultiplier: parseFloat(e.target.value) })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{academy.defaultMaxWatchTimeMultiplier || 2.0}x</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Intervalo de marca de agua (minutos)</label>
                  <p className="text-xs text-gray-500 mt-1">Cada cuántos minutos aparece la marca de agua con el nombre del estudiante</p>
                  {editing ? (
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={formData.defaultWatermarkIntervalMins}
                      onChange={(e) => setFormData({ ...formData, defaultWatermarkIntervalMins: parseInt(e.target.value) })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{academy.defaultWatermarkIntervalMins || 5} minutos</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Accounts */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cuentas de Zoom</h2>
            <p className="text-sm text-gray-600 mt-1">Conecta tus cuentas PRO de Zoom para crear clases en vivo</p>
          </div>
          <button
            onClick={handleConnectZoom}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            + Conectar Zoom
          </button>
        </div>

        {zoomAccounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No hay cuentas de Zoom conectadas</p>
            <p className="text-xs text-gray-400 mt-1">Conecta una cuenta PRO de Zoom para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {zoomAccounts.map(account => (
              <div key={account.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M1.98 8.223A1.98 1.98 0 000 10.202v3.597a1.98 1.98 0 001.98 1.98h2.475a6.93 6.93 0 012.828-5.557H1.98zM5.055 6.91a6.93 6.93 0 012.829-5.556H1.98A1.98 1.98 0 000 3.333v3.598c0 .67.334 1.296.889 1.667L5.055 6.91zm3.48 3.094l6.193-3.556a.495.495 0 01.742.427v7.252a.495.495 0 01-.743.427l-6.192-3.557a.495.495 0 010-.855l-.001-.138zM18.054 5.91a6.93 6.93 0 012.829 5.556l4.166 1.689A1.98 1.98 0 0026 11.488V7.89a1.98 1.98 0 00-1.98-1.98h-5.966zm5.965 9.867h-5.966a6.93 6.93 0 01-2.829 5.556l4.166 1.69A1.98 1.98 0 0026 21.155v-3.598a1.98 1.98 0 00-.98-1.78z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{account.accountName}</p>
                    <p className="text-xs text-gray-500">ID: {account.accountId}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnectZoom(account.id)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Desconectar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
