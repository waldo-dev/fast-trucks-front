'use client';

import { useState, type FormEvent } from 'react';
import { CustomerStats } from '@/components/customers/CustomerStats';
import { CustomerTable } from '@/components/customers/CustomerTable';

export default function CustomersPage() {
  const [expandedCustomer, setExpandedCustomer] = useState<number | null>(4);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'Active',
  });

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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      status: 'Active',
    });
  };

  const handleSubmitNewCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Crear cliente:', newCustomer);
    handleCloseModal();
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

      {/* Modal Crear Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8 border border-primary/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#8a7560] font-semibold">
                  Nuevo Cliente
                </p>
                <h3 className="text-2xl font-black text-[#181411]">Crear cliente</h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-full hover:bg-primary/10 text-[#8a7560] transition-colors"
                aria-label="Cerrar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmitNewCustomer}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Nombre completo
                  <input
                    required
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="h-11 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-[#181411]"
                    placeholder="Ej. Alex Morgan"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Correo
                  <input
                    required
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="h-11 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-[#181411]"
                    placeholder="cliente@email.com"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Teléfono
                  <input
                    required
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="h-11 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-[#181411]"
                    placeholder="+1 (555) 123-4567"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Estado
                  <select
                    value={newCustomer.status}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="h-11 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-[#181411] bg-white"
                  >
                    <option value="Active">Activo</option>
                    <option value="VIP">VIP</option>
                    <option value="New">Nuevo</option>
                  </select>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="h-11 px-4 rounded-lg border border-primary/20 text-[#181411] text-sm font-bold hover:bg-primary/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-11 px-4 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                >
                  Guardar cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

