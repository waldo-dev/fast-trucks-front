import React from 'react';

interface Stat {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  badge?: {
    text: string;
    color: string;
    bgColor: string;
  };
}

interface StatsOverviewProps {
  stats: Stat[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  return (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-2xl border border-[#e6e0db] shadow-sm"
        >
          <div className="flex justify-between items-center mb-4">
            <div className={`size-10 rounded-xl ${stat.iconBg} flex items-center justify-center ${stat.iconColor}`}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            {stat.badge && (
              <span className={`text-xs font-bold ${stat.badge.color} ${stat.badge.bgColor} px-2 py-1 rounded-lg`}>
                {stat.badge.text}
              </span>
            )}
          </div>
          <p className="text-[#8a7560] text-sm font-bold uppercase tracking-wider">{stat.label}</p>
          <p className="text-2xl font-black text-[#181411] mt-1">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};


