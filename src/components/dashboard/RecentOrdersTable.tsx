import React, { useMemo, useState } from 'react';
import Link from 'next/link';

type OrderStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'NEW'
  | string;

interface Order {
  id: string; // label to show (e.g. #1234)
  rawId?: string; // id used for navigation
  venue: string;
  customer: string;
  amount: string;
  status: OrderStatus;
}

interface RecentOrdersTableProps {
  orders: Order[];
}

const statusMeta = (status: OrderStatus) => {
  const normalized = status?.toString().toUpperCase();
  switch (normalized) {
    case 'PREPARING':
    case 'CONFIRMED':
      return { label: 'Preparando', className: 'bg-emerald-100 text-emerald-700' };
    case 'READY':
      return { label: 'Listo', className: 'bg-blue-100 text-blue-700' };
    case 'DELIVERED':
      return { label: 'Entregado', className: 'bg-slate-200 text-slate-700' };
    case 'CANCELLED':
      return { label: 'Cancelado', className: 'bg-red-100 text-red-700' };
    case 'CREATED':
    case 'NEW':
    default:
      return { label: 'Nuevo', className: 'bg-blue-100 text-blue-700' };
  }
};

export const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({ orders }) => {
  const pageSize = 5;
  const [page, setPage] = useState(1);
  const handleNavigate = (rawId?: string) => {
    if (!rawId) return;
    window.location.href = `/pos/pedidos-activos/${encodeURIComponent(rawId)}`;
  };

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return orders.slice(start, start + pageSize);
  }, [orders, currentPage, pageSize]);

  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1));

  return (
    <div className="xl:col-span-2 bg-white dark:bg-[#2d2419] rounded-xl shadow-sm border border-[#e6e0db] overflow-hidden">
      <div className="px-6 py-5 border-b border-[#f5f2f0] flex justify-between items-center">
        <h3 className="font-bold text-lg dark:text-white">Pedidos Recientes</h3>
        <Link href="/orders" className="text-primary text-sm font-semibold hover:underline">
          Ver Todos
        </Link>
      </div>
      {/* Escritorio: tabla */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-left">
          <thead className="bg-[#fcfbf9] dark:bg-[#3d3226]">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-[#8a7560] uppercase tracking-wider">
                ID Pedido
              </th>
              <th className="px-6 py-3 text-xs font-bold text-[#8a7560] uppercase tracking-wider">
                Local
              </th>
              <th className="px-6 py-3 text-xs font-bold text-[#8a7560] uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-xs font-bold text-[#8a7560] uppercase tracking-wider">
                Monto
              </th>
              <th className="px-6 py-3 text-xs font-bold text-[#8a7560] uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f5f2f0]">
            {paginatedOrders.map((order) => {
              const meta = statusMeta(order.status);
              const clickable = !!order.rawId;
              return (
                <tr
                  key={order.id}
                  className={`hover:bg-background-light dark:hover:bg-[#3d3226] transition-colors ${clickable ? 'cursor-pointer' : ''}`}
                  onClick={() => handleNavigate(order.rawId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNavigate(order.rawId);
                  }}
                  tabIndex={clickable ? 0 : -1}
                >
                  <td className="px-6 py-4 text-sm font-semibold text-primary">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-[#4b5563] dark:text-[#a3907d]">
                    {order.venue}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium dark:text-white">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-[#a3907d]">{order.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${meta.className}`}>
                      {meta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: tarjetas */}
      <div className="md:hidden divide-y divide-[#f5f2f0]">
        {paginatedOrders.map((order) => {
          const meta = statusMeta(order.status);
          const clickable = !!order.rawId;
          return (
            <div
              key={order.id}
              className={`px-6 py-4 ${clickable ? 'cursor-pointer active:scale-[0.99]' : ''}`}
              onClick={() => handleNavigate(order.rawId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNavigate(order.rawId);
              }}
              tabIndex={clickable ? 0 : -1}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-semibold text-primary">{order.id}</div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${meta.className}`}>
                  {meta.label}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-[#4b5563] dark:text-[#a3907d]">
                  <span className="font-semibold">Local: </span>
                  {order.venue}
                </div>
                <div className="dark:text-white">
                  <span className="font-semibold">Cliente: </span>
                  {order.customer}
                </div>
                <div className="dark:text-[#a3907d]">
                  <span className="font-semibold">Monto: </span>
                  {order.amount}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-[#f5f2f0]">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-semibold rounded-lg border border-[#e6e0db] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#fcfbf9] dark:hover:bg-[#3d3226]"
        >
          Anterior
        </button>
        <span className="text-sm text-[#4b5563] dark:text-[#a3907d]">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-semibold rounded-lg border border-[#e6e0db] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#fcfbf9] dark:hover:bg-[#3d3226]"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

