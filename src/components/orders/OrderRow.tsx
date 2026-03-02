import React from 'react';

interface Order {
  id: string;
  backendId: string;
  time: string;
  venue: string;
  customer: {
    initials: string;
    name: string;
  };
  type: 'Delivery' | 'Pickup';
  status: 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total: string;
  isDelivered?: boolean;
}

interface OrderRowProps {
  order: Order;
  onViewDetails: (orderId: string) => void;
  onUpdateStatus: (orderId: string, nextStatus: string) => void;
  updating?: boolean;
}

const uiToApiStatus = (status: Order['status']): string => {
  switch (status) {
    case 'new':
      return 'CREATED';
    case 'preparing':
      return 'PREPARING';
    case 'ready':
      return 'READY';
    case 'delivered':
      return 'DELIVERED';
    case 'cancelled':
      return 'CANCELLED';
    default:
      return 'CREATED';
  }
};

const statusOptions = [
  { value: 'CREATED', label: 'Creado' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'PREPARING', label: 'Preparando' },
  { value: 'READY', label: 'Listo' },
  { value: 'DELIVERED', label: 'Entregado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

export const OrderRow: React.FC<OrderRowProps> = ({
  order,
  onViewDetails,
  onUpdateStatus,
  updating,
}) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'new':
        return 'status-new';
      case 'preparing':
        return 'status-preparing';
      case 'ready':
        return 'status-ready';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-new';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'Nuevo';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Listo';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Nuevo';
    }
  };

  const getHoverClass = (status: string) => {
    if (status === 'new') {
      return 'hover:bg-[#fef9c3]/30';
    }
    return 'hover:bg-[#f8f7f5]';
  };

  const opacityClass = order.isDelivered ? 'opacity-60' : '';

  return (
    <tr className={`${getHoverClass(order.status)} transition-colors group ${opacityClass}`}>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#181411]">#{order.id}</span>
          <span className="text-[11px] text-[#8a7560]">{order.time}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-semibold text-[#181411]">{order.venue}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
            {order.customer.initials}
          </div>
          <span className="text-sm text-[#181411]">{order.customer.name}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-[#8a7560]">
          <span className="material-symbols-outlined text-lg">
            {order.type === 'Delivery' ? 'moped' : 'shopping_bag'}
          </span>
          <span className="text-sm">{order.type === 'Delivery' ? 'Entrega' : 'Recoger'}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(
            order.status
          )} uppercase`}
        >
          {getStatusLabel(order.status)}
        </span>
      </td>
      <td className="px-6 py-4 text-sm font-bold text-[#181411]">{order.total}</td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <select
            className="border border-[#e6e0db] rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary/20"
            value={uiToApiStatus(order.status)}
            onChange={(e) => onUpdateStatus(order.backendId, e.target.value)}
            disabled={updating}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => onViewDetails(order.id)}
            className="text-primary text-sm font-bold hover:underline"
          >
            Ver Detalles
          </button>
        </div>
      </td>
    </tr>
  );
};








