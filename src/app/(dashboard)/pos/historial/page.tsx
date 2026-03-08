'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { businessService, orderService } from '@/lib/services';
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

const SOURCE_OPTIONS = ['WHATSAPP', 'POS', 'WEB', 'APP'];

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

export default function PosHistorialPage() {
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

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
          const cached = getCachedUser()?.businessId;
          const found = cached ? mapped.find((b) => b.id === String(cached)) : undefined;
          setSelectedBusiness(found?.id || mapped[0].id);
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

  const fetchOrders = useCallback(async (override?: { start?: string; end?: string }) => {
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
    if (source) params.order_source = source;
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
          eventLabel: o.event
            ? `${o.event.name || 'Evento'}${o.event.event_date ? ` · ${o.event.event_date}` : ''}`
            : o.has_event
              ? 'Evento'
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
  }, [selectedBusiness, startDate, endDate, status, source, customerId]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  useEffect(() => {
    if (!selectedBusiness || startDate || endDate) return;
    const { start, end } = todayRangeLocal();
    setStartDate(start);
    setEndDate(end);
    fetchOrders({ start, end });
  }, [selectedBusiness, startDate, endDate, fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [selectedBusiness, startDate, endDate, status, source, customerId]);

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

  const filteredOrders = useMemo(() => orders, [orders]);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);

  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1));

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">Terminal POS</p>
        <h1 className="text-2xl font-black text-[#181411] dark:text-white">Historial de Pedidos</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Consulta y filtra pedidos por rango de fechas, estado y canal.
        </p>
      </div>

      <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#8a7560]">Local</span>
            <select
              className="h-11 px-3 rounded-lg border border-primary/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none"
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
              className="h-11 px-3 rounded-lg border border-primary/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#8a7560]">Fin</span>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-11 px-3 rounded-lg border border-primary/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#8a7560]">Estado</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 px-3 rounded-lg border border-primary/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none"
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
            <span className="text-xs font-semibold text-[#8a7560]">Canal</span>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="h-11 px-3 rounded-lg border border-primary/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="">Todos</option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#8a7560]">ID Cliente (opcional)</span>
            <input
              type="number"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="h-11 px-3 rounded-lg border border-primary/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="Ej: 3"
            />
          </div>
          <div className="md:col-span-2 flex items-end gap-2">
            <button
              onClick={() => fetchOrders()}
              disabled={loading || !selectedBusiness}
              className="px-4 h-11 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Cargando...' : 'Buscar'}
            </button>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setStatus('');
                setSource('');
                setCustomerId('');
              }}
              disabled={loading}
              className="px-4 h-11 rounded-lg border border-primary/20 text-sm font-semibold text-[#181411] hover:bg-primary/5 disabled:opacity-60"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && !filteredOrders.length ? (
        <div className="bg-white border border-primary/10 rounded-xl p-4 text-sm text-[#8a7560]">
          Cargando pedidos...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-primary/10 rounded-xl p-4 text-sm text-[#8a7560]">
          {selectedBusiness
            ? 'No hay pedidos para los filtros seleccionados.'
            : 'Selecciona un local para ver el historial.'}
        </div>
      ) : (
        <div className="bg-white border border-primary/10 rounded-xl shadow-sm">
          <div className="space-y-4">
            {/* Escritorio: tabla */}
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
                <tbody className="divide-y divide-primary/10 text-sm text-[#181411]">
                  {paginatedOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-primary/5">
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
                      <td className="px-4 py-3 text-[#181411]">{o.eventLabel}</td>
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

            {/* Mobile: tarjetas */}
            <div className="md:hidden divide-y divide-primary/10">
              {paginatedOrders.map((o) => (
                <div key={o.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#181411]">#{o.code}</p>
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
                      <span className="material-symbols-outlined text-sm">
                        {o.contextType === 'event' ? 'event' : 'store'}
                      </span>
                      {o.contextLabel}
                    </span>
                    {o.eventLabel && (
                      <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {o.eventLabel}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                      {o.sourceLabel}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full font-semibold ${
                        o.type === 'DELIVERY'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {o.type === 'DELIVERY' ? 'Delivery' : 'Retiro'}
                    </span>
                  </div>
                  <div className="text-sm text-[#181411]">
                    <p className="font-semibold">{o.customerName}</p>
                    <p className="text-xs text-[#8a7560]">{o.businessName}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-[#181411]">{formatClp(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between px-4 pb-4">
              <button
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
