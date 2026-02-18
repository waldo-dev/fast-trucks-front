'use client';

import { useState } from 'react';
import { GatewayCard } from '@/components/payments/GatewayCard';
import { PaymentMethodsToggle } from '@/components/payments/PaymentMethodsToggle';

export default function PaymentsPage() {
  const [gateways, setGateways] = useState([
    {
      id: 'transbank',
      name: 'Transbank (Webpay)',
      type: 'online' as const,
      status: 'active' as const,
      icon: 'account_balance',
      description: 'Pasarela de pago líder en Chile. Acepta tarjetas de crédito y débito.',
      requiresConfig: true,
      config: {
        merchantId: 'WP_592810332',
        secretKey: 'sk_test_51Mz8XnLz0f',
        environment: 'test' as const,
      },
    },
    {
      id: 'mercadopago',
      name: 'Mercado Pago',
      type: 'online' as const,
      status: 'inactive' as const,
      icon: 'payments',
      description: 'Solución de pagos de Mercado Libre. Popular en Latinoamérica.',
      requiresConfig: true,
      config: {
        publicKey: '',
        secretKey: '',
        environment: 'test' as const,
      },
    },
    {
      id: 'stripe',
      name: 'Stripe',
      type: 'online' as const,
      status: 'inactive' as const,
      icon: 'credit_card',
      description: 'Plataforma de pagos internacional. Acepta múltiples monedas.',
      requiresConfig: true,
      config: {
        publicKey: '',
        secretKey: '',
        environment: 'test' as const,
      },
    },
    {
      id: 'cash',
      name: 'Pago en Efectivo',
      type: 'manual' as const,
      status: 'active' as const,
      icon: 'money',
      description: 'Pagos en efectivo al momento de la entrega o recogida.',
      requiresConfig: false,
    },
    {
      id: 'transfer',
      name: 'Transferencia Bancaria',
      type: 'manual' as const,
      status: 'active' as const,
      icon: 'account_balance_wallet',
      description: 'Transferencias bancarias directas. Requiere confirmación manual.',
      requiresConfig: false,
    },
  ]);

  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 'credit_card',
      name: 'Tarjeta de Crédito',
      icon: 'credit_card',
      enabled: true,
    },
    {
      id: 'debit_card',
      name: 'Tarjeta de Débito',
      icon: 'account_balance',
      enabled: true,
    },
    {
      id: 'cash',
      name: 'Efectivo',
      icon: 'money',
      enabled: true,
    },
    {
      id: 'transfer',
      name: 'Transferencia',
      icon: 'account_balance_wallet',
      enabled: true,
    },
  ]);

  const [selectedVenue, setSelectedVenue] = useState('1');
  const [paymentsEnabled, setPaymentsEnabled] = useState(true);

  const handleGatewayToggle = (id: string) => {
    setGateways((prev) =>
      prev.map((gateway) => {
        if (gateway.id === id) {
          const newStatus = gateway.status === 'active' ? 'inactive' : 'active';
          
          // Validación: al menos un método debe estar activo
          const activeCount = prev.filter((g) => g.status === 'active').length;
          if (newStatus === 'inactive' && activeCount === 1) {
            alert('Debes mantener al menos un método de pago activo.');
            return gateway;
          }
          
          return { ...gateway, status: newStatus };
        }
        return gateway;
      })
    );
  };

  const handleGatewaySave = (id: string, config: any) => {
    setGateways((prev) =>
      prev.map((gateway) => (gateway.id === id ? { ...gateway, config } : gateway))
    );
    // Placeholder: sin acción real
    console.log('Guardar configuración:', id, config);
  };

  const handleTestConnection = (id: string) => {
    // Placeholder: sin acción real
    console.log('Probar conexión:', id);
    alert('Conexión probada exitosamente (simulación)');
  };

  const handlePaymentMethodToggle = (id: string) => {
    setPaymentMethods((prev) =>
      prev.map((method) => {
        if (method.id === id) {
          const newEnabled = !method.enabled;
          
          // Validación: al menos un método debe estar habilitado
          const enabledCount = prev.filter((m) => m.enabled).length;
          if (!newEnabled && enabledCount === 1) {
            alert('Debes mantener al menos un método de pago habilitado para clientes.');
            return method;
          }
          
          return { ...method, enabled: newEnabled };
        }
        return method;
      })
    );
  };

  const handleSaveAll = () => {
    // Placeholder: sin acción real
    console.log('Guardar toda la configuración');
    alert('Configuración guardada exitosamente (simulación)');
  };

  const venues = [
    { id: '1', name: 'Pizzería Centro (Principal)' },
    { id: '2', name: 'Food Truck Oeste' },
    { id: '3', name: 'Express Norte' },
    { id: '4', name: 'Deli Suburbano' },
  ];

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-5xl mx-auto w-full">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <a className="text-[#8a7560] hover:text-primary" href="#">
          Admin
        </a>
        <span className="text-[#8a7560] material-symbols-outlined text-[16px]">chevron_right</span>
        <a className="text-[#8a7560] hover:text-primary" href="#">
          Configuración
        </a>
        <span className="text-[#8a7560] material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-[#181411] dark:text-white font-semibold">
          Pasarelas de Pago
        </span>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black leading-tight tracking-tight dark:text-white">
          Configuración de Pasarelas de Pago
        </h1>
        <p className="text-[#8a7560] mt-2">
          Configura y gestiona los métodos de pago para cada uno de tus locales de restaurante.
        </p>
      </div>

      {/* Venue Selection Card */}
      <div className="bg-white dark:bg-[#2a2118] rounded-xl shadow-sm border border-[#e5e7eb] dark:border-white/10 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[28px]">location_on</span>
            </div>
            <div>
              <h3 className="text-lg font-bold dark:text-white">Seleccionar Local</h3>
              <p className="text-[#8a7560] text-sm">
                La configuración se aplica al local seleccionado
              </p>
            </div>
          </div>
          <div className="min-w-[240px]">
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="form-select w-full rounded-lg border-[#e5e7eb] dark:border-white/10 dark:bg-[#1c140d] dark:text-white focus:ring-primary focus:border-primary"
            >
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="bg-white dark:bg-[#2a2118] rounded-xl shadow-sm border border-[#e5e7eb] dark:border-white/10 overflow-hidden mb-8">
        <div className="p-6 border-b border-[#e5e7eb] dark:border-white/10 flex items-center justify-between bg-background-light/50 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
            <h2 className="text-xl font-bold dark:text-white">Configuración de Pasarelas</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#8a7560]">Habilitar Pagos</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                checked={paymentsEnabled}
                className="sr-only peer"
                type="checkbox"
                onChange={(e) => setPaymentsEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Gateway Cards */}
          {gateways.map((gateway) => (
            <GatewayCard
              key={gateway.id}
              gateway={gateway}
              onToggle={handleGatewayToggle}
              onSave={handleGatewaySave}
              onTestConnection={handleTestConnection}
            />
          ))}

          {/* Save All Button */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-[#e5e7eb] dark:border-white/10">
            <button
              type="button"
              className="px-6 py-2.5 text-sm font-bold text-[#8a7560] hover:text-[#181411] dark:hover:text-white transition-all"
            >
              Descartar Cambios
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="bg-primary hover:bg-primary/90 text-white px-10 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>

      {/* Payment Methods Toggle */}
      <PaymentMethodsToggle
        methods={paymentMethods}
        onToggle={handlePaymentMethodToggle}
      />

      {/* Help/Resources */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 rounded-xl border border-[#e5e7eb] dark:border-white/10 bg-white/50 dark:bg-white/5">
          <span className="material-symbols-outlined text-primary mb-2">menu_book</span>
          <h4 className="font-bold text-sm dark:text-white">Documentación</h4>
          <p className="text-xs text-[#8a7560] mt-1">
            Guías paso a paso para conectar pasarelas.
          </p>
          <a className="text-xs text-primary font-bold mt-2 inline-block" href="#">
            Leer Docs →
          </a>
        </div>
        <div className="p-4 rounded-xl border border-[#e5e7eb] dark:border-white/10 bg-white/50 dark:bg-white/5">
          <span className="material-symbols-outlined text-primary mb-2">support_agent</span>
          <h4 className="font-bold text-sm dark:text-white">Contactar Soporte</h4>
          <p className="text-xs text-[#8a7560] mt-1">¿Necesitas ayuda con tu Merchant ID?</p>
          <a className="text-xs text-primary font-bold mt-2 inline-block" href="#">
            Chatear Ahora →
          </a>
        </div>
        <div className="p-4 rounded-xl border border-[#e5e7eb] dark:border-white/10 bg-white/50 dark:bg-white/5">
          <span className="material-symbols-outlined text-primary mb-2">security</span>
          <h4 className="font-bold text-sm dark:text-white">Cumplimiento PCI</h4>
          <p className="text-xs text-[#8a7560] mt-1">
            Asegurando el manejo seguro de datos de tarjetas.
          </p>
          <a className="text-xs text-primary font-bold mt-2 inline-block" href="#">
            Verificar Estado →
          </a>
        </div>
      </div>
    </div>
  );
}



