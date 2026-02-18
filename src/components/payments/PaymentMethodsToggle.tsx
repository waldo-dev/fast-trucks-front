'use client';

import React from 'react';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

interface PaymentMethodsToggleProps {
  methods: PaymentMethod[];
  onToggle: (id: string) => void;
}

export const PaymentMethodsToggle: React.FC<PaymentMethodsToggleProps> = ({
  methods,
  onToggle,
}) => {
  return (
    <div className="bg-white dark:bg-[#2a2118] rounded-xl shadow-sm border border-[#e5e7eb] dark:border-white/10 p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-primary text-[28px]">credit_card</span>
        <div>
          <h3 className="text-lg font-bold dark:text-white">Métodos de Pago Habilitados</h3>
          <p className="text-sm text-[#8a7560]">
            Selecciona los métodos de pago disponibles para tus clientes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methods.map((method) => (
          <div
            key={method.id}
            className="flex items-center justify-between p-4 border border-[#e5e7eb] dark:border-white/10 rounded-lg hover:bg-background-light dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[24px]">
                {method.icon}
              </span>
              <span className="text-sm font-semibold dark:text-white">{method.name}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                checked={method.enabled}
                className="sr-only peer"
                type="checkbox"
                onChange={() => onToggle(method.id)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        ))}
      </div>

      {methods.filter((m) => m.enabled).length === 0 && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Debes habilitar al menos un método de pago para que los clientes puedan realizar pedidos.
          </p>
        </div>
      )}
    </div>
  );
};



