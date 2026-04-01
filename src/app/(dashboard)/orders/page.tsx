'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { businessService, customerService, eventService, orderService } from '@/lib/services';
import { readOperatingContext, watchOperatingContext } from '@/lib/operatingContext';
import { getCachedUser } from '@/lib/auth';
import { toast } from 'react-toastify';

type UiOrder = {
  id: string;
  code: string;
  status: string;
  type: string;
  source: string;
  sourceLabel: string;
  contextLabel: string;
  contextType: 'event' | 'business';
  eventLabel: string;
  eventId?: string;
  customerName: string;
  total: number;
  createdAt: string;
  businessName: string;
};

const STATUS_OPTIONS = [
  'CREATED',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'DELIVERED',
  'CANCELLED',
];

type ContextFilter = 'ALL' | 'EVENT' | 'LOCAL';

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

const formatInputDateTimeLocal = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
};

const todayRangeLocal = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return {
    start: formatInputDateTimeLocal(start),
    end: formatInputDateTimeLocal(end),
  };
};

const csvEscape = (v: string | number) => {
  const s = String(v ?? '');
  return `"${s.replace(/"/g, '""')}"`;
};

export default function OrdersPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>(
    () => readOperatingContext()?.business_id ?? getCachedUser()?.businessId ?? ''
  );
  const [events, setEvents] = useState<Array<{ id: string; name: string }>>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [contextFilter, setContextFilter] = useState<ContextFilter>('ALL');
  const [eventId, setEventId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const loadBusinesses = useCallback(async () => {
    try {
      const resp = await businessService.list();
      const list = (resp as any)?.data ?? resp;
      if (Array.isArray(list)) {
        const mapped = list.map((b: any) => ({
          id: String(b.id),
          name: b.name || b.brand_name || `Local ${b.id}`,
        }));
        setBusinesses(mapped);
        if (!selectedBusiness && mapped.length) {
          const ctx = readOperatingContext();
          const contextBiz = ctx?.business_id
            ? mapped.find((b) => b.id === String(ctx.business_id))
            : undefined;
          const cached = getCachedUser()?.businessId;
          const found = cached ? mapped.find((b) => b.id === String(cached)) : undefined;
          setSelectedBusiness(contextBiz?.id || found?.id || mapped[0].id);
        }
      } else {
        setBusinesses([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudieron cargar los locales';
      setBusinesses([]);
      toast.error(msg);
    }
  }, [selectedBusiness]);

  const loadEvents = useCallback(async () => {
    const biz = selectedBusiness || readOperatingContext()?.business_id;
    try {
      const params: Record<string, string | boolean> = {};
      if (biz) params.business_id = biz;
      const resp = await eventService.list(params as any);
      const list = (resp as any)?.data ?? resp;
      if (Array.isArray(list)) {
        setEvents(
          list.map((ev: any) => ({
            id: String(ev.id),
            name: ev.event_date ? `${ev.name || 'Evento'} · ${ev.event_date}` : ev.name || 'Evento',
          }))
        );
      } else {
        setEvents([]);
      }
    } catch {
      setEvents([]);
    }
  }, [selectedBusiness]);

  const loadCustomers = useCallback(async (businessId?: string) => {
    if (!businessId) {
      setCustomers([]);
      return;
    }
    try {
      const resp = await customerService.list({ business_id: businessId } as any);
      const list = (resp as any)?.data ?? resp;
      if (Array.isArray(list)) {
        setCustomers(
          list.map((c: any) => ({
            id: String(c.id),
            name: c.name || c.email || c.phone || `Cliente ${c.id}`,
          }))
        );
      } else {
        setCustomers([]);
      }
    } catch {
      setCustomers([]);
    }
  }, []);

  const fetchOrders = useCallback(
    async (override?: { start?: string; end?: string }) => {
      if (!selectedBusiness) {
        setOrders([]);
        return;
      }
      setLoading(true);
      setError(null);
      const start = override?.start ?? startDate;
      const end = override?.end ?? endDate;
      const params: Record<string, string | number> = { business_id: selectedBusiness };
      if (start) params.start_date = new Date(start).toISOString();
      if (end) params.end_date = new Date(end).toISOString();
      if (status) params.status = status;
      if (contextFilter === 'EVENT') {
        if (eventId) (params as any).event_id = eventId;
        else (params as any).order_source = 'EVENT';
      }
      if (customerId) params.customer_id = customerId;

      try {
        const resp = await orderService.history(params);
        const data = (resp as any)?.data ?? resp;
        if (Array.isArray(data)) {
          const mapped: UiOrder[] = data.map((o: any, idx: number) => ({
            id: String(o.id ?? idx + 1),
            code: o.code || o.external_id || `ORD-${o.id ?? idx + 1}`,
            status: (o.status || 'CREATED').toString().toUpperCase(),
            type: (o.order_type || o.type || 'PICKUP').toString().toUpperCase(),
            source: (o.order_source || o.source || 'POS').toString().toUpperCase(),
            sourceLabel: (() => {
              const src = (o.order_source || o.source || 'POS').toString().toUpperCase();
              if (src === 'WHATSAPP') return 'WhatsApp';
              if (src === 'WEB') return 'Web';
              if (src === 'APP') return 'App';
              return 'POS';
            })(),
            contextType: o.event || o.has_event ? 'event' : 'business',
            contextLabel: o.event
              ? `Evento: ${o.event.name || 'Evento'}`
              : o.has_event
                ? 'Evento'
                : 'Local',
            eventId: o.event?.id
              ? String(o.event.id)
              : o.event_id
                ? String(o.event_id)
                : undefined,
            eventLabel: o.event
              ? `${o.event.name || 'Evento'}${o.event.event_date ? ` · ${o.event.event_date}` : ''}`
              : o.has_event
                ? o.event_id
                  ? `Evento #${o.event_id}`
                  : 'Evento'
                : '—',
            customerName: o.customer?.name || 'Sin nombre',
            total: Number(o.total) || 0,
            createdAt: o.created_at || o.createdAt || '',
            businessName: o.business?.name || o.business_name || `Local ${selectedBusiness}`,
          }));
          setOrders(mapped);
        } else {
          setOrders([]);
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'No se pudo cargar el historial de pedidos';
        setError(msg);
        toast.error(msg);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedBusiness, startDate, endDate, status, contextFilter, eventId, customerId]
  );

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  useEffect(() => {
    const ctx = readOperatingContext();
    if (ctx?.type === 'event' && ctx.event_id) {
      setContextFilter('EVENT');
      setEventId(String(ctx.event_id));
    }
  }, []);

  useEffect(() => {
    const unsub = watchOperatingContext((ctx) => {
      const bid =
        ctx?.type === 'business'
          ? ctx.business_id
          : ctx?.type === 'event'
            ? ctx.business_id
            : undefined;
      if (bid) setSelectedBusiness(String(bid));
      if (ctx?.type === 'event' && ctx.event_id) {
        setContextFilter('EVENT');
        setEventId(String(ctx.event_id));
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadCustomers(selectedBusiness);
  }, [selectedBusiness, loadCustomers]);

  useEffect(() => {
    if (contextFilter === 'LOCAL') {
      setEventId('');
    }
  }, [contextFilter]);

  useEffect(() => {
    if (!selectedBusiness || startDate || endDate) return;
    const { start, end } = todayRangeLocal();
    setStartDate(start);
    setEndDate(end);
    fetchOrders({ start, end });
  }, [selectedBusiness, startDate, endDate, fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [
    selectedBusiness,
    startDate,
    endDate,
    status,
    contextFilter,
    eventId,
    customerId,
    search,
    orders,
  ]);

  const statusLabel = (value: string) => {
    switch (value) {
      case 'CREATED':
        return 'Creado';
      case 'CONFIRMED':
        return 'Confirmado';
      case 'PREPARING':
        return 'Preparando';
      case 'READY':
        return 'Listo';
      case 'DELIVERED':
        return 'Entregado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return value;
    }
  };

  const filteredOrders = useMemo(() => {
    let list = orders.filter((o) => {
      if (contextFilter === 'EVENT') {
        if (eventId) return o.contextType === 'event' && o.eventId === eventId;
        return o.contextType === 'event';
      }
      if (contextFilter === 'LOCAL') {
        return o.contextType === 'business';
      }
      return true;
    });
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (o) =>
          o.code.toLowerCase().includes(term) ||
          o.customerName.toLowerCase().includes(term) ||
          o.businessName.toLowerCase().includes(term) ||
          o.eventLabel.toLowerCase().includes(term)
      );
    }
    return list;
  }, [orders, contextFilter, eventId, search]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);

  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1));
  const openOrder = (orderId: string) =>
    router.push(`/pos/pedidos-activos/${encodeURIComponent(orderId)}`);

  const handleExportCsv = () => {
    if (!filteredOrders.length) {
      toast.info('No hay filas para exportar.');
      return;
    }
    const header = [
      'Codigo',
      'Local',
      'Contexto',
      'Evento',
      'Cliente',
      'Canal',
      'Tipo',
      'Estado',
      'Total',
      'Fecha',
    ];
    const rows = filteredOrders.map((o) =>
      [
        csvEscape(o.code),
        csvEscape(o.businessName),
        csvEscape(o.contextLabel),
        csvEscape(o.eventLabel),
        csvEscape(o.customerName),
        csvEscape(o.sourceLabel),
        csvEscape(o.type === 'DELIVERY' ? 'Delivery' : 'Retiro'),
        csvEscape(statusLabel(o.status)),
        csvEscape(o.total),
        csvEscape(formatDate(o.createdAt)),
      ].join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pedidos-${selectedBusiness || 'export'}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    toast.success('CSV descargado');
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto w-full px-4 md:px-10 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">Pedidos</p>
          <h1 className="text-3xl md:text-4xl font-black text-[#181411] dark:text-white leading-tight">
            Histórico y análisis
          </h1>
          <p className="text-[#8a7560] text-base max-w-2xl">
            Consulta pedidos pasados con filtros por fecha, estado, local y evento.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={loading || !filteredOrders.length}
            className="inline-flex items-center gap-2 px-4 h-11 bg-white border border-[#e6e0db] rounded-xl text-[#181411] text-sm font-bold hover:bg-[#f5f2f0] disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#8a7560]">Local</span>
            <select
              className="h-11 px-3 rounded-lg border border-primary/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:bg-[#2d2419] dark:border-[#3d3226]"
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
            >
              <option value="">Selecciona un local</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#8a7560]">Inicio</span>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-11 px-3 rounded-lg border border-primary/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:bg-[#2d2419] dark:border-[#3d3226]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#8a7560]">Fin</span>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-11 px-3 rounded-lg border border-primary/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:bg-[#2d2419] dark:border-[#3d3226]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#8a7560]">Estado</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 px-3 rounded-lg border border-primary/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:bg-[#2d2419] dark:border-[#3d3226]"
            >
              <option value="">Todos</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#8a7560]">Contexto</span>
            <select
              value={contextFilter}
              onChange={(e) => setContextFilter(e.target.value as ContextFilter)}
              className="h-11 px-3 rounded-lg border border-primary/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:bg-[#2d2419] dark:border-[#3d3226]"
            >
              <option value="ALL">Todos</option>
              <option value="EVENT">Eventos</option>
              <option value="LOCAL">Locales</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#8a7560]">Cliente (opcional)</span>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="h-11 px-3 rounded-lg border border-primary/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:bg-[#2d2419] dark:border-[#3d3226]"
              disabled={!customers.length}
            >
              <option value="">{customers.length ? 'Todos' : 'Sin clientes'}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#8a7560]">Evento (opcional)</span>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="h-11 px-3 rounded-lg border border-primary/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:bg-[#2d2419] dark:border-[#3d3226]"
              disabled={contextFilter === 'LOCAL' || !events.length}
            >
              <option value="">
                {contextFilter === 'LOCAL'
                  ? 'No aplica en locales'
                  : events.length
                    ? 'Todos o elige uno'
                    : 'Sin eventos'}
              </option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 md:col-span-1">
            <span className="text-xs font-semibold text-[#8a7560]">Buscar en resultados</span>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7560] text-lg">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Código, cliente, local, evento…"
                className="w-full h-11 pl-10 pr-3 rounded-lg border border-primary/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:bg-[#2d2419] dark:border-[#3d3226]"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchOrders()}
            disabled={loading || !selectedBusiness}
            className="px-4 h-11 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? 'Cargando...' : 'Aplicar filtros'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setStatus('');
              setContextFilter('ALL');
              setEventId('');
              setCustomerId('');
              setSearch('');
            }}
            disabled={loading}
            className="px-4 h-11 rounded-lg border border-primary/20 text-sm font-semibold text-[#181411] hover:bg-primary/5 disabled:opacity-60"
          >
            Limpiar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && !filteredOrders.length ? (
        <div className="bg-white border border-primary/10 rounded-xl p-4 text-sm text-[#8a7560]">
          Cargando pedidos…
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-primary/10 rounded-xl p-4 text-sm text-[#8a7560]">
          {selectedBusiness
            ? 'No hay pedidos para los filtros seleccionados.'
            : 'Selecciona un local y aplica filtros.'}
        </div>
      ) : (
        <div className="bg-white border border-primary/10 rounded-xl shadow-sm dark:bg-[#2d2419] dark:border-[#3d3226]">
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-primary/5 text-[#8a7560] text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Local</th>
                  <th className="px-4 py-3">Contexto</th>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 text-sm text-[#181411] dark:text-white">
                {paginatedOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-primary/5 cursor-pointer"
                    onClick={() => openOrder(o.id)}
                  >
                    <td className="px-4 py-3 font-semibold">#{o.code}</td>
                    <td className="px-4 py-3">{o.businessName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          o.contextType === 'event'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {o.contextType === 'event' ? 'event' : 'store'}
                        </span>
                        {o.contextLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">{o.eventLabel}</td>
                    <td className="px-4 py-3">{o.customerName}</td>
                    <td className="px-4 py-3">{o.sourceLabel}</td>
                    <td className="px-4 py-3">{o.type === 'DELIVERY' ? 'Delivery' : 'Retiro'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">{formatClp(o.total)}</td>
                    <td className="px-4 py-3 text-[#8a7560]">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-primary/10">
            {paginatedOrders.map((o) => (
              <div
                key={o.id}
                className="px-4 py-3 space-y-2 cursor-pointer active:scale-[0.99] transition"
                onClick={() => openOrder(o.id)}
                onKeyDown={(e) => e.key === 'Enter' && openOrder(o.id)}
                tabIndex={0}
                role="button"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#181411] dark:text-white">#{o.code}</p>
                    <p className="text-xs text-[#8a7560]">{formatDate(o.createdAt)}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
                    {statusLabel(o.status)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-semibold ${
                      o.contextType === 'event'
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {o.contextLabel}
                  </span>
                  {o.eventLabel !== '—' && (
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                      {o.eventLabel}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-[#181411] dark:text-white">{o.customerName}</p>
                <p className="text-base font-bold text-[#181411] dark:text-white">{formatClp(o.total)}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 pb-4 pt-2">
            <p className="text-sm text-[#8a7560]">
              Mostrando{' '}
              {filteredOrders.length === 0
                ? 0
                : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredOrders.length)}`}{' '}
              de {filteredOrders.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-semibold rounded-lg border border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/5"
              >
                Anterior
              </button>
              <span className="text-sm text-[#8a7560]">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-semibold rounded-lg border border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/5"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
