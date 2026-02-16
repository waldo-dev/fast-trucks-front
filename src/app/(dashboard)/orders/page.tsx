'use client';

import { useState } from 'react';
import { StatusFilterCards } from '@/components/orders/StatusFilterCards';
import { OrderTable } from '@/components/orders/OrderTable';
import { StatsFooter } from '@/components/orders/StatsFooter';

export default function OrdersPage() {
  const [activeFilter, setActiveFilter] = useState('all');

  const orders = [
    {
      id: 'ORD-4921',
      time: 'Hoy, 12:45 PM',
      venue: 'Pizzería Centro',
      customer: {
        initials: 'JS',
        name: 'Juan Sánchez',
      },
      type: 'Delivery' as const,
      status: 'new' as const,
      total: '$45.00',
    },
    {
      id: 'ORD-4920',
      time: 'Hoy, 12:38 PM',
      venue: 'Food Truck Alpha',
      customer: {
        initials: 'MG',
        name: 'María García',
      },
      type: 'Pickup' as const,
      status: 'preparing' as const,
      total: '$22.50',
    },
    {
      id: 'ORD-4919',
      time: 'Hoy, 12:30 PM',
      venue: 'Midtown Express',
      customer: {
        initials: 'RC',
        name: 'Roberto Chen',
      },
      type: 'Delivery' as const,
      status: 'ready' as const,
      total: '$38.00',
    },
    {
      id: 'ORD-4918',
      time: 'Hoy, 12:15 PM',
      venue: 'Pizzería Centro',
      customer: {
        initials: 'SW',
        name: 'Sara Wilson',
      },
      type: 'Pickup' as const,
      status: 'delivered' as const,
      total: '$15.75',
      isDelivered: true,
    },
    {
      id: 'ORD-4917',
      time: 'Hoy, 12:10 PM',
      venue: 'Food Truck Beta',
      customer: {
        initials: 'KA',
        name: 'Kevin Adams',
      },
      type: 'Delivery' as const,
      status: 'preparing' as const,
      total: '$52.00',
    },
  ];

  const statusFilters = [
    {
      label: 'Todos los Pedidos',
      count: 128,
      color: '',
      isActive: activeFilter === 'all',
      change: '+12%',
      onClick: () => setActiveFilter('all'),
    },
    {
      label: 'Nuevo',
      count: 12,
      color: 'bg-yellow-400',
      isActive: activeFilter === 'new',
      onClick: () => setActiveFilter('new'),
    },
    {
      label: 'Preparando',
      count: 24,
      color: 'bg-primary',
      isActive: activeFilter === 'preparing',
      onClick: () => setActiveFilter('preparing'),
    },
    {
      label: 'Listo',
      count: 18,
      color: 'bg-green-500',
      isActive: activeFilter === 'ready',
      onClick: () => setActiveFilter('ready'),
    },
    {
      label: 'Entregado',
      count: 74,
      color: 'bg-gray-400',
      isActive: activeFilter === 'delivered',
      onClick: () => setActiveFilter('delivered'),
    },
  ];

  const handleViewDetails = (orderId: string) => {
    // Placeholder: sin acción real
    console.log('Ver detalles del pedido:', orderId);
  };

  const handleExport = () => {
    // Placeholder: sin acción real
    console.log('Exportar reporte');
  };

  const handleManualOrder = () => {
    // Placeholder: sin acción real
    console.log('Crear pedido manual');
  };

  return (
    <div className="flex flex-col flex-1 max-w-[1440px] mx-auto w-full px-4 md:px-10 py-8">
      {/* Page Title & Main Action */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#181411] text-4xl font-black leading-tight tracking-tight">
            Pedidos Operativos
          </h1>
          <p className="text-[#8a7560] text-base font-normal">
            Monitorea y gestiona el tráfico en tiempo real en 12 locales activos.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 h-11 bg-white border border-[#e6e0db] rounded-xl text-[#181411] text-sm font-bold hover:bg-[#f5f2f0] transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-xl">download</span>
            Exportar Reporte
          </button>
          <button
            onClick={handleManualOrder}
            className="flex items-center gap-2 px-6 h-11 bg-primary rounded-xl text-white text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Pedido Manual
          </button>
        </div>
      </div>

      {/* Status Filter Cards */}
      <StatusFilterCards filters={statusFilters} />

      {/* Table Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-t-2xl border border-[#e6e0db] border-b-0">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7560]">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-[#f5f2f0] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
              placeholder="Buscar por ID de Pedido, Cliente o Local..."
              type="text"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-[#e6e0db] rounded-lg text-sm font-semibold hover:bg-[#f5f2f0]">
            <span className="material-symbols-outlined text-lg">filter_list</span>
            Filtrar
          </button>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-[#8a7560] font-medium mr-2">Actualizado hace 30s</p>
          <button className="size-9 flex items-center justify-center rounded-lg bg-[#f5f2f0] text-primary">
            <span className="material-symbols-outlined text-xl">refresh</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <OrderTable orders={orders} onViewDetails={handleViewDetails} />

      {/* Pagination */}
      <div className="flex items-center justify-between py-6 px-4">
        <p className="text-sm text-[#8a7560] font-medium">
          Mostrando <span className="text-[#181411]">1-5</span> de{' '}
          <span className="text-[#181411]">128</span> pedidos
        </p>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 border border-[#e6e0db] rounded-lg text-sm font-bold bg-white text-[#181411] hover:bg-[#f5f2f0] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
          >
            Anterior
          </button>
          <button className="px-4 py-2 border border-[#e6e0db] rounded-lg text-sm font-bold bg-white text-[#181411] hover:bg-[#f5f2f0]">
            Siguiente
          </button>
        </div>
      </div>

      {/* Stats Footer */}
      <StatsFooter />
    </div>
  );
}

