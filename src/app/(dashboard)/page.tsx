"use client";

import { useEffect, useMemo, useState } from 'react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable';
import { TopVenues } from '@/components/dashboard/TopVenues';
import { businessService } from '@/lib/services';
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

export default function DashboardHomePage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrderApi[]>([]);
  const [topBusinesses, setTopBusinesses] = useState<TopBusinessApi[]>([]);
  const [loading, setLoading] = useState(false);

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
      venue: o.business?.name || 'Sin nombre',
      customer: o.customer?.name || 'Sin cliente',
      amount: formatCurrency(Number(o.total) || 0),
      status: (o.status || 'NEW').toString().toUpperCase(),
    }));
  }, [recentOrders]);

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
    <>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <RecentOrdersTable orders={mappedRecentOrders} />
        <TopVenues venues={mappedTopVenues} />
      </div>
    </>
  );
}

