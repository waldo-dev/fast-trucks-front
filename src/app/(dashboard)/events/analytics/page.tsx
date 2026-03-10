'use client';

import { useEffect, useMemo, useState } from 'react';
import { eventService } from '@/lib/services';
import { readOperatingContext } from '@/lib/operatingContext';
import { getCachedUser } from '@/lib/auth';
import { getCachedTier, hasFeature } from '@/lib/planAccess';
import { toast } from 'react-toastify';

type AnalyticsItem = {
  id: string;
  name: string;
  event_date?: string;
  sales?: number;
  tickets?: number;
  expenses?: number;
  margin?: number;
  margin_pct?: number;
};

type Summary = {
  sales?: number;
  tickets?: number;
  avg_ticket?: number;
  payments?: Array<{ method: string; total: number }>;
  top_products?: Array<{ name: string; qty: number; revenue: number }>;
  expenses?: number;
  cogs?: number;
  margin?: number;
  margin_pct?: number;
};

type Expense = { id: string; type?: string; description?: string; amount: number };

const formatClp = (v?: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v || 0);

const formatPct = (v?: number) => (v === undefined || v === null ? '—' : `${(v * 100).toFixed(1)}%`);

const normalizePayment = (value?: string) => {
  if (!value) return '—';
  const key = value.toUpperCase();
  const map: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    DEBIT_CARD: 'Tarjeta Débito',
    CREDIT_CARD: 'Tarjeta Crédito',
    TRANSFER: 'Transferencia',
    WEBPAY: 'Webpay',
    OTHER: 'Otro',
  };
  return map[key] || key.charAt(0) + key.slice(1).toLowerCase();
};

