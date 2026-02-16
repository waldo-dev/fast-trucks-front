'use client';

import { useState } from 'react';
import { OutletCard } from '@/components/outlets/OutletCard';
import { OutletTabs } from '@/components/outlets/OutletTabs';
import { StatsOverview } from '@/components/outlets/StatsOverview';
import { AddOutletCard } from '@/components/outlets/AddOutletCard';

export default function OutletsPage() {
  const [activeTab, setActiveTab] = useState('all');

  const outlets = [
    {
      id: 1,
      name: 'Pizzería Centro',
      address: '421 Market St, Suite 100',
      type: 'Pizzeria' as const,
      status: 'active' as const,
      statusLabel: 'Activo',
      statusColor: 'text-primary',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBIcJcyIJFxipsLormKK-CuyxTXP9SGmVDyPuViBuLylMWFMY9QrWh4omNwYDfvdPPvGLRyoljflczgzht7tNtOk8kpM36GX2EsBLU4sG9-BSychuaCJ7gKiTSeKt4-HYgrIc7nEqv9HXPcYVZkOuF_roTvqwVifxY49lObtRGgTJ_3GaNdjdq3qkawjpy5DqZAR9MP9wRdhNKIEGvpfg_fhw12mgI9tGUfMtxnlE-VeJxhwFJwZm2HaQeVSzpp4IJF8bowekD8vMBn',
      todayRevenue: '$2,481.50',
      pendingOrders: 12,
      hours: 'Abierto 10 AM - 11 PM',
    },
    {
      id: 2,
      name: 'Food Truck Calle Principal',
      address: 'Móvil - Actual: Plaza Sq.',
      type: 'Food Truck' as const,
      status: 'active' as const,
      statusLabel: 'Activo',
      statusColor: 'text-primary',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBZQJT9vQFogLiC4zu-C21BPbYf0RkniKf0AGqJAXmzskozYV9-zkTo8RgJLgYQ5x4_fHqSd0_JWgSVvklWvz_PCXn4BzsDOuvjVaQzplXunbUaYCmPOA673lXm-mY748hHgybIQji80N_bnzZUiocXHUCHTCN7H-IJRRfQEpu6KzfWBFg-us1vxc6mYkvbd2tvh7lReB3XN8MBSh8Bw8QPIPcq-y_FX4oSOv9RJik-sLmzPLzh5v3OWBMQL69ihQXI9egg85p15x-h',
      todayRevenue: '$842.20',
      pendingOrders: 4,
      warning: 'En línea',
    },
    {
      id: 3,
      name: 'Cocina Norte',
      address: '192 Industrial Way',
      type: 'Ghost Kitchen' as const,
      status: 'active' as const,
      statusLabel: 'Activo',
      statusColor: 'text-primary',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBi0dG_SdEiUZynthnhP_tRQskakdYGJ5bTRGqoXREgcfxSuf1kgN88aRZU4CrutsbSSfj_JJJIOHoVJGkIlZb_k0kbXjHhm3zaUWvBSsq3O8ivYMrh9ihBvzD3tKDysCNE-9jBaL8iMblqF_RTAARF7FDE8J1XLXdmREHSIo6mGBDqMn1IsZqyjRtJzffe3Tl4xH2jKohjKvvVoYBNt0K84s6hQJm_OyO5qGi7t3eXZ0TSf5ktsO0rAb7jpILC1zlwsC7CQNHlhAPl',
      todayRevenue: '$1,205.00',
      pendingOrders: 28,
      warning: '1 Advertencia',
    },
    {
      id: 4,
      name: 'Pizzería Sunset Blvd',
      address: '8812 Sunset Blvd',
      type: 'Pizzeria' as const,
      status: 'inactive' as const,
      statusLabel: 'Inactivo',
      statusColor: 'text-[#8a7560]',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDdU2hdeVk23z25p0RB6NG6l8_dwpnOahjl6WHz7kSUBCyyKXZi6gMHDYX9ug_RZoaJQudJITZ3WlRY0J0hrb8XXamw3mckXY-akH3heYZsrn65qeulihoTBB9Mezp3MAHWeYYDVXrjE-NPaEsYOEpNVO0SH-tTZOObDF5mRv6u_LRPfXX8hKJuTruCuxY_eJRGHMdcnxWm6HYPa-5Yi5iO7PhRbbuxPM3G116O06pdUebhvRZG-El1vCkoUxlSKd2iPjQjwXviubGf',
      todayRevenue: '$0.00',
      pendingOrders: 0,
      hours: 'Mantenimiento',
    },
  ];

  const tabs = [
    { label: 'Todos los Locales', count: 12, id: 'all' },
    { label: 'Pizzerías', count: 5, id: 'pizzerias' },
    { label: 'Food Trucks', count: 3, id: 'food-trucks' },
    { label: 'Cocinas Fantasma', count: 4, id: 'ghost-kitchens' },
  ];

  const stats = [
    {
      icon: 'payments',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      label: 'Ingresos Totales',
      value: '$14,530.22',
      badge: {
        text: '+12% vs Año Pasado',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      },
    },
    {
      icon: 'shopping_cart',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      label: 'Pedidos Activos',
      value: '44',
      badge: {
        text: 'Alto Volumen',
        color: 'text-primary',
        bgColor: 'bg-primary/5',
      },
    },
    {
      icon: 'groups',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      label: 'Personal en Turno',
      value: '18/22',
    },
    {
      icon: 'schedule',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      label: 'Tiempo Prom. Preparación',
      value: '14.5m',
    },
  ];

  const handleEdit = (id: number) => {
    // Placeholder: sin acción real
    console.log('Editar local:', id);
  };

  const handleToggleStatus = (id: number) => {
    // Placeholder: sin acción real
    console.log('Cambiar estado local:', id);
  };

  const handleAddOutlet = () => {
    // Placeholder: sin acción real
    console.log('Agregar nuevo local');
  };

  return (
    <div className="flex-1 px-10 py-8 max-w-[1440px] mx-auto w-full">
      {/* Page Header Area */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#181411] text-4xl font-extrabold tracking-tight">
            Gestionar Locales de Comida
          </h1>
          <p className="text-[#8a7560] text-lg font-medium">
            Centro de control y visión general para tus 12 ubicaciones activas.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl h-12 px-6 bg-white border border-[#e6e0db] text-[#181411] font-bold hover:bg-gray-50 transition-all shadow-sm">
            <span className="material-symbols-outlined">filter_list</span>
            <span>Filtros</span>
          </button>
          <button
            onClick={handleAddOutlet}
            className="flex items-center gap-2 rounded-xl h-12 px-6 bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span>Agregar Nuevo Local</span>
          </button>
        </div>
      </div>

      {/* Tabs Section */}
      <OutletTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Outlet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {outlets.map((outlet) => (
          <OutletCard
            key={outlet.id}
            outlet={outlet}
            onEdit={() => handleEdit(outlet.id)}
            onToggleStatus={() => handleToggleStatus(outlet.id)}
          />
        ))}
        <AddOutletCard onClick={handleAddOutlet} />
      </div>

      {/* Stats Overview Summary */}
      <StatsOverview stats={stats} />
    </div>
  );
}

