'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { customerService, orderService } from '@/lib/services';
import { readOperatingContext } from '@/lib/operatingContext';
import { toast } from 'react-toastify';

type UiOrder = {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  source: string;
  type: string;
};

type UiCustomer = {
  name: string;
  email?: string;
  phone?: string;
  businessName?: string;
};

const formatClp = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const customerId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const [customer, setCustomer] = useState<UiCustomer | null>(null);
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const businessId = useMemo(() => {
    const ctx = readOperatingContext();
    return ctx?.type === 'business' ? ctx.business_id : undefined;
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!customerId) return;
      setLoading(true);
      setError(null);
      try {
        const custResp = await customerService.get(customerId, {
          business_id: businessId,
        });
        const custData = (custResp as any)?.data ?? custResp;
        setCustomer({
          name: custData?.name || 'Sin nombre',
          email: custData?.email,
          phone: custData?.phone,
          businessName:
            custData?.business?.name || custData?.business_name || 'Local seleccionado',
        });

        const ordersResp = await orderService.list({
          customer_id: customerId,
          business_id: businessId,
        });
        const ordersData = (ordersResp as any)?.data ?? ordersResp;
        if (Array.isArray(ordersData)) {
          setOrders(
            ordersData.map((o: any, idx: number) => ({
              id: String(o.id ?? o.code ?? o.external_id ?? idx + 1),
              status: (o.status || 'NEW').toString().toUpperCase(),
              total: formatClp(Number(o.total) || 0),
              createdAt: formatDate(o.created_at || o.createdAt),
              source: (o.order_source || o.source || 'POS').toString().toUpperCase(),
              type: (o.order_type || o.type || 'PICKUP').toString().toUpperCase(),
            }))
          );
        } else {
          setOrders([]);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'No se pudo cargar el cliente';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customerId, businessId]);

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-10 gap-6">
      <div className="flex items-center gap-2 text-sm">
        <button
          className="text-[#8a7560] hover:text-primary transition-colors"
          onClick={() => router.back()}
        >
          Clientes
        </button>
        <span className="material-symbols-outlined text-xs text-[#8a7560]">chevron_right</span>
        <span className="text-[#181411] font-medium">Detalle de cliente</span>
      </div>

      <div className="bg-white border border-primary/10 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold">
              Cliente
            </p>
            <h1 className="text-2xl font-black text-[#181411]">
              {customer?.name || 'Cargando...'}
            </h1>
            <p className="text-sm text-gray-600">
              {customer?.businessName || 'Local seleccionado en contexto'}
            </p>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            {customer?.phone && <div>📞 {customer.phone}</div>}
            {customer?.email && <div>✉️ {customer.email}</div>}
          </div>
        </div>
      </div>

      <div className="bg-white border border-primary/10 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-[#181411]">Pedidos</h2>
            <p className="text-sm text-gray-500">
              Historial filtrado por el local del contexto.
            </p>
          </div>
          {loading && <span className="text-xs text-gray-500">Cargando...</span>}
        </div>
        {error ? (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-sm text-gray-600">No hay pedidos para este cliente.</div>
        ) : (
          <div className="divide-y divide-primary/10">
            {orders.map((o) => (
              <div
                key={o.id}
                className="py-3 flex items-center justify-between text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-primary">#{o.id}</span>
                  <span className="text-gray-500">{o.createdAt}</span>
                  <span className="text-gray-500">
                    {o.type === 'DELIVERY' ? 'Delivery' : 'Retiro'} · {o.source}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-[#181411]">{o.total}</span>
                  <div className="text-xs text-gray-600">{o.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


