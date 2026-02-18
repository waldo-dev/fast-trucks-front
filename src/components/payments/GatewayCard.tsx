'use client';

import React, { useState } from 'react';

interface Gateway {
  id: string;
  name: string;
  type: 'online' | 'manual';
  status: 'active' | 'inactive';
  icon: string;
  description: string;
  requiresConfig: boolean;
  config?: {
    merchantId?: string;
    publicKey?: string;
    secretKey?: string;
    environment?: 'test' | 'prod';
  };
}

interface GatewayCardProps {
  gateway: Gateway;
  onToggle: (id: string) => void;
  onSave: (id: string, config: Gateway['config']) => void;
  onTestConnection: (id: string) => void;
}

export const GatewayCard: React.FC<GatewayCardProps> = ({
  gateway,
  onToggle,
  onSave,
  onTestConnection,
}) => {
  const [isExpanded, setIsExpanded] = useState(gateway.status === 'active' && gateway.requiresConfig);
  const [config, setConfig] = useState(gateway.config || {});
  const [showSecretKey, setShowSecretKey] = useState(false);

  const handleSave = () => {
    onSave(gateway.id, config);
  };

  const handleToggle = () => {
    onToggle(gateway.id);
  };

  const getTypeLabel = (type: string) => {
    return type === 'online' ? 'En línea' : 'Manual';
  };

  const getTypeColor = (type: string) => {
    return type === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white dark:bg-[#2a2118] rounded-xl shadow-sm border border-[#e5e7eb] dark:border-white/10 overflow-hidden">
      {/* Gateway Header */}
      <div className="p-6 border-b border-[#e5e7eb] dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[28px]">{gateway.icon}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold dark:text-white">{gateway.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getTypeColor(gateway.type)}`}>
                  {getTypeLabel(gateway.type)}
                </span>
                {gateway.status === 'active' && (
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase">
                    Activo
                  </span>
                )}
              </div>
              <p className="text-sm text-[#8a7560] mt-1">{gateway.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {gateway.requiresConfig && gateway.status === 'active' && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-[#8a7560] hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">
                  {isExpanded ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            )}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                checked={gateway.status === 'active'}
                className="sr-only peer"
                type="checkbox"
                onChange={handleToggle}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Configuration Form (if expanded and requires config) */}
      {isExpanded && gateway.requiresConfig && gateway.status === 'active' && (
        <div className="p-6 bg-background-light/50 dark:bg-white/5 space-y-6">
          {/* Environment Toggle */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#181411] dark:text-white">
              Ambiente
            </label>
            <p className="text-xs text-[#8a7560] mb-2">
              Cambia entre Sandbox para pruebas y Producción para ventas reales.
            </p>
            <div className="flex p-1 bg-background-light dark:bg-[#1c140d] rounded-lg border border-[#e5e7eb] dark:border-white/10">
              <button
                type="button"
                onClick={() => setConfig({ ...config, environment: 'test' })}
                className={`flex-1 py-2 text-sm font-bold rounded-md shadow-sm border transition-all ${
                  config.environment === 'test'
                    ? 'bg-white dark:bg-[#2a2118] text-[#181411] dark:text-white border-[#e5e7eb] dark:border-white/20'
                    : 'text-[#8a7560] hover:text-[#181411] dark:hover:text-white'
                }`}
              >
                Prueba / Sandbox
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, environment: 'prod' })}
                className={`flex-1 py-2 text-sm font-bold rounded-md shadow-sm border transition-all ${
                  config.environment === 'prod'
                    ? 'bg-white dark:bg-[#2a2118] text-[#181411] dark:text-white border-[#e5e7eb] dark:border-white/20'
                    : 'text-[#8a7560] hover:text-[#181411] dark:hover:text-white'
                }`}
              >
                Producción / Live
              </button>
            </div>
          </div>

          {/* Merchant ID / Public Key */}
          {gateway.id === 'transbank' && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#181411] dark:text-white">
                Merchant ID
              </label>
              <div className="relative">
                <input
                  className="form-input w-full rounded-lg border-[#e5e7eb] dark:border-white/10 dark:bg-[#1c140d] dark:text-white focus:ring-primary focus:border-primary pl-10"
                  placeholder="Ingresa Merchant ID"
                  type="text"
                  value={config.merchantId || ''}
                  onChange={(e) => setConfig({ ...config, merchantId: e.target.value })}
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7560] text-[20px]">
                  badge
                </span>
              </div>
              <p className="text-[11px] text-[#8a7560]">
                Tu identificador único proporcionado por la pasarela.
              </p>
            </div>
          )}

          {(gateway.id === 'mercadopago' || gateway.id === 'stripe') && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#181411] dark:text-white">
                Public Key
              </label>
              <div className="relative">
                <input
                  className="form-input w-full rounded-lg border-[#e5e7eb] dark:border-white/10 dark:bg-[#1c140d] dark:text-white focus:ring-primary focus:border-primary pl-10"
                  placeholder="Ingresa Public Key"
                  type="text"
                  value={config.publicKey || ''}
                  onChange={(e) => setConfig({ ...config, publicKey: e.target.value })}
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7560] text-[20px]">
                  vpn_key
                </span>
              </div>
            </div>
          )}

          {/* Secret Key */}
          {gateway.requiresConfig && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#181411] dark:text-white">
                Secret API Key
              </label>
              <div className="relative">
                <input
                  className="form-input w-full rounded-lg border-[#e5e7eb] dark:border-white/10 dark:bg-[#1c140d] dark:text-white focus:ring-primary focus:border-primary pl-10 pr-10"
                  placeholder="••••••••••••••••"
                  type={showSecretKey ? 'text' : 'password'}
                  value={config.secretKey || ''}
                  onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7560] text-[20px]">
                  key
                </span>
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a7560] hover:text-primary"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showSecretKey ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-[#8a7560]">
                Nunca compartas tu clave secreta. Proporciona acceso completo a transacciones.
              </p>
            </div>
          )}

          {/* Connection Status */}
          {gateway.status === 'active' && (
            <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4 flex gap-4 border border-primary/20">
              <span className="material-symbols-outlined text-primary text-[24px]">info</span>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#181411] dark:text-white">
                  Estado de Conexión:{' '}
                  <span className="text-green-600 dark:text-green-400">Listo</span>
                </p>
                <p className="text-xs text-[#8a7560]">
                  La pasarela está configurada para modo {config.environment === 'test' ? 'Sandbox' : 'Producción'}.{' '}
                  {config.environment === 'test' && 'Puedes realizar transacciones de prueba usando tarjetas de prueba.'}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => onTestConnection(gateway.id)}
              className="px-4 py-2 text-sm font-bold text-[#8a7560] hover:text-primary border border-[#e5e7eb] dark:border-white/10 rounded-lg hover:bg-primary/5 transition-all"
            >
              Probar Conexión
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Guardar Configuración
            </button>
          </div>
        </div>
      )}
    </div>
  );
};



