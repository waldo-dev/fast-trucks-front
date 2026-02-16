'use client';

import React, { useState } from 'react';

interface Tab {
  label: string;
  count: number;
  id: string;
}

interface OutletTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const OutletTabs: React.FC<OutletTabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="mb-6 border-b border-[#e6e0db]">
      <div className="flex gap-8 overflow-x-auto custom-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 pb-4 font-bold px-1 border-b-2 transition-colors ${
                isActive
                  ? 'text-primary border-primary'
                  : 'text-[#8a7560] border-transparent hover:text-primary'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-[#f5f2f0] text-[#8a7560]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};


