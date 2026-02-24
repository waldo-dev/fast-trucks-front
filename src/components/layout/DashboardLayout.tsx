'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-background-light dark:bg-background-dark flex">
      <Sidebar isMobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar onToggleSidebar={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8 max-w-7xl w-full mx-auto">
          {children}
          </div>
        </div>
      </main>
    </div>
  );
};

