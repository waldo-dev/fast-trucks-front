import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  change: string;
  changeType: 'positive' | 'negative';
  borderColor: 'emerald' | 'orange' | 'blue' | 'rose';
  iconBgColor: 'emerald' | 'orange' | 'blue' | 'rose';
  compact?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  change,
  changeType,
  borderColor,
  iconBgColor,
  compact = false,
}) => {
  const borderColors = {
    emerald: 'border-emerald-500',
    orange: 'border-primary',
    blue: 'border-blue-500',
    rose: 'border-rose-500',
  };

  const iconBgColors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-primary',
    blue: 'bg-blue-50 text-blue-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  const getChangeColor = () => {
    if (changeType === 'negative') {
      return 'text-red-500 bg-red-50';
    }
    // Positive changes use the border color
    switch (borderColor) {
      case 'emerald':
        return 'text-emerald-600 bg-emerald-50';
      case 'orange':
        return 'text-primary bg-orange-50';
      case 'blue':
        return 'text-blue-600 bg-blue-50';
      case 'rose':
        return 'text-rose-600 bg-rose-50';
      default:
        return 'text-emerald-600 bg-emerald-50';
    }
  };

  const hasChange = change?.trim().length > 0;

  return (
    <div
      className={`bg-white dark:bg-[#2d2419] ${compact ? 'p-4' : 'p-6'} rounded-xl shadow-sm border-l-4 ${borderColors[borderColor]}`}
    >
      <div className={`flex justify-between items-start ${compact ? 'mb-2' : 'mb-4'}`}>
        <div className={`${compact ? 'p-1.5' : 'p-2'} rounded-lg ${iconBgColors[iconBgColor]}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {hasChange && (
        <span className={`${getChangeColor()} text-xs font-bold px-2 py-1 rounded-full`}>
          {change}
        </span>
        )}
      </div>
      <p className={`text-[#8a7560] ${compact ? 'text-xs' : 'text-sm'} font-medium mb-1`}>
        {label}
      </p>
      <h3 className={`${compact ? 'text-xl' : 'text-2xl'} font-bold dark:text-white`}>{value}</h3>
    </div>
  );
};

