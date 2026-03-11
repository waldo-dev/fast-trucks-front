'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  SIDEBAR_ITEMS,
  ADMIN_SIDEBAR_ITEMS,
  OPERATOR_SIDEBAR_ITEMS,
  USERS_SIDEBAR_ITEM,
  ADMIN_USERS_SIDEBAR_ITEM,
  INVENTORY_SIDEBAR_ITEM,
  OWNER_ROLES,
  APP_NAME,
} from '@/lib/constants';
import { getCurrentUser, getCachedUser, logout } from '@/lib/auth';
import { hasFeature, normalizeTier } from '@/lib/planAccess';
import { readOperatingContext, writeOperatingContext } from '@/lib/operatingContext';
import { businessService, subscriptionService } from '@/lib/services';

type OperatingContext =
  | { type: 'event'; event_id?: string; event_name?: string; business_id?: string }
  | { type: 'business'; business_id?: string }
  | null;

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isMobileOpen = false, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<Awaited<ReturnType<typeof getCurrentUser>>>(getCachedUser());
  const [operatingContext, setOperatingContext] = useState<OperatingContext>(() => readOperatingContext());
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string; tier?: string }>>([]);
  const [loadingBiz, setLoadingBiz] = useState(false);
  const role = user?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isOperator = role === 'LOCAL_OPERATOR';
  const isOwner = role ? OWNER_ROLES.includes(role as (typeof OWNER_ROLES)[number]) : false;
  const needsBusinessSelection = !isAdmin && !operatingContext?.business_id;

  const roleLabel = (value?: string) => {
    const upper = (value || '').toUpperCase();
    if (upper === 'ADMIN') return 'Admin';
    if (OWNER_ROLES.includes(upper as (typeof OWNER_ROLES)[number])) return 'Dueño de negocio';
    if (upper === 'LOCAL_OPERATOR') return 'Operador de local';
    return value || 'Administrador';
  };

  useEffect(() => {
    setOperatingContext(readOperatingContext());
  }, []);

  useEffect(() => {
    const loadBiz = async () => {
      setLoadingBiz(true);
      try {
        const resp = await businessService.list();
        const list = (resp as any)?.data ?? resp;
        if (Array.isArray(list)) {
          setBusinesses(
            list.map((b: any) => ({
              id: String(b.id),
              name: b.name || b.brand_name || `Negocio ${b.id}`,
            }))
          );
        }
      } catch {
        // silencio
      } finally {
        setLoadingBiz(false);
      }
    };
    loadBiz();
  }, [operatingContext]);

  const handleSelectBusiness = async (id: string) => {
    const selected = businesses.find((b) => b.id === id);
    const ctx: OperatingContext = {
      type: 'business',
      business_id: id,
    };
    if ((operatingContext as any)?.planTier) {
      (ctx as any).planTier = (operatingContext as any).planTier;
    }
    if (selected?.name) {
      (ctx as any).business_name = selected.name;
    }
    // Buscar suscripción activa para tier
    try {
      const resp = await subscriptionService.list({ business_id: id, status: 'ACTIVE' } as any);
      const data = (resp as any)?.data ?? resp;
      const sub = Array.isArray(data) ? data[0] : null;
      const tier = normalizeTier(sub?.plan?.name ?? sub?.plan_id);
      if (tier) (ctx as any).planTier = tier;
    } catch {
      // silencio
    }
    setOperatingContext(ctx);
    writeOperatingContext(ctx);
    onClose?.();
  };

  // Refrescar tier si hay contexto sin tier (ej. cacheado sin plan)
  useEffect(() => {
    if (!operatingContext || operatingContext.type !== 'business' || (operatingContext as any).planTier) return;
    if (!operatingContext.business_id) return;
    handleSelectBusiness(operatingContext.business_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operatingContext?.business_id]);

  const contextAwareOperatorItems = OPERATOR_SIDEBAR_ITEMS.map((item) => {
    if (item.href !== '/pos/cambiar-evento') return item;
    const title = operatingContext?.type === 'event' ? 'Cambiar Local' : 'Cambiar Evento';
    return { ...item, title };
  });

  type SidebarItem = { title: string; href: string; icon: string };

  const resolveOwnerItems = (): SidebarItem[] => {
    const featureByHref: Record<string, Parameters<typeof hasFeature>[0]> = {
      '/inventory': 'inventory_basic',
      '/products': 'inventory_basic',
      '/customers': 'crm',
      '/orders': 'reports',
      '/pos/historial': 'reports',
      '/outlets': 'multi_registers',
      '/events/analytics': 'reports',
      // '/mailing': 'crm', // no se limita de momento
    };

    const byHref = (href: string): SidebarItem | undefined => {
      const item = [
        ...contextAwareOperatorItems,
        ...SIDEBAR_ITEMS,
        USERS_SIDEBAR_ITEM,
        INVENTORY_SIDEBAR_ITEM,
      ].find((i) => i.href === href);

      if (!item) return undefined;
      const feature = featureByHref[href];
      const tierFromCtx = (operatingContext as any)?.planTier;
      // Si aún no conocemos el plan (p.ej. al primer login sin contexto), no filtramos.
      if (!tierFromCtx && feature) {
        return item;
      }
      const effectiveTier = tierFromCtx || 'BASIC';
      if (feature && !hasFeature(feature, effectiveTier as any)) return undefined;
      return item;
    };

    const orderedHrefs = [
      '/', // Inicio
      '/pos',
      '/pos/pedidos-activos',
      '/pos/historial',
      '/pos/cierre-caja',
      '/pos/cambiar-evento',
      '/orders',
      '/customers',
      '/products',
      '/promotions',
      '/payments',
      '/events',
      '/events/analytics',
      '/outlets',
      '/mailing',
      '/inventory',
      '/users',
    ];

    const seen = new Set<string>();
    const ordered = orderedHrefs.reduce<SidebarItem[]>((acc, href) => {
      const item = byHref(href);
      if (!item || seen.has(href)) return acc;
      seen.add(href);
      acc.push(item);
      return acc;
    }, []);

    return ordered;
  };

  const sidebarItems = isAdmin
    ? [...ADMIN_SIDEBAR_ITEMS, ADMIN_USERS_SIDEBAR_ITEM]
    : isOperator
    ? contextAwareOperatorItems
    : isOwner
    ? resolveOwnerItems()
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
        } w-72 lg:w-64 flex-shrink-0 border-r border-[#e6e0db] bg-white dark:bg-[#2d2419] h-screen lg:min-h-screen flex flex-col`}
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
                onChange={(e) => handleSelectBusiness(e.target.value)}
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

      </aside>
    </>
  );
};

