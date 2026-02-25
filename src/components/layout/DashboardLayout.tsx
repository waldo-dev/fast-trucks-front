'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-background-light dark:bg-background-dark flex">
      <Sidebar isMobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <button
          className="fixed top-4 left-4 z-30 lg:hidden p-2 rounded-lg bg-[#f5f2f0] text-[#4b5563] hover:bg-[#ebe8e5] transition-colors shadow-sm"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menú lateral"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 sm:px-8 lg:px-10 py-6 lg:py-10 space-y-8 w-full h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

