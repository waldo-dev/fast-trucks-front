'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusFilterCards } from '@/components/orders/StatusFilterCards';
import { OrderTable } from '@/components/orders/OrderTable';
import { StatsFooter } from '@/components/orders/StatsFooter';
import { orderService } from '@/lib/services';
import { getAccessToken, getCachedUser } from '@/lib/auth';
import { toast } from 'react-toastify';
import { config } from '@/lib/config';

type ApiOrder = {
  id?: string | number;
  code?: string | number;
  external_id?: string | number;
  status?: string;
  order_type?: string;
  type?: string;
  total?: number | string;
  customer?: {
    name?: string;
    phone?: string;
    initials?: string;
  };
  business?: {
    name?: string;
  };
  business_name?: string;
  created_at?: string;
  createdAt?: string;
  time?: string;
};

type OrdersByBusiness = {
  business_id?: string | number;
  orders?: ApiOrder[];
};

type UiOrder = {
  id: string; // id mostrado (code o id)
  backendId: string; // id real para API
  time: string;
  venue: string;
  customer: {
    initials: string;
    name: string;
  };
  type: 'Delivery' | 'Pickup';
  status: 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total: string;
  isDelivered?: boolean;
};

const formatCurrency = (value?: string | number) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '$0';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(numeric);
};

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const initialsFromName = (name?: string) => {
  if (!name) return 'NN';
  const parts = name.trim().split(' ');
  const [first, second] = parts;
  return `${first?.[0] ?? ''}${second?.[0] ?? ''}`.toUpperCase() || 'NN';
};

const mapStatus = (status?: string): UiOrder['status'] => {
  const normalized = (status || '').toString().toUpperCase();
  switch (normalized) {
    case 'CREATED':
    case 'NEW':
      return 'new';
    case 'CONFIRMED':
    case 'PREPARING':
      return 'preparing';
    case 'READY':
      return 'ready';
    case 'DELIVERED':
      return 'delivered';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'new';
  }
};

const mapType = (type?: string): UiOrder['type'] => {
  const normalized = (type || '').toString().toUpperCase();
  return normalized === 'DELIVERY' ? 'Delivery' : 'Pickup';
};

