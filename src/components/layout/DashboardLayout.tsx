'use client';

import { useEffect, useMemo, useState } from 'react';
// import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { getCachedUser, logout } from '@/lib/auth';
import { normalizeRoleLabel } from '@/lib/constants';
import { usePathname, useRouter } from 'next/navigation';
import { useOperatingContext } from '@/lib/hooks/useOperatingContext';
import { businessService } from '@/lib/services';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const operatingContext = useOperatingContext();

  useEffect(() => {
    const user = getCachedUser();
    setUserName(user?.name);
    setUserRole(user?.role);
  }, []);

  const normalizedRole = useMemo(() => (userRole ? String(userRole).toUpperCase() : undefined), [userRole]);
  const shouldEnforceOnboarding = useMemo(() => {
    if (!normalizedRole) return true;
    if (normalizedRole === 'ADMIN') return false;
    if (normalizedRole === 'LOCAL_OPERATOR') return false;
    return true;
  }, [normalizedRole]);

  useEffect(() => {
    if (!shouldEnforceOnboarding) return;
    const businessId = operatingContext?.type === 'business' ? operatingContext.business_id : undefined;
    if (!businessId) return;
    if (!pathname) return;
    if (pathname.startsWith('/menu/onboarding')) return;

    let active = true;
    const run = async () => {
      try {
        const resp = await businessService.get(businessId);
        const data = (resp as any)?.data ?? resp;
        const status = data?.status ? String(data.status).toUpperCase() : undefined;
        if (!active) return;
        if (status === 'ONBOARDING') {
          router.replace('/menu/onboarding');
        }
      } catch {
        // silencio: si no podemos leer status, no forzamos redirect
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [shouldEnforceOnboarding, operatingContext, pathname, router]);

  const userRoleLabel = userRole ? normalizeRoleLabel(userRole, 'Usuario') : undefined;

  return (
    <div className="h-screen overflow-hidden bg-background-light dark:bg-background-dark flex">
      {/* <Sidebar isMobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /> */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <Topbar
          userName={userName}
          userRoleLabel={userRoleLabel}
          onRequestLogout={() => setConfirmLogout(true)}
        />
        <div className="flex-1 overflow-y-auto">
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

