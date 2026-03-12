'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { orderService } from '@/lib/services';
import { toast } from 'react-toastify';

type StatusValue = 'ALL' | 'CREATED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

type UiOrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
};

type UiOrderDetail = {
  backendId: string;
  code: string;
  status: StatusValue;
  type: 'PICKUP' | 'DELIVERY' | string;
  source: string;
  paymentType?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  notes?: string;
  createdAt: string;
  total: number;
  itemsCount: number;
  items: UiOrderItem[];
};

const STATUS_OPTIONS: Array<{ value: StatusValue; label: string; color: string }> = [
  { value: 'CREATED', label: 'Creada', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONFIRMED', label: 'Confirmada', color: 'bg-blue-100 text-blue-800' },
  { value: 'PREPARING', label: 'Preparándose', color: 'bg-primary/10 text-primary' },
  { value: 'READY', label: 'Lista', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'DELIVERED', label: 'Entregada', color: 'bg-gray-200 text-gray-800' },
  { value: 'CANCELLED', label: 'Cancelada', color: 'bg-red-100 text-red-700' },
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

const sanitizePhone = (phone?: string) => {
  if (!phone) return '';
  if (phone.startsWith('NO_PHONE_')) return '';
  return phone;
};

const formatSourceLabel = (src?: string) => {
  if (!src) return '—';
  const key = src.toUpperCase();
  const labels: Record<string, string> = {
    WHATSAPP: 'WhatsApp',
    POS: 'POS',
    WEB: 'Web',
    APP: 'App',
    EVENT: 'Evento',
    LOCAL: 'Local',
  };
  return labels[key] || key.charAt(0) + key.slice(1).toLowerCase();
};

const formatPaymentLabel = (pay?: string) => {
  if (!pay) return '—';
  const key = pay.toUpperCase();
  const labels: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    CREDIT_CARD: 'Tarjeta crédito',
    DEBIT_CARD: 'Tarjeta débito',
    TRANSFER: 'Transferencia',
    WEBPAY: 'Webpay',
    OTHER: 'Otro',
  };
  return labels[key] || key.charAt(0) + key.slice(1).toLowerCase();
};

const mapOrder = (o: any): UiOrderDetail => {
  const items: UiOrderItem[] = Array.isArray(o?.items)
    ? o.items.map((it: any) => {
        const qty = Number(it?.quantity) || 0;
        const unit = Number(it?.unit_price ?? it?.price ?? it?.unitPrice ?? 0);
        return {
          id: String(it?.id ?? it?.product_id ?? Math.random().toString(36).slice(2)),
          name: it?.product?.name || it?.name || 'Producto',
          quantity: qty,
          unitPrice: unit,
          total: qty * unit,
          notes: it?.notes || it?.comment,
        } as UiOrderItem;
      })
    : [];

  const itemsCount = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
  const total = Number(o?.total) || items.reduce((acc, it) => acc + it.total, 0);

  return {
    backendId: String(o?.id ?? o?.code ?? o?.external_id ?? Math.random().toString(36).slice(2)),
    code: o?.code || o?.external_id || `ORD-${o?.id ?? 'N/A'}`,
    status: (o?.status || 'CREATED').toUpperCase() as StatusValue,
    type: (o?.order_type || o?.type || 'PICKUP').toUpperCase(),
    source: (o?.order_source || o?.source || 'WHATSAPP').toUpperCase(),
    paymentType: o?.payment_type || o?.paymentMethod,
    customerName: o?.customer?.name || 'Sin nombre',
    customerPhone: sanitizePhone(o?.customer?.phone) || '—',
    customerEmail: o?.customer?.email,
    address:
      o?.address?.address ||
      o?.delivery_address ||
      o?.customer?.address?.address ||
      o?.customer?.address ||
      '',
    notes: o?.customer?.notes || o?.notes || o?.comment,
    createdAt: o?.created_at || o?.createdAt || '',
    total,
    itemsCount,
    items,
  };
};

export default function PedidoDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderIdParam = params?.id;
  const orderId = Array.isArray(orderIdParam) ? orderIdParam[0] : orderIdParam;

  const [order, setOrder] = useState<UiOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const availableStatusOptions = useMemo(() => {
    if (!order) return [];
    const allowed = [order.status, ...(STATUS_TRANSITIONS[order.status] ?? [])];
    return Array.from(new Set(allowed));
  }, [order]);

  const loadOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await orderService.get(orderId);
      const data = (resp as any)?.data ?? resp;
      if (!data) {
        throw new Error('No se encontró la orden');
      }
      setOrder(mapOrder(data));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo cargar la orden';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleStatusChange = async (nextStatus: StatusValue) => {
    if (!order || !nextStatus || nextStatus === order.status) return;
    setUpdating(true);
    try {
      await toast.promise(orderService.updateStatus(order.backendId, { status: nextStatus }), {
        pending: 'Actualizando estado...',
        success: 'Estado actualizado',
        error: 'No se pudo actualizar el estado',
      });
      setOrder((prev) => (prev ? { ...prev, status: nextStatus } : prev));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo actualizar el estado';
      setError(msg);
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const statusTag = order
    ? STATUS_OPTIONS.find((s) => s.value === order.status) || STATUS_OPTIONS[0]
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/20 text-sm font-semibold text-primary hover:bg-primary/5"
            onClick={() => router.push('/pos/pedidos-activos')}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Volver
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Detalle de pedido</p>
            <h1 className="text-3xl font-black text-gray-900">{order?.code ?? 'Pedido'}</h1>
            <p className="text-sm text-gray-600">
              ID interno: {order?.backendId ?? '—'} · Creado: {formatDate(order?.createdAt)}
            </p>
          </div>
        </div>
        {statusTag && (
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${statusTag.color}`}>
            {statusTag.label}
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-6 text-sm text-gray-600 bg-white border border-primary/10 rounded-xl shadow-sm">
          Cargando pedido...
        </div>
      ) : error ? (
        <div className="p-6 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl shadow-sm">
          {error}
          <div className="mt-3">
            <button
              className="px-3 py-2 text-sm font-semibold rounded-lg border border-primary/20 text-primary hover:bg-primary/5"
              onClick={loadOrder}
            >
              Reintentar
            </button>
          </div>
        </div>
      ) : order ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-primary/10 rounded-xl shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-gray-500 text-xs uppercase font-semibold">
                <span className="material-symbols-outlined text-base text-primary">receipt_long</span>
                Información
              </div>
              <div className="text-sm text-gray-800 space-y-1">
                <p><span className="text-gray-500">Tipo:</span> {order.type === 'DELIVERY' ? 'Delivery' : 'Retiro'}</p>
                <p><span className="text-gray-500">Canal:</span> {formatSourceLabel(order.source)}</p>
                <p><span className="text-gray-500">Pago:</span> {formatPaymentLabel(order.paymentType)}</p>
                <p><span className="text-gray-500">Total:</span> {formatClp(order.total)}</p>
              </div>
            </div>

            <div className="p-4 bg-white border border-primary/10 rounded-xl shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-gray-500 text-xs uppercase font-semibold">
                <span className="material-symbols-outlined text-base text-primary">person</span>
                Cliente
              </div>
              <div className="text-sm text-gray-800 space-y-1">
                <p className="font-semibold text-gray-900">{order.customerName}</p>
                <p className="text-gray-600">{order.customerPhone || '—'}</p>
                {order.customerEmail && <p className="text-gray-600">{order.customerEmail}</p>}
                {order.address && (
                  <p className="text-gray-600">
                    Dirección: {order.address}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-white border border-primary/10 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-gray-500 text-xs uppercase font-semibold">
                <span className="material-symbols-outlined text-base text-primary">sync</span>
                Estado
              </div>
              <div className="text-sm text-gray-800 space-y-2">
                <p className="text-gray-600">Actualiza el estado del pedido.</p>
                <select
                  className="w-full border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary/20"
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value as StatusValue)}
                  disabled={updating}
                >
                  {STATUS_OPTIONS.filter((s) => availableStatusOptions.includes(s.value)).map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {updating && <p className="text-xs text-gray-500">Actualizando...</p>}
              </div>
            </div>
          </div>

          <div className="bg-white border border-primary/10 rounded-xl shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">shopping_bag</span>
                <h3 className="font-bold text-gray-900">Ítems del pedido</h3>
              </div>
              <span className="text-sm text-gray-600">{order.itemsCount} ítems</span>
            </div>
            {order.items.length === 0 ? (
              <div className="p-4 text-sm text-gray-600">No hay ítems registrados.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-primary/10">
                  <thead className="bg-primary/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Cantidad</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Precio</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10 bg-white">
                    {order.items.map((it) => (
                      <tr key={it.id}>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{it.name}</span>
                            {it.notes && <span className="text-xs text-gray-500">{it.notes}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{it.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatClp(it.unitPrice)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{formatClp(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {order.notes && (
            <div className="p-4 bg-white border border-primary/10 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs uppercase font-semibold mb-2">
                <span className="material-symbols-outlined text-base text-primary">chat</span>
                Observaciones
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

