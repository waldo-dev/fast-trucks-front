import React from 'react';

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
  recentOrders?: Array<{
    id: string;
    items: string;
    total: string;
    time: string;
  }>;
  favoriteItem?: string;
}

interface CustomerDetailProps {
  customer: Customer;
  onViewProfile: (id: number) => void;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({
  customer,
  onViewProfile,
}) => {
  return (
    <tr className="bg-primary/[0.02]">
      <td className="px-6 py-6 border-b border-primary/5" colSpan={6}>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#8a7560] mb-4">
              Historial de Pedidos Recientes
            </h4>
            <div className="space-y-3">
              {customer.recentOrders?.map((order, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-primary/5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">local_pizza</span>
                    <div>
                      <p className="text-sm font-bold">{order.items}</p>
                      <p className="text-xs text-[#8a7560]">
                        Pedido #{order.id} • {order.total}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#8a7560]">{order.time}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full md:w-64 flex flex-col gap-4">
            {customer.favoriteItem && (
              <div className="p-4 bg-white rounded-lg border border-primary/5 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#8a7560] mb-2">
                  Producto Favorito
                </h4>
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded bg-orange-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-orange-600 text-sm">star</span>
                  </div>
                  <p className="text-sm font-bold">{customer.favoriteItem}</p>
                </div>
              </div>
            )}
            <button
              onClick={() => onViewProfile(customer.id)}
              className="w-full h-10 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors"
            >
              Ver Perfil Completo
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};



