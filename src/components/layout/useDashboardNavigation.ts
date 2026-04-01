import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SIDEBAR_ITEMS,
  ADMIN_SIDEBAR_ITEMS,
  ADMIN_USERS_SIDEBAR_ITEM,
  OPERATOR_SIDEBAR_ITEMS,
  USERS_SIDEBAR_ITEM,
  OWNER_ROLES,
} from '@/lib/constants';
import { getCachedUser, getCurrentUser } from '@/lib/auth';
import { hasFeature, normalizeTier } from '@/lib/planAccess';
import { readOperatingContext, watchOperatingContext, writeOperatingContext } from '@/lib/operatingContext';
import { businessService, eventService, subscriptionService } from '@/lib/services';

type OperatingContext =
  | { type: 'event'; event_id?: string; event_name?: string; business_id?: string }
  | { type: 'business'; business_id?: string }
  | null;

const featureByHref: Record<string, Parameters<typeof hasFeature>[0]> = {
  '/customers': 'crm',
  '/orders': 'reports',
  '/outlets': 'multi_registers',
  '/events/analytics': 'reports',
};

type SidebarItem = { title: string; href: string; icon: string };
type UiEvent = { id: string; name: string; businessId?: string };

interface UseDashboardNavigationResult {
  sidebarItems: SidebarItem[];
  businesses: Array<{ id: string; name: string; tier?: string; status?: string }>;
  events: UiEvent[];
  loadingEvents: boolean;
  loadingBiz: boolean;
  needsBusinessSelection: boolean;
  operatingContext: OperatingContext;
  handleSelectBusiness: (id: string, onClose?: () => void) => Promise<void>;
  handleSelectEvent: (eventId: string, onClose?: () => void) => Promise<void>;
  handleClearEvent: (onClose?: () => void) => void;
  isAdmin: boolean;
  isOperator: boolean;
  isOwner: boolean;
}

export const useDashboardNavigation = (): UseDashboardNavigationResult => {
  const router = useRouter();
  const [user, setUser] = useState<Awaited<ReturnType<typeof getCurrentUser>>>(getCachedUser());
  const [operatingContext, setOperatingContext] = useState<OperatingContext>(() => readOperatingContext());
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string; tier?: string; status?: string }>>([]);
  const [loadingBiz, setLoadingBiz] = useState(false);
  const [events, setEvents] = useState<UiEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const role = user?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isOperator = role === 'LOCAL_OPERATOR';
  const isOwner = role ? OWNER_ROLES.includes(role as (typeof OWNER_ROLES)[number]) : false;
  const needsBusinessSelection = !isAdmin && !operatingContext?.business_id;

  useEffect(() => {
    setOperatingContext(readOperatingContext());
  }, []);

  useEffect(() => {
    const unsubscribe = watchOperatingContext((ctx) => {
      setOperatingContext(ctx as any);
    });
    return unsubscribe;
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
              status: b.status ? String(b.status).toUpperCase() : undefined,
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
    const loadEvents = async () => {
      const businessId = operatingContext?.business_id;
      if (!businessId) {
        setEvents([]);
        return;
      }
      setLoadingEvents(true);
      try {
        const resp = await eventService.list({ future: true, business_id: businessId } as any);
        const list = (resp as any)?.data ?? resp;
        if (!active) return;
        if (Array.isArray(list)) {
          setEvents(
            list.map((ev: any) => ({
              id: String(ev.id),
              name: String(ev.name || ev.title || `Evento ${ev.id}`),
              businessId: ev.business_id ? String(ev.business_id) : String(businessId),
            }))
          );
        } else {
          setEvents([]);
        }
      } catch {
        if (active) setEvents([]);
      } finally {
        if (active) setLoadingEvents(false);
      }
    };
    loadEvents();
    return () => {
      active = false;
    };
  }, [operatingContext?.business_id]);

  const handleSelectEvent = async (eventId: string, onClose?: () => void) => {
    const selected = events.find((e) => e.id === eventId);
    const businessId = (selected?.businessId || operatingContext?.business_id || getCachedUser()?.businessId || '') as string;
    const ctx: OperatingContext = {
      type: 'event',
      event_id: eventId,
      event_name: selected?.name || 'Evento',
      business_id: businessId ? String(businessId) : undefined,
    };
    setOperatingContext(ctx);
    writeOperatingContext(ctx);
    onClose?.();
    router.refresh();
  };

  const handleClearEvent = (onClose?: () => void) => {
    const businessId = operatingContext?.business_id || getCachedUser()?.businessId;
    const ctx: OperatingContext = businessId ? { type: 'business', business_id: String(businessId) } : null;
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
    // Mantenemos compatibilidad si aún se usa esta constante en algún lado,
    // pero el nuevo dashboard se reduce a 5 módulos core.
    return OPERATOR_SIDEBAR_ITEMS.filter((item) => item.href !== '/pos/cambiar-evento');
  }, [operatingContext]);

  const coreItems = useMemo<SidebarItem[]>(() => {
    const items: SidebarItem[] = [
      { title: 'Ventas', href: '/pos', icon: 'point_of_sale' },
      { title: 'Pedidos', href: '/orders', icon: 'shopping_bag' },
      { title: 'Menú', href: '/menu', icon: 'menu_book' },
      { title: 'Clientes', href: '/customers', icon: 'group' },
      { title: 'Configuración', href: '/settings', icon: 'settings' },
    ];

    const tierFromCtx = (operatingContext as any)?.planTier;
    const effectiveTier = tierFromCtx || 'BASIC';
    return items.filter((item) => {
      const feature = featureByHref[item.href];
      if (!feature) return true;
      return hasFeature(feature, effectiveTier as any);
    });
  }, [operatingContext]);

  const sidebarItems = useMemo<SidebarItem[]>(() => {
    if (isAdmin) return [...ADMIN_SIDEBAR_ITEMS, ADMIN_USERS_SIDEBAR_ITEM];
    if (isOperator) return coreItems;
    if (isOwner) return coreItems;
    return coreItems.length ? coreItems : [...SIDEBAR_ITEMS, USERS_SIDEBAR_ITEM];
  }, [isAdmin, isOperator, isOwner, coreItems]);

  return {
    sidebarItems,
    businesses,
    events,
    loadingEvents,
    loadingBiz,
    needsBusinessSelection,
    operatingContext,
    handleSelectBusiness,
    handleSelectEvent,
    handleClearEvent,
    isAdmin,
    isOperator,
    isOwner,
  };
};
