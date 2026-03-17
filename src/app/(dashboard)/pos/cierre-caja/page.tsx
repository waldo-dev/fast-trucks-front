'use client';

import { useEffect, useMemo, useState } from 'react';
import { cashRegisterService, orderService } from '@/lib/services';
import { getCachedUser } from '@/lib/auth';
import { getCachedTier } from '@/lib/planAccess';
import { toast } from 'react-toastify';

type OperatingContext =
  | { type: 'event'; event_id?: string; event_name?: string; business_id?: string }
  | { type: 'business'; business_id?: string }
  | null;

type Closeout = {
  gross_sales: number;
  net_sales: number;
  taxes: number;
  receipt_count: number;
  cancelled_sales: number;
  cancelled_count: number;
  discounts_applied: number;
  payment_breakdown: {
    CASH?: number;
    CARD?: number;
    DEBIT_CARD?: number;
    CREDIT_CARD?: number;
    TRANSFER?: number;
    WEBPAY?: number;
    OTHER?: number;
  };
};

const formatClp = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatRegisterStatus = (status?: string) => {
  const normalized = (status || '').toString().toUpperCase();
  switch (normalized) {
    case 'OPEN':
    case 'OPENED':
      return 'Abierta';
    case 'CLOSED':
      return 'Cerrada';
    case 'PENDING':
      return 'Pendiente';
    default:
      return status || 'Abierta';
  }
};

const today = new Date();
const toInputDate = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const startOfDayIso = (dateStr: string) => {
  if (!dateStr) return undefined;
  return new Date(`${dateStr}T00:00:00`).toISOString();
};
const endOfDayIso = (dateStr: string) => {
  if (!dateStr) return undefined;
  return new Date(`${dateStr}T23:59:59.999`).toISOString();
};

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

