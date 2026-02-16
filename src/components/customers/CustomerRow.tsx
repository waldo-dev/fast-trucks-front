import React from 'react';
import { CustomerDetail } from './CustomerDetail';

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

interface CustomerRowProps {
  customer: Customer;
  onToggleExpand: (id: number) => void;
  onViewProfile: (id: number) => void;
}

export const CustomerRow: React.FC<CustomerRowProps> = ({
  customer,
  onToggleExpand,
  onViewProfile,
}) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'VIP':
        return 'bg-green-100 text-green-700';
      case 'Active':
        return 'bg-blue-50 text-blue-600';
      case 'New':
        return 'bg-[#f5f2f0] text-[#8a7560]';
      default:
        return 'bg-[#f5f2f0] text-[#8a7560]';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'VIP':
        return 'VIP';
      case 'Active':
        return 'Activo';
      case 'New':
        return 'Nuevo';
      default:
        return 'Activo';
    }
  };

  const rowClass = customer.isExpanded
    ? 'bg-primary/5 border-l-4 border-primary'
    : 'hover:bg-primary/5 transition-colors group cursor-pointer';

  return (
    <>
      <tr className={rowClass} onClick={() => onToggleExpand(customer.id)}>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`size-10 rounded-full bg-gradient-to-br ${customer.avatarColor} flex items-center justify-center font-bold border-2 border-white shadow-sm`}
            >
              {customer.initials}
            </div>
            <div>
              <p className="text-[#181411] font-bold text-sm">{customer.name}</p>
              <p className="text-[#8a7560] text-xs">{customer.email}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-[#181411] text-sm">{customer.phone}</td>
        <td className="px-6 py-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
            {customer.totalOrders} pedidos
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <span
              className={`text-sm font-medium ${
                customer.lastOrder.isToday ? 'text-primary font-bold' : 'text-[#181411]'
              }`}
            >
              {customer.lastOrder.time}
            </span>
            <span className="text-[#8a7560] text-xs">{customer.lastOrder.venue}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <span
            className={`px-2 py-1 rounded text-[10px] font-black uppercase ${getStatusClass(
              customer.status
            )}`}
          >
            {getStatusLabel(customer.status)}
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <button
            className={customer.isExpanded ? 'text-primary' : 'text-[#8a7560] hover:text-primary'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(customer.id);
            }}
          >
            <span className="material-symbols-outlined">
              {customer.isExpanded ? 'expand_less' : 'more_horiz'}
            </span>
          </button>
        </td>
      </tr>
      {customer.isExpanded && (
        <CustomerDetail customer={customer} onViewProfile={onViewProfile} />
      )}
    </>
  );
};


