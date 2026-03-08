'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow || '';
    }
    return () => {
      document.body.style.overflow = originalOverflow || '';
    };
  }, [sidebarOpen]);

  return (
    <div className="h-screen overflow-hidden bg-background-light dark:bg-background-dark flex">
      <Sidebar isMobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <button
          className="fixed top-4 left-4 z-40 lg:hidden p-3 rounded-xl bg-white/90 shadow-lg shadow-black/5 border border-[#e6e0db] text-[#181411] hover:bg-white transition-colors"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menú lateral"
          aria-expanded={sidebarOpen}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className={`flex-1 overflow-y-auto ${sidebarOpen ? 'pointer-events-none' : ''}`}>
          <div className="px-6 sm:px-8 lg:px-10 py-6 lg:py-10 space-y-8 w-full h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