export default function PosCierreCajaPage() {
  const currentUser = getCachedUser();
  const [startDate, setStartDate] = useState<string>(toInputDate(today));
  const [endDate, setEndDate] = useState<string>(toInputDate(today));
  const [vatRate, setVatRate] = useState<number>(0.19);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Closeout | null>(null);
  const [operatingContext] = useState<OperatingContext>(() => readOperatingContext());
  const [activeRegister, setActiveRegister] = useState<any | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [openingAmount, setOpeningAmount] = useState<number>();
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [closingAmount, setClosingAmount] = useState<number>();
  const [movementForm, setMovementForm] = useState<{
    type: 'IN' | 'OUT';
    amount: number;
    payment_method: 'CASH' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'TRANSFER' | 'WEBPAY' | 'OTHER';
    notes: string;
  }>({
    type: 'IN',
    amount: 0,
    payment_method: 'CASH',
    notes: '',
  });

  const loadCloseout = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        start_date: startOfDayIso(startDate),
        end_date: endOfDayIso(endDate),
        vat_rate: vatRate,
      };
      if (operatingContext?.business_id) {
        (params as any).business_id = operatingContext.business_id;
      }
      if (operatingContext?.type === 'event' && operatingContext.event_id) {
        (params as any).event_id = operatingContext.event_id;
      }
      const resp = await orderService.closeout(params as any);
      const payload = (resp as any)?.data ?? resp;
      setData(payload as Closeout);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo cargar el cierre';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const businessId = operatingContext?.business_id || getCachedUser()?.businessId;

  const loadActiveRegister = async () => {
    if (!businessId) {
      setActiveRegister(null);
      setMovements([]);
      return;
    }
    setLoadingRegister(true);
    setError(null);
    try {
      const resp = await cashRegisterService.getActive({ business_id: businessId });
      const payload = (resp as any)?.data ?? resp;
      setActiveRegister(payload || null);
      if (payload?.id) {
        const movResp = await cashRegisterService.listMovements(payload.id);
        const movData = (movResp as any)?.data ?? movResp;
        setMovements(Array.isArray(movData) ? movData : []);
      } else {
        setMovements([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo cargar la caja activa';
      setError(msg);
      toast.error(msg);
      setActiveRegister(null);
      setMovements([]);
    } finally {
      setLoadingRegister(false);
    }
  };

  const tier = useMemo(() => getCachedTier(), []);
  const isBasicPlan = tier === 'BASIC';
  const canUseMultipleRegisters = tier !== 'BASIC';

  useEffect(() => {
    if (!canUseMultipleRegisters && allowMultiple) {
      setAllowMultiple(false);
    }
  }, [allowMultiple, canUseMultipleRegisters]);

  const handleOpenRegister = async () => {
    if (!businessId) {
      toast.error('No hay negocio seleccionado para abrir caja.');
      return;
    }
    if (openingAmount && openingAmount < 0) {
      toast.error('El monto de apertura no puede ser negativo.');
      return;
    }
    setLoadingRegister(true);
    try {
      await cashRegisterService.open({
        business_id: businessId,
        opening_amount: openingAmount || 0,
        opened_by: currentUser?.id,
        allowMultiple,
      });
      toast.success('Caja abierta');
      setOpeningAmount(0);
      await loadActiveRegister();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo abrir la caja';
      toast.error(msg);
    } finally {
      setLoadingRegister(false);
    }
  };

  const handleCloseRegister = async () => {
    if (!activeRegister?.id) return;
    if (closingAmount && closingAmount < 0) {
      toast.error('El monto de cierre no puede ser negativo.');
      return;
    }
    setLoadingRegister(true);
    try {
      await cashRegisterService.close(activeRegister.id, {
        closing_amount: closingAmount || 0,
        closed_by: currentUser?.id,
      });
      toast.success('Caja cerrada');
      setClosingAmount(0);
      await loadActiveRegister();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo cerrar la caja';
      toast.error(msg);
    } finally {
      setLoadingRegister(false);
    }
  };

  const handleAddMovement = async () => {
    if (!activeRegister?.id) {
      toast.error('No hay caja activa.');
      return;
    }
    if (movementForm.amount <= 0) {
      toast.error('Ingresa un monto mayor a 0.');
      return;
    }
    setLoadingRegister(true);
    try {
      await cashRegisterService.addMovement(activeRegister.id, {
        type: movementForm.type,
        amount: movementForm.amount,
        payment_method: movementForm.payment_method,
        notes: movementForm.notes || undefined,
      });
      toast.success('Movimiento registrado');
      setMovementForm((prev) => ({ ...prev, amount: 0, notes: '' }));
      await loadActiveRegister();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo registrar el movimiento';
      toast.error(msg);
    } finally {
      setLoadingRegister(false);
    }
  };

  useEffect(() => {
    loadCloseout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operatingContext]);

  useEffect(() => {
    loadActiveRegister();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operatingContext]);

  const payments = useMemo(() => {
    const breakdown = data?.payment_breakdown || {};
    const cash = breakdown.CASH || 0;
    const card = breakdown.CARD || 0;
    const debitCard = breakdown.DEBIT_CARD || 0;
    const creditCard = breakdown.CREDIT_CARD || 0;
    const transfer = breakdown.TRANSFER || 0;
    const webpay = breakdown.WEBPAY || 0;
    const other = breakdown.OTHER || 0;
    const total = cash + card + debitCard + creditCard + transfer + webpay + other;
    return { cash, card, debitCard, creditCard, transfer, webpay, other, total };
  }, [data]);

  const handleRefreshRegister = () => {
    loadActiveRegister();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header y resumen rápido */}
      <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">
              Gestión de caja
            </p>
            <h2 className="text-xl font-bold text-[#181411] dark:text-white">
              Estado y acciones del turno
            </h2>
            <p className="text-sm text-[#8a7560] dark:text-[#a3907d]">
              Abre, refresca o cierra la caja y registra movimientos rápidos.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#f5f2f0] text-[#8a7560] dark:bg-[#241c14] dark:text-[#d2b29b]">
              {activeRegister
                ? `Caja activa #${activeRegister.code}`
                : businessId
                ? 'Sin caja abierta'
                : 'Sin negocio seleccionado'}
            </span>
            <button
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 text-sm font-semibold text-primary hover:bg-primary/5"
              onClick={handleRefreshRegister}
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Refrescar estado
            </button>
          </div>
        </div>

        {/* Panel principal: estado + abrir/cerrar + movimientos */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr,0.9fr] gap-4">
          <div className="space-y-3">
            <div className="border border-primary/10 dark:border-[#3d3226] rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-primary/10 dark:border-[#3d3226] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm text-[#181411] dark:text-white font-semibold">
                    <span>Caja</span>
                    {activeRegister ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {formatRegisterStatus(activeRegister.status || 'OPEN')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        Cerrada
                      </span>
                    )}
                  </div>
                  {loadingRegister ? (
                    <p className="text-sm text-gray-600 dark:text-gray-300">Cargando...</p>
                  ) : activeRegister ? (
                    <div className="space-y-1 text-sm text-[#181411] dark:text-white">
                      <p>
                        <span className="font-semibold">N° Caja:</span> {activeRegister.code}
                      </p>
                      <p>
                        <span className="font-semibold">Apertura:</span>{' '}
                        {formatClp(Number(activeRegister.opening_amount) || 0)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {activeRegister.opened_at || activeRegister.created_at || ''}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      No hay caja abierta. Abre una para registrar movimientos.
                    </p>
                  )}
                </div>

                <div className="border border-primary/10 dark:border-[#3d3226] rounded-lg p-3 space-y-2">
                  <div className="text-sm font-semibold text-[#181411] dark:text-white">Cerrar caja</div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-[#8a7560]">Monto de cierre</label>
                    <input
                      type="number"
                      step="100"
                      value={closingAmount}
                      onChange={(e) => setClosingAmount(Number(e.target.value))}
                      className="h-10 px-3 rounded-lg border border-primary/20 bg-white dark:bg-[#1f1a13] text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                    <button
                      onClick={handleCloseRegister}
                      disabled={loadingRegister || !activeRegister}
                      className="h-10 rounded-lg bg-amber-600 text-white text-sm font-bold hover:bg-amber-500 disabled:opacity-60"
                    >
                      {loadingRegister ? 'Procesando...' : 'Cerrar caja'}
                    </button>
                  </div>
                </div>
              </div>

              {isBasicPlan && activeRegister ? (
                <div className="border border-primary/10 dark:border-[#3d3226] rounded-lg p-3 space-y-2">
                  <div className="text-sm font-semibold text-[#181411] dark:text-white">Abrir caja</div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Ya hay una caja abierta. Cierra la caja actual antes de abrir una nueva.
                  </p>
                </div>
              ) : (
                <div className="border border-primary/10 dark:border-[#3d3226] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-[#181411] dark:text-white">Abrir caja</div>
                    {canUseMultipleRegisters && (
                      <label className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={allowMultiple}
                          onChange={(e) => setAllowMultiple(e.target.checked)}
                        />
                        Múltiples abiertas
                      </label>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr,140px] gap-2">
                    <input
                      type="number"
                      min={0}
                      step="100"
                      value={openingAmount}
                      onChange={(e) => setOpeningAmount(Number(e.target.value))}
                      className="h-10 px-3 rounded-lg border border-primary/20 bg-white dark:bg-[#1f1a13] text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="Monto de apertura"
                    />
                    <button
                      onClick={handleOpenRegister}
                      disabled={loadingRegister || !businessId}
                      className="h-10 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60"
                    >
                      {loadingRegister ? 'Procesando...' : 'Abrir caja'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="border border-primary/10 dark:border-[#3d3226] rounded-lg p-3 space-y-2">
              <h3 className="text-sm font-semibold text-[#181411] dark:text-white">Registrar movimiento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#8a7560]">Tipo</label>
                  <select
                    value={movementForm.type}
                    onChange={(e) =>
                      setMovementForm((prev) => ({
                        ...prev,
                        type: e.target.value as 'IN' | 'OUT',
                      }))
                    }
                    className="h-10 px-3 rounded-lg border border-primary/20 bg-white dark:bg-[#1f1a13] text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="IN">Ingreso</option>
                    <option value="OUT">Egreso</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#8a7560]">Método pago</label>
                  <select
                    value={movementForm.payment_method}
                    onChange={(e) =>
                      setMovementForm((prev) => ({
                        ...prev,
                        payment_method: e.target.value as any,
                      }))
                    }
                    className="h-10 px-3 rounded-lg border border-primary/20 bg-white dark:bg-[#1f1a13] text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="CASH">Efectivo</option>
                    <option value="DEBIT_CARD">Débito</option>
                    <option value="CREDIT_CARD">Crédito</option>
                    <option value="TRANSFER">Transferencia</option>
                    <option value="WEBPAY">Webpay</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#8a7560]">Monto</label>
                  <input
                    type="number"
                    min={0}
                    step="100"
                    value={movementForm.amount}
                    onChange={(e) =>
                      setMovementForm((prev) => ({
                        ...prev,
                        amount: Number(e.target.value),
                      }))
                    }
                    className="h-10 px-3 rounded-lg border border-primary/20 bg-white dark:bg-[#1f1a13] text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#8a7560]">Notas (opcional)</label>
                  <input
                    value={movementForm.notes}
                    onChange={(e) =>
                      setMovementForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="h-10 px-3 rounded-lg border border-primary/20 bg-white dark:bg-[#1f1a13] text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Ej: apertura, arqueo, retiro"
                  />
                </div>
              </div>
              <button
                onClick={handleAddMovement}
                disabled={loadingRegister || !activeRegister}
                className="h-10 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 disabled:opacity-60 p-2"
              >
                {loadingRegister ? 'Procesando...' : 'Agregar movimiento'}
              </button>
            </div>

            <div className="border border-primary/10 dark:border-[#3d3226] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#181411] dark:text-white">Movimientos</h3>
                <span className="text-xs text-gray-500">
                  {movements.length ? `${movements.length} mov.` : 'Sin movimientos'}
                </span>
              </div>
              {loadingRegister ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">Cargando...</p>
              ) : !movements.length ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">Sin movimientos.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y divide-primary/10">
                  {movements.map((m) => (
                    <div
                      key={m.id || `${m.type}-${m.amount}-${m.created_at}`}
                      className="py-2 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {m.type === 'OUT' ? '-' : '+'} {formatClp(Number(m.amount) || 0)}
                        </span>
                        <span className="text-xs text-gray-500">{m.created_at || ''}</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        {m.payment_method || '—'} {m.notes ? `· ${m.notes}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de ventas y filtros */}
      <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">
              Resumen del periodo
            </p>
            <h1 className="text-xl font-black text-[#181411] dark:text-white">Ventas y cierre</h1>
            <p className="text-sm text-[#8a7560] dark:text-[#a3907d]">
              Ajusta fechas para ver el resumen y desglose por medio de pago.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-[#8a7560] mb-1">Inicio</label>
              <input
                type="date"
                className="border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1f1a13]"
                value={startDate}
                onChange={(e) => {
                  const nextStart = e.target.value;
                  setStartDate(nextStart);
                  if (endDate && nextStart && endDate < nextStart) {
                    setEndDate(nextStart);
                  }
                }}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-[#8a7560] mb-1">Fin</label>
              <input
                type="date"
                className="border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1f1a13]"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col w-28">
              <label className="text-xs font-semibold text-[#8a7560] mb-1">IVA</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                className="border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1f1a13]"
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value))}
              />
            </div>
            <button
              className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60"
              onClick={loadCloseout}
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <SummaryCard label="Total ventas brutas" value={formatClp(data?.gross_sales || 0)} />
          <SummaryCard label="Total ventas netas" value={formatClp(data?.net_sales || 0)} />
          <SummaryCard label="Impuestos (IVA)" value={formatClp(data?.taxes || 0)} />
          <SummaryCard label="Cantidad boletas/facturas" value={`${data?.receipt_count ?? 0}`} />
          <SummaryCard label="Ventas anuladas" value={formatClp(data?.cancelled_sales || 0)} />
          <SummaryCard label="Descuentos aplicados" value={formatClp(data?.discounts_applied || 0)} />
        </div>

        <div className="border border-primary/10 dark:border-[#3d3226] rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#181411] dark:text-white">
                Desglose por medio de pago
              </h2>
              <p className="text-sm text-[#6b7280] dark:text-[#a3907d]">
                Control de recaudación por método.
              </p>
            </div>
            {loading && <span className="text-xs text-gray-500">Actualizando...</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <PaymentCard label="Efectivo" value={formatClp(payments.cash)} />
            <PaymentCard label="Débito" value={formatClp(payments.debitCard || payments.card)} />
            <PaymentCard label="Crédito" value={formatClp(payments.creditCard || payments.card)} />
            <PaymentCard label="Transferencia" value={formatClp(payments.transfer)} />
            <PaymentCard label="Otros (QR / MP / etc.)" value={formatClp(payments.other)} />
            <PaymentCard label="Total recaudado" value={formatClp(payments.total)} highlighted />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-4 shadow-sm">
      <p className="text-xs font-semibold text-[#8a7560] uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-black text-[#181411] dark:text-white mt-2">{value}</p>
    </div>
  );
}

function PaymentCard({
  label,
  value,
  highlighted,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`border rounded-xl p-4 shadow-sm ${
        highlighted
          ? 'bg-primary text-white border-primary'
          : 'bg-white dark:bg-[#2d2419] border-[#e6e0db] dark:border-[#3d3226] text-[#181411] dark:text-white'
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${
          highlighted ? 'text-white/90' : 'text-[#8a7560]'
        }`}
      >
        {label}
      </p>
      <p className="text-xl font-black mt-2">{value}</p>
    </div>
  );
}
