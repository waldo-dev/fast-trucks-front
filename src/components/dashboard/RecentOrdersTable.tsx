import React from 'react';
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
  id: string;
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

  return (
    <div className="xl:col-span-2 bg-white dark:bg-[#2d2419] rounded-xl shadow-sm border border-[#e6e0db] overflow-hidden">
      <div className="px-6 py-5 border-b border-[#f5f2f0] flex justify-between items-center">
        <h3 className="font-bold text-lg dark:text-white">Pedidos Recientes</h3>
        <Link href="/orders" className="text-primary text-sm font-semibold hover:underline">
          Ver Todos
        </Link>
      </div>
      <div className="overflow-x-auto">
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
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-background-light dark:hover:bg-[#3d3226] transition-colors"
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
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full ${
                      statusMeta(order.status).className
                    }`}
                  >
                    {statusMeta(order.status).label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

