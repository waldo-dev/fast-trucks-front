'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  SIDEBAR_ITEMS,
  ADMIN_SIDEBAR_ITEMS,
  OPERATOR_SIDEBAR_ITEMS,
  USERS_SIDEBAR_ITEM,
  ADMIN_USERS_SIDEBAR_ITEM,
  OWNER_ROLES,
  APP_NAME,
} from '@/lib/constants';
import { getCurrentUser, getCachedUser, logout } from '@/lib/auth';

type OperatingContext =
  | { type: 'event'; event_id?: string; event_name?: string; business_id?: string }
  | { type: 'business'; business_id?: string }
  | null;

const readOperatingContext = (): OperatingContext => {
  if (typeof window === 'undefined') return null;
  const raw =
    localStorage.getItem('business_operating_context') ??
    sessionStorage.getItem('business_operating_context');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OperatingContext;
  } catch {
    return null;
  }
};

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isMobileOpen = false, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<Awaited<ReturnType<typeof getCurrentUser>>>(getCachedUser());
  const [operatingContext, setOperatingContext] = useState<OperatingContext>(null);
  const role = user?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isOperator = role === 'LOCAL_OPERATOR';
  const isOwner = role ? OWNER_ROLES.includes(role as (typeof OWNER_ROLES)[number]) : false;

  useEffect(() => {
    setOperatingContext(readOperatingContext());
  }, []);

  const contextAwareOperatorItems = OPERATOR_SIDEBAR_ITEMS.map((item) =>
    item.href === '/pos/cambiar-evento' && operatingContext?.type === 'event'
      ? { ...item, title: 'Cambiar Local' }
      : item
  );

  const sidebarItems = isAdmin
    ? [...ADMIN_SIDEBAR_ITEMS, ADMIN_USERS_SIDEBAR_ITEM]
    : isOperator
    ? contextAwareOperatorItems
    : isOwner
    ? [...contextAwareOperatorItems, ...SIDEBAR_ITEMS, USERS_SIDEBAR_ITEM]
    : SIDEBAR_ITEMS;

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((data) => {
        if (active) setUser(data || getCachedUser());
      })
      .catch(() => {
        if (active) setUser(getCachedUser());
      });
    return () => {
      active = false;
    };
  }, []);

  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[Sidebar] role debug', {
      cached: getCachedUser(),
      stateUser: user,
      role,
      isAdmin,
      pathname,
    });
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-200 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } w-72 lg:w-64 flex-shrink-0 border-r border-[#e6e0db] bg-white dark:bg-[#2d2419] h-screen lg:min-h-screen flex flex-col`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-[#f5f2f0]">
          <div className="bg-primary flex items-center justify-center rounded-lg size-10 text-white">
            <span className="material-symbols-outlined">fastfood</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <h1 className="text-[#181411] dark:text-white text-base font-bold leading-tight truncate">
              {APP_NAME}
            </h1>
            <p className="text-[#8a7560] dark:text-[#a3907d] text-xs font-normal">
              {isAdmin ? 'Panel Admin Global' : isOperator ? 'Terminal POS' : 'Panel Administrador'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg hover:bg-primary/10 text-[#8a7560] transition-colors relative"
              aria-label="Alertas"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button
              className="p-2 rounded-lg hover:bg-primary/10 text-[#8a7560] transition-colors"
              aria-label="Configuración"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-primary/10 text-[#8a7560] transition-colors"
              onClick={onClose}
              aria-label="Cerrar menú"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
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

        <div className="p-4 border-t border-[#f5f2f0]">
          <div className="flex items-center justify-between gap-3 p-2">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full border border-[#e6e0db] bg-orange-100 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold dark:text-white">
                  {user?.name || 'Admin'}
                </span>
                <span className="text-xs text-[#8a7560]">
                  {role || 'Administrador'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                router.replace('/login');
              }}
              className="p-2 rounded-lg hover:bg-primary/10 text-[#8a7560] transition-colors"
              aria-label="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-base">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

