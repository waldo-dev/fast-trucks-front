'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { getCachedUser, logout } from '@/lib/auth';
import { normalizeRoleLabel } from '@/lib/constants';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const router = useRouter();

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

  useEffect(() => {
    const user = getCachedUser();
    setUserName(user?.name);
    setUserRole(user?.role);
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-background-light dark:bg-background-dark flex">
      <Sidebar isMobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <header className="px-6 sm:px-8 lg:px-10 py-4 flex items-center gap-4 border-b border-[#f1ebe6] dark:border-[#3d3226] bg-white/80 dark:bg-[#2d2419]/90 backdrop-blur">
          <button
            className="lg:hidden p-3 rounded-xl bg-white shadow-sm shadow-black/5 border border-[#e6e0db] text-[#181411] hover:bg-white transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú lateral"
            aria-expanded={sidebarOpen}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex-1" />
          {userName && (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end leading-tight">
                <span className="text-sm font-semibold text-[#181411] dark:text-white">
                  {userName}
                </span>
                {userRole && (
                  <span className="text-[11px] text-[#8a7560] uppercase font-semibold">
                    {normalizeRoleLabel(userRole, 'Usuario')}
                  </span>
                )}
              </div>
              <button
                onClick={() => setConfirmLogout(true)}
                className="p-2 rounded-lg hover:bg-primary/10 text-[#8a7560] transition-colors"
                aria-label="Cerrar sesión"
              >
                <span className="material-symbols-outlined text-base">logout</span>
              </button>
            </div>
          )}
        </header>
        <div className={`flex-1 overflow-y-auto ${sidebarOpen ? 'pointer-events-none' : ''}`}>
          <div className="px-6 sm:px-8 lg:px-10 py-6 lg:py-10 space-y-8 w-full h-full">
            {children}
          </div>
        </div>
        {confirmLogout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#181411] dark:text-white">Cerrar sesión</h3>
                <p className="text-sm text-[#8a7560]">
                  ¿Seguro que quieres cerrar sesión?
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="px-4 h-10 rounded-xl border border-[#e6e0db] text-[#5d4b3f] hover:bg-[#f7f3ef] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    logout();
                    router.replace('/login');
                  }}
                  className="px-4 h-10 rounded-xl bg-primary text-white hover:brightness-95 transition-colors"
                >
                  Sí, salir
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

