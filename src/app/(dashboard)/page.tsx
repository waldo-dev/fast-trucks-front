"use client";

import { useEffect, useMemo, useState } from 'react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable';
import { TopVenues } from '@/components/dashboard/TopVenues';
import { businessService, orderService } from '@/lib/services';
import { toast } from 'react-toastify';

const formatNumber = (value?: number) =>
  new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(value || 0);

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value || 0);

type Overview = {
  totals?: {
    total_orders?: number;
    today_orders?: number;
    active_products?: number;
  };
  businesses?: any[];
};

type RecentOrderApi = {
  id?: number | string;
  code?: string;
  external_id?: string;
  status?: string;
  total?: number;
  business?: { name?: string };
  customer?: { name?: string };
};

type TopBusinessApi = {
  id?: number | string;
  name?: string;
  order_count?: number;
  total_sales?: number;
};

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

const endOfDayIso = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
};

const startOfDayIso = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

export default function DashboardHomePage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrderApi[]>([]);
  const [topBusinesses, setTopBusinesses] = useState<TopBusinessApi[]>([]);
  const [ordersContext, setOrdersContext] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [operatingContext, setOperatingContext] = useState<OperatingContext | null>(null);

  useEffect(() => {
    setOperatingContext(readOperatingContext());
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [ov, ro, tb] = await Promise.all([
          businessService.dashboardOverview(),
          businessService.dashboardRecentOrders(),
          businessService.dashboardTopBusinesses(),
        ]);
        const overviewPayload = (ov as any)?.data ?? ov;
        setOverview(overviewPayload as Overview);
        setRecentOrders(((ro as any)?.data ?? ro) as RecentOrderApi[]);
        setTopBusinesses(((tb as any)?.data ?? tb) as TopBusinessApi[]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'No se pudo cargar el dashboard';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadContextOrders = async () => {
      const businessId = operatingContext?.business_id;
      const eventId = operatingContext?.type === 'event' ? operatingContext.event_id : undefined;
      if (!businessId) {
        setOrdersContext([]);
        return;
      }
      setLoading(true);
      try {
        const start = startOfDayIso(daysAgo(30));
        const end = endOfDayIso(new Date());
        const params: any = { business_id: businessId, start_date: start, end_date: end };
        if (eventId) params.event_id = eventId;
        const resp = await orderService.history(params);
        const data = (resp as any)?.data ?? resp;
        setOrdersContext(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error(
          err instanceof Error
            ? 'No se pudieron cargar los pedidos del contexto'
            : 'Error al cargar pedidos'
        );
        setOrdersContext([]);
      } finally {
        setLoading(false);
      }
    };
    loadContextOrders();
  }, [operatingContext]);

  const metrics = useMemo(() => {
    return [
      {
        label: 'Locales Activos',
        value: formatNumber(overview?.businesses?.length ?? 0),
        icon: 'location_on',
        change: '',
        changeType: 'positive' as const,
        borderColor: 'emerald' as const,
        iconBgColor: 'emerald' as const,
      },
      {
        label: 'Total Pedidos',
        value: formatNumber(overview?.totals?.total_orders ?? 0),
        icon: 'receipt_long',
        change: '',
        changeType: 'positive' as const,
        borderColor: 'orange' as const,
        iconBgColor: 'orange' as const,
      },
      {
        label: 'Pedidos de Hoy',
        value: formatNumber(overview?.totals?.today_orders ?? 0),
        icon: 'today',
        change: '',
        changeType: 'positive' as const,
        borderColor: 'blue' as const,
        iconBgColor: 'blue' as const,
      },
      {
        label: 'Productos Activos',
        value: formatNumber(overview?.totals?.active_products ?? 0),
        icon: 'inventory_2',
        change: '',
        changeType: 'positive' as const,
        borderColor: 'rose' as const,
        iconBgColor: 'rose' as const,
      },
    ];
  }, [overview]);

  const mappedRecentOrders = useMemo(() => {
    return recentOrders.map((o) => ({
      id: `#${o.code || o.external_id || o.id || 'ORD'}`,
      rawId: o.id ? String(o.id) : o.code ? String(o.code) : o.external_id ? String(o.external_id) : undefined,
      venue: o.business?.name || 'Sin nombre',
      customer: o.customer?.name || 'Sin cliente',
      amount: formatCurrency(Number(o.total) || 0),
      status: (o.status || 'NEW').toString().toUpperCase(),
    }));
  }, [recentOrders]);

  const contextMetrics = useMemo(() => {
    const totalOrders = ordersContext.length;
    const totalSales = ordersContext.reduce((acc, o: any) => acc + (Number(o.total) || 0), 0);
    const todayIso = startOfDayIso(new Date());
    const todayOrders = ordersContext.filter((o: any) => {
      const created = o.created_at || o.createdAt;
      return created && created >= todayIso;
    }).length;
    const eventOrders = ordersContext.filter((o: any) => o.event || o.event_id).length;
    const localOrders = totalOrders - eventOrders;
    return { totalOrders, totalSales, todayOrders, eventOrders, localOrders };
  }, [ordersContext]);

  const contextRecent = useMemo(() => {
    return ordersContext
      .slice(0, 8)
      .map((o: any, idx: number) => ({
        id: `#${o.code || o.external_id || o.id || idx + 1}`,
        rawId: o.id
          ? String(o.id)
          : o.code
            ? String(o.code)
            : o.external_id
              ? String(o.external_id)
              : undefined,
        venue: o.event
          ? o.event.name || 'Evento'
          : o.business?.name || 'Local',
        customer: o.customer?.name || 'Sin cliente',
        amount: formatCurrency(Number(o.total) || 0),
        status: (o.status || 'NEW').toString().toUpperCase(),
      }));
  }, [ordersContext]);

  const mappedTopVenues = useMemo(() => {
    const icons = ['local_pizza', 'lunch_dining', 'ramen_dining', 'bakery_dining'];
    const bgs: Array<'orange' | 'blue' | 'rose' | 'emerald'> = [
      'orange',
      'blue',
      'rose',
      'emerald',
    ];
    return topBusinesses.map((b, idx) => ({
      name: b.name || `Local ${b.id ?? idx + 1}`,
      orders: `${formatNumber(b.order_count || 0)} pedidos`,
      revenue: formatCurrency(Number(b.total_sales) || 0),
      icon: icons[idx % icons.length],
      iconBg: bgs[idx % bgs.length],
    }));
  }, [topBusinesses]);

  return (
    <div className="flex flex-col gap-6">
      {/* Context badges */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
          {operatingContext?.type === 'event'
            ? `Evento: ${operatingContext?.event_name || operatingContext?.event_id || ''}`
            : 'Local activo'}
        </span>
        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
          Últimos 30 días
        </span>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MetricCard label="Pedidos" value={formatNumber(contextMetrics.totalOrders)} icon="shopping_bag" change="" changeType="positive" borderColor="blue" iconBgColor="blue" compact />
        <MetricCard label="Pedidos de Hoy" value={formatNumber(contextMetrics.todayOrders)} icon="today" change="" changeType="positive" borderColor="orange" iconBgColor="orange" compact />
        <MetricCard label="Ventas" value={formatCurrency(contextMetrics.totalSales)} icon="payments" change="" changeType="positive" borderColor="rose" iconBgColor="rose" compact />
      </div>

      {/* Context vs Global quick cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-[#181411]">Pedidos recientes</h2>
                <p className="text-sm text-gray-500">
                  Filtrados por el local/evento activo.
                </p>
              </div>
              {loading && <span className="text-xs text-gray-500">Cargando...</span>}
            </div>
            <RecentOrdersTable orders={contextRecent} />
          </div>

         {/* <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-[#181411]">Pedidos recientes (global)</h2>
                <p className="text-sm text-gray-500">Vista general de todos los locales.</p>
              </div>
            </div>
        <RecentOrdersTable orders={mappedRecentOrders} />
          </div>*/}
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-bold text-[#181411] mb-1">Top locales</h2>
            <p className="text-sm text-gray-500 mb-3">Ranking global de locales.</p>
        <TopVenues venues={mappedTopVenues} />
          </div>

          <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-bold text-[#181411] mb-1">Mix de contexto</h2>
            <p className="text-sm text-gray-500 mb-3">Distribución evento / local (últimos 30 días).</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-primary/10 px-3 py-2">
                <p className="text-xs text-gray-500">Pedidos evento</p>
                <p className="text-lg font-bold text-[#181411]">{formatNumber(contextMetrics.eventOrders)}</p>
              </div>
              <div className="rounded-lg border border-primary/10 px-3 py-2">
                <p className="text-xs text-gray-500">Pedidos local</p>
                <p className="text-lg font-bold text-[#181411]">{formatNumber(contextMetrics.localOrders)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

