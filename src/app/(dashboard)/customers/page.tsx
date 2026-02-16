'use client';

import { useState } from 'react';
import { CustomerStats } from '@/components/customers/CustomerStats';
import { CustomerTable } from '@/components/customers/CustomerTable';

export default function CustomersPage() {
  const [expandedCustomer, setExpandedCustomer] = useState<number | null>(4);

  const customers = [
    {
      id: 1,
      name: 'Alex Morgan',
      email: 'alex.morgan@email.com',
      phone: '+1 (555) 123-4567',
      initials: 'AM',
      avatarColor: 'from-primary/20 to-primary/40 text-primary',
      totalOrders: 42,
      lastOrder: {
        time: 'Hace 2 horas',
        venue: 'Local Centro',
      },
      status: 'VIP' as const,
    },
    {
      id: 2,
      name: 'Sarah Richardson',
      email: 'sarah.rich@webmail.com',
      phone: '+1 (555) 987-6543',
      initials: 'SR',
      avatarColor: 'from-blue-100 to-blue-200 text-blue-600',
      totalOrders: 18,
      lastOrder: {
        time: 'Ayer',
        venue: 'Food Truck B',
      },
      status: 'Active' as const,
    },
    {
      id: 3,
      name: 'James Lora',
      email: 'j.lora@service.com',
      phone: '+1 (555) 246-8101',
      initials: 'JL',
      avatarColor: 'from-purple-100 to-purple-200 text-purple-600',
      totalOrders: 5,
      lastOrder: {
        time: '14 Ago, 2023',
        venue: 'Local Principal',
      },
      status: 'New' as const,
    },
    {
      id: 4,
      name: 'Kevin Watson',
      email: 'kwatson@provider.net',
      phone: '+1 (555) 369-1215',
      initials: 'KW',
      avatarColor: 'from-orange-100 to-orange-200 text-orange-600',
      totalOrders: 12,
      lastOrder: {
        time: 'Hoy, 11:45 AM',
        venue: 'Food Truck C',
        isToday: true,
      },
      status: 'Active' as const,
      isExpanded: expandedCustomer === 4,
      recentOrders: [
        {
          id: '82931',
          items: '2x Pepperoni Feast, 1x Coca-Cola',
          total: '$42.50',
          time: 'Hace 2h',
        },
        {
          id: '82504',
          items: '1x Veggie Deluxe (Grande)',
          total: '$24.99',
          time: 'Martes pasado',
        },
      ],
      favoriteItem: 'Pizza Carnívora',
    },
    {
      id: 5,
      name: 'María Delgado',
      email: 'm.delgado@workmail.com',
      phone: '+1 (555) 753-9514',
      initials: 'MD',
      avatarColor: 'from-green-100 to-green-200 text-green-600',
      totalOrders: 27,
      lastOrder: {
        time: 'Hace 3 días',
        venue: 'Local Centro',
      },
      status: 'VIP' as const,
    },
  ];

  const stats = [
    {
      icon: 'group',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      label: 'Total Clientes',
      value: '1,284',
      change: '+12.5%',
      changeColor: 'text-[#07880e]',
      changeBg: 'bg-green-50',
    },
    {
      icon: 'shopping_cart',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      label: 'Activos Esta Semana',
      value: '156',
      change: '+5.2%',
      changeColor: 'text-[#07880e]',
      changeBg: 'bg-green-50',
    },
    {
      icon: 'repeat',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      label: 'Frecuencia Promedio',
      value: '2.4/mes',
      change: '-2%',
      changeColor: 'text-red-500',
      changeBg: 'bg-red-50',
    },
  ];

  const handleToggleExpand = (id: number) => {
    setExpandedCustomer(expandedCustomer === id ? null : id);
  };

  const handleViewProfile = (id: number) => {
    // Placeholder: sin acción real
    console.log('Ver perfil completo:', id);
  };

  const handleExport = () => {
    // Placeholder: sin acción real
    console.log('Exportar CSV');
  };

  const handleNewCustomer = () => {
    // Placeholder: sin acción real
    console.log('Nuevo cliente');
  };

  // Agregar isExpanded a cada cliente
  const customersWithExpanded = customers.map((customer) => ({
    ...customer,
    isExpanded: expandedCustomer === customer.id,
  }));

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-10 gap-8 overflow-y-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <a className="text-[#8a7560] hover:text-primary transition-colors" href="#">
          Admin
        </a>
        <span className="material-symbols-outlined text-xs text-[#8a7560]">chevron_right</span>
        <span className="text-[#181411] font-medium">Directorio de Clientes</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-[#181411] text-3xl font-black tracking-tight">
            Directorio de Clientes
          </h2>
          <p className="text-[#8a7560] text-base mt-1">
            Gestiona y relaciona con 1,284 clientes en todos los food trucks y locales.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 h-11 bg-white border border-primary/20 rounded-lg text-[#181411] text-sm font-bold hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar CSV
          </button>
          <button
            onClick={handleNewCustomer}
            className="flex items-center gap-2 px-4 h-11 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <CustomerStats stats={stats} />

      {/* Main CRM Table Card */}
      <CustomerTable
        customers={customersWithExpanded}
        onToggleExpand={handleToggleExpand}
        onViewProfile={handleViewProfile}
      />
    </div>
  );
}

