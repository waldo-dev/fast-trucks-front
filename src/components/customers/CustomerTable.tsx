import React from 'react';
import { CustomerRow } from './CustomerRow';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  initials: string;
  avatarColor: string;
  totalOrders: number;
  lastOrder: {
    time: string;
    venue: string;
    isToday?: boolean;
  };
  status: 'VIP' | 'Active' | 'New';
  isExpanded?: boolean;
  recentOrders?: Array<{
    id: string;
    items: string;
    total: string;
    time: string;
  }>;
  favoriteItem?: string;
}

interface CustomerTableProps {
  customers: Customer[];
  onToggleExpand: (id: number) => void;
  onViewProfile: (id: number) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  onToggleExpand,
  onViewProfile,
}) => {
  return (
    <div className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden">
      {/* Filter bar */}
      <div className="p-4 border-b border-primary/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button className="px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold whitespace-nowrap">
            Todos los Clientes
          </button>
          <button className="px-4 py-2 hover:bg-primary/5 text-[#8a7560] rounded-full text-xs font-medium whitespace-nowrap">
            Comensales Frecuentes
          </button>
          <button className="px-4 py-2 hover:bg-primary/5 text-[#8a7560] rounded-full text-xs font-medium whitespace-nowrap">
            Nuevos Registros
          </button>
          <button className="px-4 py-2 hover:bg-primary/5 text-[#8a7560] rounded-full text-xs font-medium whitespace-nowrap">
            Inactivos (30d+)
          </button>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7560] text-lg">
              filter_list
            </span>
            <input
              className="pl-10 w-full border border-primary/10 rounded-lg h-9 text-sm focus:ring-primary focus:border-primary"
              placeholder="Filtrar por local..."
              type="text"
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-primary/5 text-[#8a7560] text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Teléfono</th>
              <th className="px-6 py-4">Total Pedidos</th>
              <th className="px-6 py-4">Último Pedido</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {customers.map((customer) => (
              <CustomerRow
                key={customer.id}
                customer={customer}
                onToggleExpand={onToggleExpand}
                onViewProfile={onViewProfile}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 bg-white border-t border-primary/5 flex items-center justify-between">
        <p className="text-xs text-[#8a7560] font-medium">
          Mostrando 1 a 5 de 1,284 clientes
        </p>
        <div className="flex gap-2">
          <button
            className="size-8 rounded border border-primary/10 flex items-center justify-center text-[#8a7560] hover:bg-primary/5 cursor-not-allowed opacity-50"
            disabled
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <button className="size-8 rounded bg-primary text-white flex items-center justify-center text-xs font-bold">
            1
          </button>
          <button className="size-8 rounded border border-primary/10 flex items-center justify-center text-[#8a7560] hover:bg-primary/5 text-xs font-bold">
            2
          </button>
          <button className="size-8 rounded border border-primary/10 flex items-center justify-center text-[#8a7560] hover:bg-primary/5 text-xs font-bold">
            3
          </button>
          <button className="size-8 rounded border border-primary/10 flex items-center justify-center text-[#8a7560] hover:bg-primary/5">
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};


