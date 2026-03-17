'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { APP_NAME } from '@/lib/constants';
import { useDashboardNavigation } from './useDashboardNavigation';

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isMobileOpen = false, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const {
    sidebarItems,
    businesses,
    loadingBiz,
    needsBusinessSelection,
    operatingContext,
    handleSelectBusiness,
    isAdmin,
    isOperator,
  } = useDashboardNavigation();

  return (
    <>
      {!isAdmin && needsBusinessSelection && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#181411] dark:text-white">Selecciona un negocio</h3>
              <p className="text-sm text-[#8a7560] dark:text-[#a3907d]">
                Necesitamos un negocio activo para aplicar el plan y las restricciones.
              </p>
            </div>
            <div className="space-y-2">
              <select
                className="w-full h-11 rounded-lg border border-[#e6e0db] bg-white dark:bg-[#2d2419] dark:border-[#3d3226] px-3 text-sm"
                value={
                  operatingContext?.type === 'business' ? operatingContext.business_id : ''
                }
                onChange={(e) => handleSelectBusiness(e.target.value)}
                disabled={loadingBiz}
              >
                <option value="" disabled>
                  {loadingBiz ? 'Cargando...' : 'Selecciona un negocio'}
                </option>
                {!loadingBiz && businesses.length === 0 && <option>No hay negocios</option>}
                {!loadingBiz &&
                  businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>
            <p className="text-xs text-[#8a7560]">
              Podrás cambiar de negocio luego desde el selector del sidebar.
            </p>
          </div>
        </div>
      )}
      <div
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-200 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } w-72 lg:w-64 flex-shrink-0 border-r border-[#e6e0db] bg-white dark:bg-[#2d2419] h-screen max-h-screen min-h-0 lg:min-h-screen flex flex-col`}
      >
        <div className="p-6 flex flex-col gap-3 border-b border-[#f5f2f0]">
          <div className="flex items-center">
            <Image
              src="/Logo-operfoods-1.svg"
              alt={APP_NAME}
              width={160}
              height={48}
              priority
              className="h-10 w-auto"
            />
          </div>
          <p className="text-[#8a7560] dark:text-[#a3907d] text-xs font-medium">
            {isAdmin ? 'Panel Admin Global' : isOperator ? 'Punto de Venta' : 'Panel Administrador'}
          </p>
          {!isAdmin && (
            <div className="flex flex-col gap-1 text-xs text-[#4b5563] dark:text-[#a3907d]">
              <span className="font-semibold text-[#181411] dark:text-white">Negocio activo</span>
              <select
                value={
                  operatingContext?.type === 'business' ? operatingContext.business_id : ''
                }
                onChange={(e) => handleSelectBusiness(e.target.value, onClose)}
                className="h-9 rounded-lg border border-[#e6e0db] bg-white dark:bg-[#2d2419] dark:border-[#3d3226] px-2 text-sm"
                disabled={loadingBiz}
              >
                {loadingBiz && <option>Cargando...</option>}
                {!loadingBiz && businesses.length === 0 && <option>No hay negocios</option>}
                {!loadingBiz &&
                  businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 flex flex-col gap-2">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-[#4b5563] dark:text-[#a3907d] hover:bg-[#f5f2f0]'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>

      </aside>
    </>
  );
};

