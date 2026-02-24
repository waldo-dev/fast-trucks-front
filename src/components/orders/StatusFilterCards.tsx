import React from 'react';

interface StatusFilter {
  label: string;
  count: number;
  color: string;
  isActive?: boolean;
  change?: string;
  onClick: () => void;
}

interface StatusFilterCardsProps {
  filters: StatusFilter[];
}

export const StatusFilterCards: React.FC<StatusFilterCardsProps> = ({ filters }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {filters.map((filter, index) => (
        <button
          key={index}
          onClick={filter.onClick}
          className={`flex flex-col items-start p-4 bg-white rounded-2xl shadow-sm transition-all ${
            filter.isActive
              ? 'border-2 border-primary'
              : 'border border-[#e6e0db] hover:border-primary/50'
          }`}
        >
          {index === 0 ? (
            <>
              <span className="text-[#8a7560] text-xs font-bold uppercase tracking-widest mb-1">
                {filter.label}
              </span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-[#181411]">{filter.count}</span>
                {filter.change && (
                  <span className="text-xs text-green-600 font-bold mb-1">{filter.change}</span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className={`size-2 rounded-full ${filter.color}`}></span>
                <span className="text-[#8a7560] text-xs font-bold uppercase tracking-widest">
                  {filter.label}
                </span>
              </div>
              <span
                className={`text-3xl font-black transition-colors ${
                  filter.isActive ? 'text-primary' : 'text-[#181411]'
                }`}
              >
                {filter.count}
              </span>
            </>
          )}
        </button>
      ))}
    </div>
  );
};








