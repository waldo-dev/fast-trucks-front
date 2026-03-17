import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SIDEBAR_ITEMS,
  ADMIN_SIDEBAR_ITEMS,
  ADMIN_USERS_SIDEBAR_ITEM,
  INVENTORY_SIDEBAR_ITEM,
  OPERATOR_SIDEBAR_ITEMS,
  USERS_SIDEBAR_ITEM,
  OWNER_ROLES,
} from '@/lib/constants';
import { getCachedUser, getCurrentUser } from '@/lib/auth';
import { hasFeature, normalizeTier } from '@/lib/planAccess';
import { readOperatingContext, writeOperatingContext } from '@/lib/operatingContext';
import { businessService, subscriptionService } from '@/lib/services';

type OperatingContext =
  | { type: 'event'; event_id?: string; event_name?: string; business_id?: string }
  | { type: 'business'; business_id?: string }
  | null;

const featureByHref: Record<string, Parameters<typeof hasFeature>[0]> = {
  '/inventory': 'inventory_basic',
  '/products': 'inventory_basic',
  '/customers': 'crm',
  '/orders': 'reports',
  '/pos/historial': 'reports',
  '/outlets': 'multi_registers',
  '/events/analytics': 'reports',
};

const OWNER_ORDERED_HREFS = [
  '/', // Inicio
  '/profile',
  '/pos',
  '/pos/pedidos-activos',
  '/pos/historial',
  '/pos/cierre-caja',
  '/pos/cambiar-evento',
  '/orders',
  '/customers',
  '/products',
  '/promotions',
  '/events',
  '/events/analytics',
  '/outlets',
  '/mailing',
  '/inventory',
  '/users',
];

type SidebarItem = { title: string; href: string; icon: string };

interface UseDashboardNavigationResult {
  sidebarItems: SidebarItem[];
  businesses: Array<{ id: string; name: string; tier?: string }>;
  loadingBiz: boolean;
  needsBusinessSelection: boolean;
  operatingContext: OperatingContext;
  handleSelectBusiness: (id: string, onClose?: () => void) => Promise<void>;
  isAdmin: boolean;
  isOperator: boolean;
  isOwner: boolean;
}

export const useDashboardNavigation = (): UseDashboardNavigationResult => {
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

  const handleSelectBusiness = async (id: string, onClose?: () => void) => {
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
    router.refresh();
  };

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

  const contextAwareOperatorItems = useMemo(() => {
    return OPERATOR_SIDEBAR_ITEMS.map((item) => {
      if (item.href !== '/pos/cambiar-evento') return item;
      const title = operatingContext?.type === 'event' ? 'Cambiar Local' : 'Cambiar Evento';
      return { ...item, title };
    });
  }, [operatingContext]);

  const resolveOwnerItems = useMemo(() => {
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
      if (!tierFromCtx && feature) {
        return item;
      }
      const effectiveTier = tierFromCtx || 'BASIC';
      if (feature && !hasFeature(feature, effectiveTier as any)) return undefined;
      return item;
    };

    const seen = new Set<string>();
    return OWNER_ORDERED_HREFS.reduce<SidebarItem[]>((acc, href) => {
      const item = byHref(href);
      if (!item || seen.has(href)) return acc;
      seen.add(href);
      acc.push(item);
      return acc;
    }, []);
  }, [contextAwareOperatorItems, operatingContext]);

  const sidebarItems = useMemo<SidebarItem[]>(() => {
    if (isAdmin) return [...ADMIN_SIDEBAR_ITEMS, ADMIN_USERS_SIDEBAR_ITEM];
    if (isOperator) return contextAwareOperatorItems;
    if (isOwner) return resolveOwnerItems;
    return [...SIDEBAR_ITEMS];
  }, [isAdmin, isOperator, isOwner, contextAwareOperatorItems, resolveOwnerItems]);

  return {
    sidebarItems,
    businesses,
    loadingBiz,
    needsBusinessSelection,
    operatingContext,
    handleSelectBusiness,
    isAdmin,
    isOperator,
    isOwner,
  };
};
