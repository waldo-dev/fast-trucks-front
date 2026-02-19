import React from 'react';
import { OrderRow } from './OrderRow';

interface Order {
  id: string;
  time: string;
  venue: string;
  customer: {
    initials: string;
    name: string;
  };
  type: 'Delivery' | 'Pickup';
  status: 'new' | 'preparing' | 'ready' | 'delivered';
  total: string;
  isDelivered?: boolean;
}

interface OrderTableProps {
  orders: Order[];
  onViewDetails: (orderId: string) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({ orders, onViewDetails }) => {
  return (
    <div className="overflow-x-auto rounded-b-2xl border border-[#e6e0db] bg-white shadow-sm">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-[#f8f7f5] border-b border-[#e6e0db]">
            <th className="px-6 py-4 text-xs font-bold text-[#8a7560] uppercase tracking-wider">
              ID Pedido
            </th>
            <th className="px-6 py-4 text-xs font-bold text-[#8a7560] uppercase tracking-wider">
              Local
            </th>
            <th className="px-6 py-4 text-xs font-bold text-[#8a7560] uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-4 text-xs font-bold text-[#8a7560] uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-6 py-4 text-xs font-bold text-[#8a7560] uppercase tracking-wider text-center">
              Estado
            </th>
            <th className="px-6 py-4 text-xs font-bold text-[#8a7560] uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-4 text-xs font-bold text-[#8a7560] uppercase tracking-wider text-right">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e6e0db]">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} onViewDetails={onViewDetails} />
          ))}
        </tbody>
      </table>
    </div>
  );
};





