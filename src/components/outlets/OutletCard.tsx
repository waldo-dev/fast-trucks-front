import React, { useState } from 'react';

interface OutletCardProps {
  outlet: {
    id: number;
    name: string;
    address: string;
    type: 'Pizzeria' | 'Food Truck' | 'Ghost Kitchen';
    status: 'active' | 'inactive';
    statusLabel: string;
    statusColor: string;
    image: string;
    todayRevenue: string;
    pendingOrders: number;
    hours?: string;
    warning?: string;
  };
  onEdit: () => void;
  onToggleStatus: () => void;
  onViewDetail?: () => void;
  onDelete?: () => void;
}

export const OutletCard: React.FC<OutletCardProps> = ({
  outlet,
  onEdit,
  onToggleStatus,
  onViewDetail,
  onDelete,
}) => {
  const typeColors = {
    Pizzeria: 'bg-primary/10 text-primary',
    'Food Truck': 'bg-orange-100 text-orange-600',
    'Ghost Kitchen': 'bg-indigo-100 text-indigo-600',
  };

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-[#e6e0db] p-5 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4 relative">
        <div className="flex gap-4">
          <div className="size-16 rounded-xl bg-primary/5 flex items-center justify-center overflow-hidden">
            <img
              className="w-full h-full object-cover"
              src={outlet.image}
              alt={outlet.name}
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#181411]">{outlet.name}</h3>
            <p className="text-sm text-[#8a7560]">{outlet.address}</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${typeColors[outlet.type]}`}
              >
                {outlet.type === 'Pizzeria'
                  ? 'Pizzería'
                  : outlet.type === 'Food Truck'
                  ? 'Food Truck'
                  : 'Cocina Fantasma'}
              </span>
              {outlet.hours && (
                <span className="text-[10px] text-[#8a7560]">• {outlet.hours}</span>
              )}
              {outlet.warning && (
                <span className={`text-[10px] font-bold ${outlet.warning.includes('Online') ? 'text-green-600' : 'text-red-500'}`}>
                  • {outlet.warning}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            className="text-[#8a7560] hover:text-primary transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-[#e6e0db] rounded-lg shadow-lg z-10">
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-primary/5 flex items-center gap-2"
                onClick={() => {
                  setMenuOpen(false);
                  onViewDetail?.();
                }}
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                Ver detalle
              </button>
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.();
                }}
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#f5f2f0] mb-4">
        <div>
          <p className="text-[10px] text-[#8a7560] uppercase font-bold tracking-widest">
            Ingresos de Hoy
          </p>
          <p
            className={`text-lg font-extrabold ${
              outlet.todayRevenue === '$0.00' ? 'text-[#8a7560]' : 'text-[#181411]'
            }`}
          >
            {outlet.todayRevenue}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#8a7560] uppercase font-bold tracking-widest">
            Pedidos Pendientes
          </p>
          <p
            className={`text-lg font-extrabold ${
              outlet.pendingOrders === 0 ? 'text-[#8a7560]' : 'text-primary'
            }`}
          >
            {outlet.pendingOrders}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              checked={outlet.status === 'active'}
              className="sr-only peer"
              type="checkbox"
              onChange={onToggleStatus}
            />
            <div className="w-11 h-6 bg-[#f5f2f0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
          <span
            className={`text-sm font-bold ${
              outlet.status === 'active' ? 'text-[#181411]' : 'text-[#8a7560]'
            }`}
          >
            {outlet.status === 'active' ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#f5f2f0] text-[#181411] text-sm font-bold hover:bg-[#e6e0db] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          Editar Local
        </button>
      </div>
    </div>
  );
};








