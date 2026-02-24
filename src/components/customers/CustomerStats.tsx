import React from 'react';

interface Stat {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  change?: string;
  changeColor?: string;
  changeBg?: string;
}

interface CustomerStatsProps {
  stats: Stat[];
}

export const CustomerStats: React.FC<CustomerStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-6 border border-primary/10 shadow-sm flex items-center gap-4"
        >
          <div className={`size-12 rounded-lg ${stat.iconBg} flex items-center justify-center ${stat.iconColor}`}>
            <span className="material-symbols-outlined">{stat.icon}</span>
          </div>
          <div>
            <p className="text-[#8a7560] text-sm font-medium">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[#181411] text-2xl font-bold">{stat.value}</span>
              {stat.change && (
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded ${stat.changeBg} ${stat.changeColor}`}
                >
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};