export default function EventsAnalyticsPage() {
  const ctx = readOperatingContext();
  const businessId = ctx?.type === 'business' ? ctx.business_id : getCachedUser()?.businessId;
  const planTier = (ctx as any)?.planTier || getCachedTier();
  const canSeeReports = hasFeature('reports', planTier);

  const [analytics, setAnalytics] = useState<AnalyticsItem[]>([]);
  const [limit, setLimit] = useState(10);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [newExpense, setNewExpense] = useState({ type: '', description: '', amount: '' });

  const fetchAnalytics = async () => {
    // analytics no requiere business_id, sólo limit
    setLoadingAnalytics(true);
    try {
      const resp = await eventService.analytics({ limit });
      const data = (resp as any)?.data ?? resp;
      if (Array.isArray(data)) {
        const mapped: AnalyticsItem[] = data.map((ev: any) => ({
          id: String(ev.id),
          name: ev.name || 'Evento',
          event_date: ev.event_date,
          sales: Number(ev.sales) || 0,
          tickets: Number(ev.tickets) || 0,
          expenses: Number(ev.expenses) || 0,
          margin: Number(ev.margin) || 0,
          margin_pct: ev.margin_pct !== undefined ? Number(ev.margin_pct) : undefined,
        }));
        setAnalytics(mapped);
        if (!selectedEventId && mapped.length) setSelectedEventId(mapped[0].id);
      } else {
        setAnalytics([]);
      }
    } catch (e) {
      toast.error('No se pudo cargar la analítica de eventos');
      setAnalytics([]);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchSummary = async (eventId?: string) => {
    if (!eventId || !businessId || !canSeeReports) return;
    setLoadingSummary(true);
    try {
      const resp = await eventService.summary(eventId);
      const raw = (resp as any)?.data ?? resp;
      const payments = raw?.payment_breakdown
        ? Object.entries(raw.payment_breakdown).map(([method, total]) => {
            const label = normalizePayment(method);
            return {
              method: label,
              total: Number(total) || 0,
            };
          })
        : [];
      const topProducts =
        Array.isArray(raw?.top_products) && raw.top_products.length
          ? raw.top_products.map((p: any, idx: number) => ({
              name: p.name || `Producto ${idx + 1}`,
              qty: Number(p.quantity || p.qty) || 0,
              revenue: Number(p.revenue) || 0,
            }))
          : [];

      setSummary({
        sales: Number(raw?.sales) || 0,
        tickets: Number(raw?.tickets) || 0,
        avg_ticket: Number(raw?.avg_ticket) || 0,
        expenses: Number(raw?.expenses?.total || raw?.expenses) || 0,
        cogs: Number(raw?.cogs) || undefined,
        margin: Number(raw?.margin) || 0,
        margin_pct: raw?.margin_pct !== undefined ? Number(raw.margin_pct) : undefined,
        payments,
        top_products: topProducts,
      });
    } catch {
      toast.error('No se pudo cargar el resumen del evento');
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchExpenses = async (eventId?: string) => {
    if (!eventId || !canSeeReports) return;
    setLoadingExpenses(true);
    try {
      const resp = await eventService.listExpenses(eventId);
      const data = (resp as any)?.data ?? resp;
      if (Array.isArray(data)) {
        setExpenses(
          data.map((ex: any) => ({
            id: String(ex.id),
            type: ex.type,
            description: ex.description,
            amount: Number(ex.amount) || 0,
          }))
        );
      } else {
        setExpenses([]);
      }
    } catch {
      setExpenses([]);
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, limit]);

  useEffect(() => {
    if (selectedEventId) {
      fetchSummary(selectedEventId);
      fetchExpenses(selectedEventId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    const amountNum = Number(newExpense.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error('Monto inválido');
      return;
    }
    try {
      await eventService.createExpense(selectedEventId, {
        type: newExpense.type || undefined,
        description: newExpense.description || undefined,
        amount: amountNum,
      });
      toast.success('Gasto agregado');
      setNewExpense({ type: '', description: '', amount: '' });
      fetchSummary(selectedEventId);
      fetchExpenses(selectedEventId);
    } catch {
      toast.error('No se pudo agregar el gasto');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!selectedEventId) return;
    try {
      await eventService.deleteExpense(selectedEventId, expenseId);
      toast.success('Gasto eliminado');
      fetchSummary(selectedEventId);
      fetchExpenses(selectedEventId);
    } catch {
      toast.error('No se pudo eliminar el gasto');
    }
  };

  const selectedEventName = useMemo(
    () => analytics.find((a) => a.id === selectedEventId)?.name || 'Evento',
    [analytics, selectedEventId]
  );

  if (!businessId) {
    return (
      <div className="p-6">
        <p className="text-sm text-[#8a7560]">Selecciona un negocio para ver analítica de eventos.</p>
      </div>
    );
  }

  if (!canSeeReports) {
    return (
      <div className="p-6 space-y-2">
        <h1 className="text-2xl font-bold text-[#181411]">Analítica de eventos</h1>
        <p className="text-sm text-[#8a7560]">
          Tu plan actual no incluye analítica de eventos. Esta función está disponible en planes Standard y Pro.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-[#181411]">Analítica de eventos</h1>
        <p className="text-sm text-[#8a7560]">
          Ranking, márgenes, gastos y recomendaciones de inventario por evento.
        </p>
      </div>

      <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">query_stats</span>
            <h3 className="text-lg font-bold text-[#181411] dark:text-white">Ranking</h3>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#8a7560] flex items-center gap-2">
              Top
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="h-9 px-3 rounded-lg border border-primary/20 bg-white text-sm"
              >
                {[5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-primary/5 text-[#8a7560] uppercase text-xs tracking-wide">
              <tr>
                <th className="px-3 py-2 text-left">Evento</th>
                <th className="px-3 py-2 text-right">Ventas</th>
                <th className="px-3 py-2 text-right">Tickets</th>
                <th className="px-3 py-2 text-right">Gastos</th>
                <th className="px-3 py-2 text-right">Margen</th>
                <th className="px-3 py-2 text-right">Margen %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {loadingAnalytics ? (
                <tr>
                  <td className="px-3 py-3 text-[#8a7560]" colSpan={6}>
                    Cargando...
                  </td>
                </tr>
              ) : analytics.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-[#8a7560]" colSpan={6}>
                    No hay datos para mostrar.
                  </td>
                </tr>
              ) : (
                analytics.map((ev) => (
                  <tr
                    key={ev.id}
                    className={`hover:bg-primary/5 cursor-pointer ${
                      ev.id === selectedEventId ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedEventId(ev.id)}
                  >
                    <td className="px-3 py-2 font-semibold text-[#181411]">{ev.name}</td>
                    <td className="px-3 py-2 text-right">{formatClp(ev.sales)}</td>
                    <td className="px-3 py-2 text-right">{ev.tickets ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{formatClp(ev.expenses)}</td>
                    <td className="px-3 py-2 text-right">{formatClp(ev.margin)}</td>
                    <td className="px-3 py-2 text-right">{formatPct(ev.margin_pct)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEventId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#181411] dark:text-white">
                Resumen: {selectedEventName}
              </h3>
            </div>
            {loadingSummary ? (
              <p className="text-sm text-[#8a7560]">Cargando resumen...</p>
            ) : !summary ? (
              <p className="text-sm text-[#8a7560]">Sin datos de resumen.</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Metric label="Ventas" value={formatClp(summary.sales)} />
                  <Metric label="Tickets" value={summary.tickets ?? '—'} />
                  <Metric label="Ticket promedio" value={formatClp(summary.avg_ticket)} />
                  <Metric label="Gastos" value={formatClp(summary.expenses)} />
                  <Metric label="Margen" value={formatClp(summary.margin)} />
                  <Metric label="Margen %" value={formatPct(summary.margin_pct)} />
                </div>
                {summary.payments?.length ? (
                  <div>
                    <h4 className="text-sm font-semibold text-[#181411]">Pagos</h4>
                    <div className="flex flex-wrap gap-2 text-sm text-[#4b5563]">
                      {summary.payments.map((p, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold"
                        >
                          {p.method}: {formatClp(p.total)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {summary.top_products?.length ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-[#181411]">Top productos</h4>
                    <div className="space-y-1 text-sm">
                      {summary.top_products.map((t, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-[#181411] font-medium">{t.name}</span>
                          <span className="text-[#4b5563]">
                            {t.qty} {t.qty === 1 ? 'unidad' : 'unidades'} · {formatClp(t.revenue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#181411] dark:text-white">Gastos del evento</h3>
            </div>
            {loadingExpenses ? (
              <p className="text-sm text-[#8a7560]">Cargando gastos...</p>
            ) : (
              <div className="space-y-2">
                <div className="max-h-52 overflow-y-auto border border-primary/10 rounded-lg p-2 divide-y divide-primary/10">
                  {expenses.length === 0 ? (
                    <p className="text-sm text-[#8a7560] px-2 py-1">Sin gastos registrados.</p>
                  ) : (
                    expenses.map((ex) => (
                      <div key={ex.id} className="flex items-center justify-between py-2 px-2 text-sm">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#181411]">{ex.type || 'Gasto'}</span>
                          {ex.description && <span className="text-xs text-[#8a7560]">{ex.description}</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-[#181411]">{formatClp(ex.amount)}</span>
                          <button
                            className="text-xs text-red-600 hover:underline"
                            onClick={() => handleDeleteExpense(ex.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form className="grid grid-cols-1 sm:grid-cols-3 gap-2" onSubmit={handleAddExpense}>
                  <input
                    type="text"
                    placeholder="Tipo"
                    value={newExpense.type}
                    onChange={(e) => setNewExpense((p) => ({ ...p, type: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-primary/20 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Descripción"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense((p) => ({ ...p, description: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-primary/20 text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Monto"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense((p) => ({ ...p, amount: e.target.value }))}
                      className="h-10 px-3 rounded-lg border border-primary/20 text-sm w-full"
                    />
                    <button
                      type="submit"
                      className="px-3 h-10 rounded-lg bg-primary text-white text-sm font-semibold"
                    >
                      Agregar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recomendaciones removidas hasta que exista el endpoint */}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-primary/5 rounded-lg px-3 py-2 border border-primary/10">
      <p className="text-xs text-[#8a7560] uppercase font-semibold">{label}</p>
      <p className="text-lg font-bold text-[#181411]">{value}</p>
    </div>
  );
}

