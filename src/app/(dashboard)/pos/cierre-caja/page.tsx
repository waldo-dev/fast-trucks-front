'use client';

import { useEffect, useMemo, useState } from 'react';
import { orderService } from '@/lib/services';
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
  const [startDate, setStartDate] = useState<string>(toInputDate(today));
  const [endDate, setEndDate] = useState<string>(toInputDate(today));
  const [vatRate, setVatRate] = useState<number>(0.19);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Closeout | null>(null);
  const [operatingContext, setOperatingContext] = useState<OperatingContext>(null);

  const loadCloseout = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        start_date: startOfDayIso(startDate),
        end_date: endOfDayIso(endDate),
        vat_rate: vatRate,
      };
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

  useEffect(() => {
    setOperatingContext(readOperatingContext());
    loadCloseout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const payments = useMemo(() => {
    const breakdown = data?.payment_breakdown || {};
    const cash = breakdown.CASH || 0;
    const card = breakdown.CARD || 0;
    const transfer = breakdown.TRANSFER || 0;
    const webpay = breakdown.WEBPAY || 0;
    const other = breakdown.OTHER || 0;
    const total = cash + card + transfer + webpay + other;
    return { cash, card, transfer, webpay, other, total };
  }, [data]);

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">
          Terminal POS
        </p>
        <h1 className="text-2xl font-black text-[#181411] dark:text-white">Cierre de Caja</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Resumen del turno: ventas, impuestos, documentos y medios de pago.
        </p>
      </div>

      <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-end">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-[#8a7560] mb-1">Inicio</label>
          <input
            type="date"
            className="border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1f1a13]"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-[#8a7560] mb-1">Fin</label>
          <input
            type="date"
            className="border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1f1a13]"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-[#8a7560] mb-1">IVA (vat_rate)</label>
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
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <SummaryCard label="Total ventas brutas" value={formatClp(data?.gross_sales || 0)} />
        <SummaryCard label="Total ventas netas" value={formatClp(data?.net_sales || 0)} />
        <SummaryCard label="Impuestos (IVA)" value={formatClp(data?.taxes || 0)} />
        <SummaryCard label="Cantidad boletas/facturas" value={`${data?.receipt_count ?? 0}`} />
        <SummaryCard label="Ventas anuladas" value={formatClp(data?.cancelled_sales || 0)} />
        <SummaryCard label="Descuentos aplicados" value={formatClp(data?.discounts_applied || 0)} />
      </div>

      <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-6 shadow-sm space-y-4">
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
          <PaymentCard label="Débito" value={formatClp(payments.card)} />
          <PaymentCard label="Crédito" value={formatClp(payments.card)} />
          <PaymentCard label="Transferencia" value={formatClp(payments.transfer)} />
          <PaymentCard label="Otros (QR / MP / etc.)" value={formatClp(payments.other)} />
          <PaymentCard label="Total recaudado" value={formatClp(payments.total)} highlighted />
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
