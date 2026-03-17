'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useDashboardNavigation } from './useDashboardNavigation';
import { APP_NAME } from '@/lib/constants';

interface TopbarProps {
  userName?: string;
  userRoleLabel?: string;
  onRequestLogout?: () => void;
}

export const Topbar = ({ userName, userRoleLabel, onRequestLogout }: TopbarProps) => {
  const pathname = usePathname();
  const {
    sidebarItems,
    businesses,
    loadingBiz,
    operatingContext,
    handleSelectBusiness,
    isAdmin,
  } = useDashboardNavigation();
  const activeBusinessId =
    operatingContext?.type === 'business' ? operatingContext.business_id ?? '' : '';

  return (
    <header className="sticky top-0 z-20 w-full border-b border-[#f5f2f0] bg-white/95 dark:bg-[#2d2419]/95 backdrop-blur">
      <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Image
                src="/Logo-operfoods-1.svg"
                alt={APP_NAME}
                width={140}
                height={40}
                className="h-9 w-auto"
                priority
              />
              <span className="sr-only">{APP_NAME}</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/*<button className="hidden sm:inline-flex p-2 rounded-lg bg-[#f5f2f0] text-[#4b5563] relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>*/}
            {/*<button className="hidden sm:inline-flex p-2 rounded-lg bg-[#f5f2f0] text-[#4b5563]">
              <span className="material-symbols-outlined">settings</span>
            </button>*/}
            <Link
              href="/pos"
              className="bg-primary text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Nuevo Pedido
            </Link>
            {userName && (
              <div className="hidden sm:flex flex-col items-end leading-tight text-right text-xs">
                <span className="text-sm font-semibold text-[#181411] dark:text-white">{userName}</span>
                {userRoleLabel && (
                  <span className="text-[11px] text-[#8a7560] uppercase font-semibold">
                    {userRoleLabel}
                  </span>
                )}
              </div>
            )}
            {onRequestLogout && (
              <button
                onClick={onRequestLogout}
                className="p-2 rounded-lg hover:bg-primary/10 text-[#8a7560] transition-colors"
                aria-label="Cerrar sesión"
              >
                <span className="material-symbols-outlined text-base">logout</span>
              </button>
            )}
          </div>
        </div>

        {!isAdmin && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-full sm:w-72">
              <span className="text-[11px] font-semibold tracking-wide uppercase text-[#4b5563] dark:text-[#a3907d]">
                Local activo
              </span>
              <label className="sr-only" htmlFor="topbar-business-selector">
                Local activo
              </label>
              <select
                id="topbar-business-selector"
                value={activeBusinessId}
                onChange={(e) => handleSelectBusiness(e.target.value)}
                disabled={loadingBiz}
                className="h-10 w-full rounded-lg border border-[#e6e0db] bg-white px-3 text-sm text-[#181411] dark:bg-[#2d2419] dark:border-[#3d3226] dark:text-white focus:ring-2 focus:ring-primary/50"
              >
                <option value="" disabled>
                  {loadingBiz ? 'Cargando locales...' : 'Selecciona un local'}
                </option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <nav
          className="mt-3 flex flex-nowrap gap-2 overflow-x-auto border-t border-[#e6e0db] px-1 pt-3 lg:flex-wrap"
          aria-label="Navegación del dashboard"
        >
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-[#4b5563] dark:text-[#a3907d] hover:bg-[#f5f2f0]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