export default function OrdersPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<UiOrder['status'] | 'all'>('all');
  const [ordersByBusiness, setOrdersByBusiness] = useState<OrdersByBusiness[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [exporting, setExporting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    const user = getCachedUser();
    if (!user?.id) {
      setError('No se encontró el usuario en sesión');
      setOrdersByBusiness([]);
      setLoading(false);
      return;
    }

    try {
      const resp = await orderService.listByUser(user.id);
      const data = (resp as any)?.data ?? resp;
      if (Array.isArray(data)) {
        setOrdersByBusiness(data as OrdersByBusiness[]);
      } else {
        setOrdersByBusiness([]);
      }
      setLastUpdated(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudieron cargar los pedidos';
      setError(msg);
      toast.error(msg);
      setOrdersByBusiness([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const normalizedOrders = useMemo<UiOrder[]>(() => {
    return ordersByBusiness.flatMap((group) => {
      const venueName = group.business_id ? `Local ${group.business_id}` : 'Local sin nombre';
      return (group.orders || []).map((order, idx) => {
        const status = mapStatus(order.status);
        const backendId =
          order.id ??
          order.code ??
          order.external_id ??
          `ORD-${group.business_id ?? 'N'}-${idx + 1}`;
        const displayId =
          order.code ??
          order.id ??
          order.external_id ??
          `ORD-${group.business_id ?? 'N'}-${idx + 1}`;
        const customerName = order.customer?.name || 'Cliente';
        return {
          id: String(displayId),
          backendId: String(backendId),
          time: formatDateTime(order.created_at || order.createdAt || order.time),
          venue: order.business?.name || order.business_name || venueName,
          customer: {
            initials: order.customer?.initials || initialsFromName(customerName),
            name: customerName,
          },
          type: mapType(order.order_type || order.type),
          status,
          total: formatCurrency(order.total),
          isDelivered: status === 'delivered',
        };
      });
    });
  }, [ordersByBusiness]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return normalizedOrders.filter((order) => {
      const matchesStatus = activeFilter === 'all' ? true : order.status === activeFilter;
      const matchesSearch =
        !term ||
        order.id.toLowerCase().includes(term) ||
        order.customer.name.toLowerCase().includes(term) ||
        order.venue.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [normalizedOrders, activeFilter, search]);

  const statusCounts = useMemo(() => {
    return normalizedOrders.reduce(
      (acc, order) => {
        acc.all += 1;
        acc[order.status] += 1;
        return acc;
      },
      { all: 0, new: 0, preparing: 0, ready: 0, delivered: 0, cancelled: 0 }
    );
  }, [normalizedOrders]);

  const statusFilters = [
    {
      label: 'Todos los Pedidos',
      count: statusCounts.all,
      color: '',
      isActive: activeFilter === 'all',
      change: undefined,
      onClick: () => setActiveFilter('all'),
    },
    {
      label: 'Nuevo',
      count: statusCounts.new,
      color: 'bg-yellow-400',
      isActive: activeFilter === 'new',
      onClick: () => setActiveFilter('new'),
    },
    {
      label: 'Preparando',
      count: statusCounts.preparing,
      color: 'bg-primary',
      isActive: activeFilter === 'preparing',
      onClick: () => setActiveFilter('preparing'),
    },
    {
      label: 'Listo',
      count: statusCounts.ready,
      color: 'bg-green-500',
      isActive: activeFilter === 'ready',
      onClick: () => setActiveFilter('ready'),
    },
    {
      label: 'Entregado',
      count: statusCounts.delivered,
      color: 'bg-gray-400',
      isActive: activeFilter === 'delivered',
      onClick: () => setActiveFilter('delivered'),
    },
  ];

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return '—';
    const diffMs = Date.now() - lastUpdated.getTime();
    const diffSec = Math.max(1, Math.round(diffMs / 1000));
    if (diffSec < 60) return `${diffSec}s`;
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHours = Math.round(diffMin / 60);
    return `${diffHours}h`;
  }, [lastUpdated]);

  const handleUpdateStatus = useCallback(
    async (orderId: string, nextStatus: string) => {
      try {
        setUpdatingId(orderId);
        const payload = { status: nextStatus };
        await toast.promise(orderService.updateStatus(orderId, payload), {
          pending: 'Actualizando estado...',
          success: 'Estado actualizado',
          error: 'No se pudo actualizar el estado',
        });
        fetchOrders();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'No se pudo actualizar el estado del pedido';
        toast.error(msg);
      } finally {
        setUpdatingId(null);
      }
    },
    [fetchOrders]
  );

  const handleViewDetails = (orderId: string) => {
    console.log('Ver detalles del pedido:', orderId);
  };

  const handleExport = async () => {
    const user = getCachedUser();
    const token = getAccessToken();
    if (!user?.id || !token) {
      toast.error('No se encontró sesión activa para exportar.');
      return;
    }
    try {
      setExporting(true);
      const url = `${config.api.baseUrl}orders/by-user/${user.id}/csv`;
      const resp = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        throw new Error(`No se pudo exportar (${resp.status})`);
      }
      const blob = await resp.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `orders-${user.id}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo exportar CSV';
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  const handleManualOrder = () => {
    router.push('/pos');
  };

  return (
    <div className="flex flex-col flex-1 max-w-[1440px] mx-auto w-full px-4 md:px-10 py-8">
      {/* Page Title & Main Action */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#181411] text-4xl font-black leading-tight tracking-tight">
            Pedidos Operativos
          </h1>
          <p className="text-[#8a7560] text-base font-normal">
            Monitorea y gestiona el tráfico en tiempo real en tus locales activos.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 h-11 bg-white border border-[#e6e0db] rounded-xl text-[#181411] text-sm font-bold hover:bg-[#f5f2f0] transition-all shadow-sm"
            disabled={loading || exporting}
          >
            <span className="material-symbols-outlined text-xl">download</span>
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
          <button
            onClick={handleManualOrder}
            className="flex items-center gap-2 px-6 h-11 bg-primary rounded-xl text-white text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
            disabled={loading}
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Pedido Manual
          </button>
        </div>
      </div>

      {/* Status Filter Cards */}
      <StatusFilterCards filters={statusFilters} />

      {/* Table Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-t-2xl border border-[#e6e0db] border-b-0">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7560]">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-[#f5f2f0] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
              placeholder="Buscar por ID de Pedido, Cliente o Local..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={loading}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-[#e6e0db] rounded-lg text-sm font-semibold hover:bg-[#f5f2f0]">
            <span className="material-symbols-outlined text-lg">filter_list</span>
            Filtrar
          </button>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-[#8a7560] font-medium mr-2">
            Actualizado hace {lastUpdatedLabel}
          </p>
          <button
            className="size-9 flex items-center justify-center rounded-lg bg-[#f5f2f0] text-primary disabled:opacity-50"
            onClick={fetchOrders}
            disabled={loading}
          >
            <span className="material-symbols-outlined text-xl">refresh</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      {error && (
        <div className="w-full bg-red-50 text-red-700 border border-red-200 rounded-b-2xl px-4 py-3">
          {error}
        </div>
      )}
      {loading ? (
        <div className="w-full bg-white border border-[#e6e0db] border-t-0 rounded-b-2xl px-6 py-8 text-sm text-[#8a7560]">
          Cargando pedidos...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="w-full bg-white border border-[#e6e0db] border-t-0 rounded-b-2xl px-6 py-8 text-sm text-[#8a7560]">
          No hay pedidos para mostrar.
        </div>
      ) : (
        <OrderTable
          orders={filteredOrders}
          onViewDetails={handleViewDetails}
          onUpdateStatus={handleUpdateStatus}
          updatingId={updatingId}
        />
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between py-6 px-4">
        <p className="text-sm text-[#8a7560] font-medium">
          Mostrando <span className="text-[#181411]">{filteredOrders.length}</span> de{' '}
          <span className="text-[#181411]">{normalizedOrders.length}</span> pedidos
        </p>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 border border-[#e6e0db] rounded-lg text-sm font-bold bg-white text-[#181411] hover:bg-[#f5f2f0] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
          >
            Anterior
          </button>
          <button className="px-4 py-2 border border-[#e6e0db] rounded-lg text-sm font-bold bg-white text-[#181411] hover:bg-[#f5f2f0]">
            Siguiente
          </button>
        </div>
      </div>

      {/* Stats Footer */}
      {/*<StatsFooter />*/}
    </div>
  );
}

