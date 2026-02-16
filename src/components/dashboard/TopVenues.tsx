import React from 'react';

interface Venue {
  name: string;
  orders: string;
  revenue: string;
  icon: string;
  iconBg: 'orange' | 'blue' | 'rose' | 'emerald';
}

interface TopVenuesProps {
  venues: Venue[];
}

export const TopVenues: React.FC<TopVenuesProps> = ({ venues }) => {
  const iconBgColors = {
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    rose: 'bg-rose-100 text-rose-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  };

  return (
    <div className="bg-white dark:bg-[#2d2419] rounded-xl shadow-sm border border-[#e6e0db] overflow-hidden">
      <div className="px-6 py-5 border-b border-[#f5f2f0]">
        <h3 className="font-bold text-lg dark:text-white">Locales Destacados</h3>
      </div>
      <div className="p-6 space-y-6">
        {venues.map((venue, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className={`size-10 flex items-center justify-center ${iconBgColors[venue.iconBg]} rounded-lg`}>
              <span className="material-symbols-outlined">{venue.icon}</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold dark:text-white">{venue.name}</h4>
              <p className="text-xs text-[#8a7560]">{venue.orders}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-600">{venue.revenue}</p>
              <p className="text-[10px] text-[#8a7560]">Ingresos</p>
            </div>
          </div>
        ))}
        <button className="w-full py-2.5 mt-2 bg-[#f5f2f0] dark:bg-[#3d3226] text-[#4b5563] dark:text-[#a3907d] text-sm font-bold rounded-lg hover:bg-[#ebe8e5] transition-colors">
          Reporte de Análisis
        </button>
      </div>
    </div>
  );
};

