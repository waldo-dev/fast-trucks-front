'use client';

import { useEffect, useMemo, useState } from 'react';
import { orderService } from '@/lib/services';
import { toast } from 'react-toastify';

type StatusValue = 'ALL' | 'CREATED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

type UiOrder = {
  id: string;
  backendId: string;
  code: string;
  status: StatusValue;
  type: 'PICKUP' | 'DELIVERY' | string;
  source: string;
  paymentType?: string;
  customerName: string;
  customerPhone: string;
  address: string;
  total: number;
  createdAt: string;
  itemsCount: number;
};

const STATUS_OPTIONS: Array<{ value: StatusValue; label: string; color: string }> = [
  { value: 'ALL', label: 'Todos', color: 'bg-slate-200 text-slate-800' },
  { value: 'CREATED', label: 'Creado', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONFIRMED', label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  { value: 'PREPARING', label: 'Preparando', color: 'bg-primary/10 text-primary' },
  { value: 'READY', label: 'Listo', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'DELIVERED', label: 'Entregado', color: 'bg-gray-200 text-gray-800' },
  { value: 'CANCELLED', label: 'Cancelado', color: 'bg-red-100 text-red-700' },
];

const STATUS_TRANSITIONS: Record<StatusValue, StatusValue[]> = {
  ALL: [],
  CREATED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

const formatClp = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (value?: string) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const emptyCounts: Record<StatusValue, number> = {
  ALL: 0,
  CREATED: 0,
  CONFIRMED: 0,
  PREPARING: 0,
  READY: 0,
  DELIVERED: 0,
  CANCELLED: 0,
};

const countStatuses = (list: UiOrder[]): Record<StatusValue, number> => {
  const map = { ...emptyCounts };
  list.forEach((o) => {
    const key = (o.status as StatusValue) || 'CREATED';
    if (map[key] !== undefined) map[key] += 1;
    map.ALL += 1;
  });
  return map;
};

export default function PosPedidosActivosPage() {
  const [status, setStatus] = useState<StatusValue>('CREATED');
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [summaryCounts, setSummaryCounts] = useState<Record<StatusValue, number>>(emptyCounts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = status === 'ALL' ? undefined : { status };
        const resp = await orderService.list(params as any);
        const list = (resp as any)?.data ?? resp;
        if (Array.isArray(list)) {
          const mapped: UiOrder[] = list.map((o: any) => ({
            id: String(o.code || o.external_id || o.id || Math.random().toString(36).slice(2)),
            backendId: String(o.id ?? o.code ?? o.external_id ?? Math.random().toString(36).slice(2)),
            code: o.code || o.external_id || `ORD-${o.id ?? 'N/A'}`,
            status: (o.status || 'CREATED').toUpperCase(),
            type: (o.order_type || o.type || 'PICKUP').toUpperCase(),
            source: (o.order_source || o.source || 'WHATSAPP').toUpperCase(),
            paymentType: o.payment_type || o.paymentMethod || undefined,
            customerName: o.customer?.name || 'Sin nombre',
            customerPhone: o.customer?.phone || '—',
            address:
              o.address?.address ||
              o.delivery_address ||
              o.customer?.address?.address ||
              o.customer?.address ||
              '',
            total: Number(o.total) || 0,
            createdAt: o.created_at || o.createdAt || '',
            itemsCount: Array.isArray(o.items) ? o.items.reduce((acc: number, it: any) => acc + (Number(it.quantity) || 0), 0) : o.items_count || 0,
          }));
          setOrders(mapped);
        } else {
          setOrders([]);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'No se pudieron cargar los pedidos';
        setError(msg);
        toast.error(msg);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [status, refreshKey]);

  // Contadores globales (fetch ALL) para que no se vacíen al cambiar a filtros sin resultados
  useEffect(() => {
    const loadAllCounts = async () => {
      try {
        const resp = await orderService.list();
        const list = (resp as any)?.data ?? resp;
        if (Array.isArray(list)) {
          const mapped: UiOrder[] = list.map((o: any) => ({
            id: String(o.code || o.external_id || o.id || Math.random().toString(36).slice(2)),
            backendId: String(o.id ?? o.code ?? o.external_id ?? Math.random().toString(36).slice(2)),
            code: o.code || o.external_id || `ORD-${o.id ?? 'N/A'}`,
            status: (o.status || 'CREATED').toUpperCase(),
            type: (o.order_type || o.type || 'PICKUP').toUpperCase(),
            source: (o.order_source || o.source || 'WHATSAPP').toUpperCase(),
            paymentType: o.payment_type || o.paymentMethod || undefined,
            customerName: o.customer?.name || 'Sin nombre',
            customerPhone: o.customer?.phone || '—',
            address:
              o.address?.address ||
              o.delivery_address ||
              o.customer?.address?.address ||
              o.customer?.address ||
              '',
            total: Number(o.total) || 0,
            createdAt: o.created_at || o.createdAt || '',
            itemsCount: Array.isArray(o.items)
              ? o.items.reduce((acc: number, it: any) => acc + (Number(it.quantity) || 0), 0)
              : o.items_count || 0,
          }));
          setSummaryCounts(countStatuses(mapped));
        } else {
          setSummaryCounts(emptyCounts);
        }
      } catch {
        // mantenemos contadores previos si falla
      }
    };

    loadAllCounts();
  }, [refreshKey]);

  const displayedOrders = useMemo(() => {
    if (status === 'ALL') return orders;
    return orders.filter((o) => o.status === status);
  }, [orders, status]);

  const handleStatusChange = async (orderId: string, nextStatus: StatusValue) => {
    if (!nextStatus || nextStatus === 'ALL') return;
    setUpdatingId(orderId);
    try {
      await toast.promise(orderService.updateStatus(orderId, { status: nextStatus }), {
        pending: 'Actualizando estado...',
        success: 'Estado actualizado',
        error: 'No se pudo actualizar el estado',
      });
      setRefreshKey((n) => n + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo actualizar el estado';
      setError(msg);
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Terminal POS</p>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Pedidos Activos</h1>
            <p className="text-sm text-gray-600">
              Visualiza, filtra y monitorea los pedidos en curso. Usa los estados para acotar la vista.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/20 text-sm font-semibold text-primary hover:bg-primary/5"
              onClick={() => setRefreshKey((n) => n + 1)}
              disabled={loading}
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Refrescar
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-colors ${
              status === opt.value
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white text-gray-700 border-primary/20 hover:bg-primary/5'
            }`}
            onClick={() => setStatus(opt.value)}
          >
            <span className="mr-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold bg-white/20">
              {summaryCounts[opt.value] ?? 0}
            </span>
            {opt.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-primary/10 rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">bolt</span>
            <h3 className="font-bold text-gray-900">Órdenes {status === 'ALL' ? 'activas' : status.toLowerCase()}</h3>
          </div>
          {loading && <span className="text-xs text-gray-500">Actualizando...</span>}
        </div>

        {error && (
          <div className="px-4 py-3 text-sm text-red-700 bg-red-50 border-b border-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-6 text-sm text-gray-600">Cargando pedidos...</div>
        ) : displayedOrders.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">No hay pedidos para este estado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-primary/10">
              <thead className="bg-primary/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Pedido</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Canal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Pago</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Creado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 bg-white">
                {displayedOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-primary/5">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{o.code}</span>
                        <span className="text-xs text-gray-500">{o.itemsCount} ítems</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{o.customerName}</span>
                        <span className="text-xs text-gray-500">{o.customerPhone}</span>
                        {o.type === 'DELIVERY' && o.address && (
                          <span className="text-xs text-gray-500">{o.address}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          o.type === 'DELIVERY'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {o.type === 'DELIVERY' ? 'Delivery' : 'Retiro'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const opt = STATUS_OPTIONS.find((s) => s.value === o.status) || STATUS_OPTIONS[1];
                        return (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${opt.color}`}>
                            {opt.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{o.source}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {o.paymentType ? o.paymentType.toUpperCase() : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatClp(o.total)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary/20"
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.backendId, e.target.value as StatusValue)}
                          disabled={updatingId === o.backendId}
                        >
                          {STATUS_OPTIONS.filter((s) => s.value !== 'ALL').map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        {updatingId === o.backendId && (
                          <span className="text-xs text-gray-500">Actualizando...</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
