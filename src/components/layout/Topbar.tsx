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
    events,
    loadingEvents,
    operatingContext,
    handleSelectBusiness,
    handleSelectEvent,
    handleClearEvent,
    isAdmin,
  } = useDashboardNavigation();
  const activeBusinessId =
    operatingContext?.business_id ? String(operatingContext.business_id) : '';
  const activeEventId =
    operatingContext?.type === 'event' ? operatingContext.event_id ?? '' : '';

  const TopActions = () => (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
            <span className="text-[11px] text-[#8a7560] uppercase font-semibold">{userRoleLabel}</span>
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
  );

  return (
    <header className="sticky top-0 z-20 w-full border-b border-[#f5f2f0] bg-white/95 dark:bg-[#2d2419]/95 backdrop-blur">
      <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Móvil / tablet / desktop &lt; 2xl: fila logo+acciones; debajo local+evento+nav */}
        <div className="flex flex-col gap-3 2xl:hidden">
          <div className="flex items-center justify-between gap-3 min-h-9">
            <Link
              href="/"
              className="flex items-center shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
            <TopActions />
          </div>

          <div className="flex flex-col gap-3 border-t border-[#e6e0db] pt-3 lg:flex-row lg:items-center lg:gap-3">
            {!isAdmin && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3 shrink-0">
                <div className="flex w-full flex-col gap-1 sm:w-auto sm:min-w-[11rem] sm:max-w-[14rem]">
                  <span className="text-[11px] font-semibold tracking-wide uppercase text-[#4b5563] dark:text-[#a3907d]">
                    Local
                  </span>
                  <label className="sr-only" htmlFor="topbar-business-selector">
                    Local
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

                <div className="flex w-full flex-col gap-1 sm:w-auto sm:min-w-[11rem] sm:max-w-[14rem]">
                  <span className="text-[11px] font-semibold tracking-wide uppercase text-[#4b5563] dark:text-[#a3907d]">
                    Evento
                  </span>
                  <label className="sr-only" htmlFor="topbar-event-selector">
                    Evento
                  </label>
                  <select
                    id="topbar-event-selector"
                    value={activeEventId}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) {
                        handleClearEvent();
                        return;
                      }
                      handleSelectEvent(value);
                    }}
                    disabled={loadingEvents || loadingBiz || !activeBusinessId}
                    className="h-10 w-full rounded-lg border border-[#e6e0db] bg-white px-3 text-sm text-[#181411] dark:bg-[#2d2419] dark:border-[#3d3226] dark:text-white focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">
                      {loadingEvents ? 'Cargando eventos...' : 'Sin evento'}
                    </option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="relative min-w-0 w-full flex-1">
              <nav
                className={`custom-scrollbar flex flex-nowrap gap-1.5 overflow-x-auto overscroll-x-contain scroll-smooth py-0.5 min-w-0 w-full justify-start ${
                  isAdmin ? 'w-full' : ''
                }`}
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
                      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm transition-colors ${
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
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white/95 dark:from-[#2d2419]/95 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white/95 dark:from-[#2d2419]/95 to-transparent" />
            </div>
          </div>
        </div>

        {/* 2xl+: una sola fila — logo, contexto, nav y acciones a la misma altura */}
        <div className="hidden 2xl:flex 2xl:flex-row 2xl:items-center 2xl:justify-between 2xl:gap-4 2xl:min-h-[2.5rem]">
          <div className="flex items-center gap-3 xl:gap-4 min-w-0 flex-1">
            <Link
              href="/"
              className="flex items-center shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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

            {!isAdmin && (
              <div className="flex items-end gap-2 xl:gap-3 shrink-0 border-l border-[#e6e0db] pl-3 xl:pl-4">
                <div className="flex flex-col gap-0.5 w-[min(12rem,22vw)] xl:w-52">
                  <span className="text-[10px] font-semibold tracking-wide uppercase text-[#4b5563] dark:text-[#a3907d] leading-none">
                    Local
                  </span>
                  <label className="sr-only" htmlFor="topbar-business-selector-xl">
                    Local
                  </label>
                  <select
                    id="topbar-business-selector-xl"
                    value={activeBusinessId}
                    onChange={(e) => handleSelectBusiness(e.target.value)}
                    disabled={loadingBiz}
                    className="h-9 w-full rounded-lg border border-[#e6e0db] bg-white px-2 text-sm text-[#181411] dark:bg-[#2d2419] dark:border-[#3d3226] dark:text-white focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="" disabled>
                      {loadingBiz ? 'Cargando...' : 'Local'}
                    </option>
                    {businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-0.5 w-[min(12rem,22vw)] xl:w-52">
                  <span className="text-[10px] font-semibold tracking-wide uppercase text-[#4b5563] dark:text-[#a3907d] leading-none">
                    Evento
                  </span>
                  <label className="sr-only" htmlFor="topbar-event-selector-xl">
                    Evento
                  </label>
                  <select
                    id="topbar-event-selector-xl"
                    value={activeEventId}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) {
                        handleClearEvent();
                        return;
                      }
                      handleSelectEvent(value);
                    }}
                    disabled={loadingEvents || loadingBiz || !activeBusinessId}
                    className="h-9 w-full rounded-lg border border-[#e6e0db] bg-white px-2 text-sm text-[#181411] dark:bg-[#2d2419] dark:border-[#3d3226] dark:text-white focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">
                      {loadingEvents ? '...' : 'Sin evento'}
                    </option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="relative min-w-0 w-full flex-1 border-l border-[#e6e0db] pl-3 xl:pl-4">
              <nav
                className="custom-scrollbar flex flex-nowrap gap-1 overflow-x-auto overscroll-x-contain scroll-smooth min-w-0 w-full flex-1 justify-start items-center py-0.5"
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
                      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
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
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white/95 dark:from-[#2d2419]/95 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white/95 dark:from-[#2d2419]/95 to-transparent" />
            </div>
          </div>

          <TopActions />
        </div>
      </div>
    </header>
  );
};
