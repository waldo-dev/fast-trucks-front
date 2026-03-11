'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { businessService, eventService, productService, orderService } from '@/lib/services';
import { config } from '@/lib/config';
import { getCachedUser } from '@/lib/auth';
import { toast } from 'react-toastify';

type UiProduct = {
  id: string;
  name: string;
  price: string;
  numericPrice: number;
  numericProductId: number | null;
  image: string;
  category?: string;
};

type CartItem = UiProduct & { quantity: number; numericPrice: number };

type OperatingContext =
  | { type: 'event'; event_id?: string; event_name?: string; business_id?: string }
  | { type: 'business'; business_id?: string }
  | null;

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

export default function PosPage() {
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [events, setEvents] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [products, setProducts] = useState<UiProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [eventMode, setEventMode] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'WEBPAY' | 'CREDIT_CARD' | 'DEBIT_CARD'>(
    'CASH'
  );
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [operatingContext, setOperatingContext] = useState<OperatingContext>(null);
  const [contextApplied, setContextApplied] = useState(false);

  const cachedBusinessId = getCachedUser()?.businessId;

  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const isEventOrder = eventMode && !!selectedEvent;

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['Todos', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase();
    return products.filter(
      (p) =>
        (!term || p.name.toLowerCase().includes(term)) &&
        (selectedCategory === 'Todos' || p.category === selectedCategory)
    );
  }, [products, search, selectedCategory]);

  const formatClp = (value: number) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value || 0);

  const resolveImageUrl = (url?: string | null) => {
    const fallback =
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80';
    if (!url) return fallback;
    if (/^https?:\/\//i.test(url)) return url;
    const base = config.api.baseUrl.replace(/\/$/, '');
    const path = url.startsWith('/') ? url.slice(1) : url;
    return `${base}/${path}`;
  };

const friendlyOrderError = (err: any) => {
  const fallback = 'No se pudo crear la orden. Intenta nuevamente.';
  const message =
    typeof err === 'string'
      ? err
      : (err?.response?.data as any)?.message ||
        (err?.response?.data as any)?.error ||
        err?.message ||
        err?.error;
  if (typeof message !== 'string') return fallback;
  const lower = message.toLowerCase();
  if (lower.includes('stock')) return 'No hay stock suficiente para algún producto.';
  if (lower.includes('payment')) return 'Hubo un problema con el pago. Intenta con otro medio.';
  if (lower.includes('event')) return 'No se pudo asociar la orden al evento. Revisa la selección.';
  if (lower.includes('business') || lower.includes('local'))
    return 'No se encontró el local para la orden.';
  return fallback;
};

  const canCheckout =
    cart.length > 0 &&
    customer.name.trim() !== '' &&
    (orderType === 'pickup' || deliveryAddress.trim() !== '');

  const handleAddToCart = useCallback((prod: UiProduct) => {
    const numericPrice = prod.numericPrice || 0;
    setCart((prev) => {
      const existing = prev.find((p) => p.id === prod.id);
      if (existing) {
        return prev.map((p) => (p.id === prod.id ? { ...p, quantity: p.quantity + 1 } : p));
      }
      return [
        ...prev,
        {
          ...prod,
          quantity: 1,
          numericPrice,
        },
      ];
    });
  }, []);

  const handleCreateOrder = async () => {
    setError(null);
    setConfirmOpen(false);
    try {
      setSubmittingOrder(true);
      const eventIdNumber =
        eventMode && selectedEvent ? Number(selectedEvent) : undefined;
      if (eventMode && selectedEvent && !Number.isFinite(eventIdNumber)) {
        const msg = 'El evento seleccionado no es válido; vuelve a elegirlo.';
        setError(msg);
        toast.error(msg);
        setSubmittingOrder(false);
        return;
      }
      const items: Array<{ product_id: number; quantity: number; unit_price: number }> = [];
      for (const item of cart) {
        const rawId = item.numericProductId ?? item.id;
        const productId = Number(rawId);
        if (!Number.isFinite(productId)) {
          const msg = 'Hay productos sin ID numérico válido; revisa el catálogo.';
          setError(msg);
          toast.error(msg);
          setSubmittingOrder(false);
          return;
        }
        items.push({
          product_id: productId,
          quantity: item.quantity,
          unit_price: item.numericPrice,
        });
      }

      const finalOrderType = isEventOrder ? 'pickup' : orderType;
      const orderSource = isEventOrder ? 'EVENT' : 'POS';

      const payload: any = {
        business_id: selectedBusiness,
        event_id: eventIdNumber,
        order_type: finalOrderType === 'delivery' ? 'DELIVERY' : 'PICKUP',
        order_source: orderSource,
        payment_method: paymentMethod,
        items,
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim() || undefined,
          email: customer.email.trim() || undefined,
          notes:
            finalOrderType === 'delivery' ? deliveryNotes.trim() || undefined : undefined,
          address:
            finalOrderType === 'delivery'
              ? {
                address: deliveryAddress.trim(),
                notes: deliveryNotes.trim() || undefined,
              }
              : undefined,
        },
      };

      await toast.promise(orderService.create(payload), {
        pending: 'Creando orden...',
        success: 'Orden creada correctamente',
        error: 'No se pudo crear la orden',
      });

      setCart([]);
      setCustomer({ name: '', phone: '', email: '' });
      setDeliveryAddress('');
      setDeliveryNotes('');
      setOrderType('pickup');
    } catch (err) {
      const msg = friendlyOrderError(err);
      setError(msg);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleContinue = () => {
    if (!canCheckout) {
      setError(
        orderType === 'delivery'
          ? 'Completa nombre y dirección para continuar.'
          : 'Completa el nombre del cliente para continuar.'
      );
      return;
    }
    setError(null);
    setConfirmOpen(true);
  };

  useEffect(() => {
    setOperatingContext(readOperatingContext());
  }, []);

  useEffect(() => {
    if (!eventMode || !selectedEvent) {
      setOrderType('pickup');
    }
  }, [eventMode, selectedEvent]);

  useEffect(() => {
    if (!isEventOrder) return;
    if (orderType !== 'pickup') setOrderType('pickup');
    if (deliveryAddress) setDeliveryAddress('');
    if (deliveryNotes) setDeliveryNotes('');
  }, [isEventOrder, orderType, deliveryAddress, deliveryNotes]);

  useEffect(() => {
    if (contextApplied || !operatingContext) return;
    if (operatingContext.type === 'event') {
      if (operatingContext.business_id) {
        setSelectedBusiness(String(operatingContext.business_id));
      }
      if (operatingContext.event_id) {
        const id = String(operatingContext.event_id);
        setSelectedEvent(id);
        setEvents((prev) => {
          if (prev.some((ev) => ev.id === id)) return prev;
          return [
            ...prev,
            {
              id,
              name: operatingContext.event_name || 'Evento seleccionado',
            },
          ];
        });
      }
      setEventMode(true);
    } else if (operatingContext.type === 'business') {
      if (operatingContext.business_id) {
        setSelectedBusiness(String(operatingContext.business_id));
      }
      setEventMode(false);
      setSelectedEvent('');
    }
    setContextApplied(true);
  }, [operatingContext, contextApplied]);

  const activeContext = useMemo(() => {
    if (eventMode && selectedEvent) {
      const evName =
        events.find((ev) => ev.id === selectedEvent)?.name ||
        (operatingContext?.type === 'event' ? operatingContext.event_name : undefined) ||
        'Evento seleccionado';
      return { type: 'event' as const, label: `Evento: ${evName}` };
    }
    if (operatingContext?.type === 'event' && operatingContext.event_name) {
      return { type: 'event' as const, label: `Evento: ${operatingContext.event_name}` };
    }
    return { type: 'business' as const, label: 'Modo local' };
  }, [eventMode, selectedEvent, events, operatingContext]);

  useEffect(() => {
    const loadBasics = async () => {
      try {
        const resp = await businessService.list();
        const list = (resp as any)?.data ?? resp;
        const mapped =
          Array.isArray(list) && list.length
            ? list.map((b: any) => ({
              id: String(b.id),
              name: b.name || b.brand_name || 'Sin nombre',
            }))
            : [];
        setBusinesses(mapped);
        setSelectedBusiness((prev) => {
          if (prev) return prev;
          if (mapped.length === 1) {
            return mapped[0].id;
          }
          if (cachedBusinessId) {
            const found = mapped.find((b) => b.id === String(cachedBusinessId));
            if (found) return found.id;
          }
          return prev;
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No se pudieron cargar los locales'
        );
      }
    };

    const loadEvents = async () => {
      try {
        const resp = await eventService.list({ future: true });
        const list = (resp as any)?.data ?? resp;
        if (Array.isArray(list)) {
          setEvents(
            list.map((ev: any) => ({
              id: String(ev.id),
              name: ev.name || ev.title || 'Evento',
            }))
          );
        }
      } catch {
        setEvents([]);
      }
    };

    loadBasics();
    loadEvents();
  }, [cachedBusinessId]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!selectedBusiness) {
        setProducts([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const resp = await productService.listByOwner({ business_id: selectedBusiness });
        const list = (resp as any)?.data ?? resp;
        if (Array.isArray(list)) {
          setProducts(
            list.map((p: any) => ({
              id: String(p.id ?? Math.random().toString(36).slice(2)),
              name: p.name || 'Sin nombre',
              numericPrice: Number(p.price) || 0,
              numericProductId:
                p.id !== undefined && Number.isFinite(Number(p.id))
                  ? Number(p.id)
                  : null,
              price: formatClp(Number(p.price) || 0),
              image: resolveImageUrl(p.image || p.image_url),
              category: p.category?.name || 'Sin categoría',
            }))
          );
        } else {
          setProducts([]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No se pudieron cargar los productos'
        );
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [selectedBusiness]);

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Encabezado */}
      <header className="bg-white border border-primary/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary p-2 rounded-lg">
            <span className="material-symbols-outlined">storefront</span>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold">
                Punto de venta
              </p>
              <div className="text-xs text-gray-500">
                {selectedBusiness ? 'Local seleccionado' : 'Selecciona un local'}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${activeContext.type === 'event'
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {activeContext.type === 'event' ? 'event' : 'store'}
                </span>
                {activeContext.label}
              </span>
              {operatingContext?.type === 'event' && !eventMode && (
                <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                  Activa "POS en evento" para usar el evento seleccionado.
                </span>
              )}
            </div>
            <div className="flex flex-col xl:flex-row xl:items-center xl:gap-3 gap-2">
              <select
                className="bg-background-light border border-primary/20 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none w-full xl:w-64"
                value={selectedBusiness}
                onChange={(e) => setSelectedBusiness(e.target.value)}
              >
                <option value="">{businesses.length > 0 ? 'Selecciona un local' : 'Sin locales'}</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              {/*  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={eventMode}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setEventMode(enabled);
                      if (!enabled) {
                        setSelectedEvent('');
                        setOrderType('pickup');
                      }
                    }}
                  />
                  POS en evento
                </label>*/}
                {events.length > 0 && (
                  <select
                    className="bg-background-light border border-primary/20 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none w-full sm:w-56 disabled:opacity-50 disabled:cursor-not-allowed"
                    value={selectedEvent}
                    onChange={(e) => {
                      setSelectedEvent(e.target.value);
                      setEventMode(true);
                    }}
                    disabled={!eventMode}
                  >
                    <option value="">Selecciona evento</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              className="w-full bg-background-light border border-primary/20 rounded-xl pl-10 pr-4 py-2 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20 focus:bg-white"
              placeholder="Buscar producto..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="hidden sm:inline-flex bg-white border border-primary/20 text-gray-600 p-2 rounded-lg hover:bg-primary/5">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="hidden sm:inline-flex bg-white border border-primary/20 text-gray-600 p-2 rounded-lg hover:bg-primary/5">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      {/* Contenido principal responsive */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr,1fr] gap-4 lg:gap-6">
        <div className="flex flex-col gap-4">
          {/* Categorías */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border ${selectedCategory === cat
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-primary/20 hover:bg-primary/5'
                  }`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Productos */}
          {loading ? (
            <div className="text-gray-600 text-sm bg-white border border-primary/10 rounded-xl p-4">
              Cargando productos...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-gray-600 text-sm bg-white border border-dashed border-primary/20 rounded-xl p-4">
              {selectedBusiness
                ? 'No hay productos para este local.'
                : 'Selecciona un local para ver productos.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-xl overflow-hidden flex flex-col border border-primary/10 hover:border-primary/30 transition-colors shadow-sm cursor-pointer"
                  onClick={() => handleAddToCart(prod)}
                >
                  <div
                    className="aspect-square w-full bg-cover bg-center"
                    style={{ backgroundImage: `url('${prod.image}')` }}
                    aria-hidden
                  />
                  <div className="p-4 flex flex-col gap-2 relative">
                    <h3 className="font-bold text-base text-gray-900 leading-tight">{prod.name}</h3>
                    {prod.category && (
                      <span className="text-xs text-gray-500 uppercase tracking-[0.12em]">
                        {prod.category}
                      </span>
                    )}
                    <p className="text-primary font-bold text-lg">{prod.price}</p>
                    <button
                      className="absolute bottom-4 right-4 bg-primary text-white size-10 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(prod);
                      }}
                    >
                      <span className="material-symbols-outlined font-bold text-base">add</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen de orden */}
        <div className="bg-white border border-primary/10 rounded-xl p-4 flex flex-col gap-3 shadow-sm max-h-[80vh]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
              <h3 className="font-bold text-gray-900">Orden actual</h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  {activeContext.type === 'event' ? 'event' : 'storefront'}
                </span>
                {activeContext.label}
              </span>
              <span>{cart.reduce((acc, item) => acc + item.quantity, 0)} ítems</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {cart.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no has agregado productos.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Nombre del cliente *
                    </label>
                    <input
                      className="w-full bg-background-light border border-primary/20 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white"
                      placeholder="Ej: Juan Pérez"
                      value={customer.name}
                      onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Teléfono (opcional)
                    </label>
                    <input
                      className="w-full bg-background-light border border-primary/20 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white"
                      placeholder="+56 9 1234 5678"
                      value={customer.phone}
                      onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Correo (opcional)
                    </label>
                    <input
                      className="w-full bg-background-light border border-primary/20 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white"
                      placeholder="cliente@correo.com"
                      value={customer.email}
                      onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                    />
                  </div>
                  {eventMode ? (
                    selectedEvent ? (
                      <div className="flex flex-col justify-end gap-1">
                        <span className="text-[11px] font-semibold text-gray-600">
                          Entrega
                        </span>
                        <span className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                          Retiro inmediato en evento
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col justify-end gap-1">
                        <span className="text-[11px] font-semibold text-gray-600">Entrega</span>
                        <span className="text-sm text-gray-600 bg-background-light border border-primary/20 rounded-lg px-3 py-2">
                          Selecciona un evento para elegir el tipo de entrega
                        </span>
                      </div>
                    )
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Tipo de entrega
                      </label>
                      <select
                        className="w-full bg-background-light border border-primary/20 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white"
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value as 'pickup' | 'delivery')}
                      >
                        <option value="pickup">Retiro en local</option>
                        <option value="delivery">Delivery</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Método de pago *
                    </label>
                    <select
                      className="w-full bg-background-light border border-primary/20 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white"
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as 'CASH' | 'TRANSFER' | 'WEBPAY' | 'DEBIT_CARD' | 'CREDIT_CARD')
                      }
                    >
                      <option value="CASH">Efectivo</option>
                      <option value="DEBIT_CARD">Tarjeta Debito</option>
                      <option value="CREDIT_CARD">Tarjeta Credito</option>
                      <option value="TRANSFER">Transferencia</option>
                      <option value="WEBPAY">Webpay</option>
                    </select>
                  </div>
                </div>
                {!isEventOrder && orderType === 'delivery' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Dirección de entrega *
                      </label>
                      <input
                        className="w-full bg-background-light border border-primary/20 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white"
                        placeholder="Calle, número, comuna"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Referencia (opcional)
                      </label>
                      <input
                        className="w-full bg-background-light border border-primary/20 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white"
                        placeholder="Depto, piso, indicaciones"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                {error && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-background-light rounded-lg p-2 border border-primary/10"
                    >
                      <div
                        className="size-12 rounded-md bg-cover bg-center border border-primary/10"
                        style={{ backgroundImage: `url('${item.image}')` }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.category || 'Sin categoría'}</p>
                        <p className="text-primary font-bold">{item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="size-8 rounded-full bg-white border border-primary/20 text-primary flex items-center justify-center hover:bg-primary/5"
                          onClick={() =>
                            setCart((prev) =>
                              prev
                                .map((p) =>
                                  p.id === item.id
                                    ? { ...p, quantity: Math.max(0, p.quantity - 1) }
                                    : p
                                )
                                .filter((p) => p.quantity > 0)
                            )
                          }
                        >
                          <span className="material-symbols-outlined text-base">remove</span>
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          className="size-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90"
                          onClick={() =>
                            setCart((prev) =>
                              prev.map((p) =>
                                p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p
                              )
                            )
                          }
                        >
                          <span className="material-symbols-outlined text-base">add</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
                  <span>Total</span>
                  <span className="text-primary text-lg">
                    {formatClp(
                      cart.reduce(
                        (acc, item) => acc + item.numericPrice * item.quantity,
                        0
                      )
                    )}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    className={`flex-1 rounded-lg py-3 font-bold transition-colors ${canCheckout
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    onClick={handleContinue}
                    disabled={!canCheckout || submittingOrder}
                  >
                    {submittingOrder ? 'Creando...' : 'Continuar'}
                  </button>
                  <button
                    className="px-4 py-3 rounded-lg border border-primary/20 text-gray-700 hover:bg-primary/5"
                    onClick={() => setCart([])}
                  >
                    Vaciar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {confirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-3xl">help</span>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Confirmar creación</h4>
                  <p className="text-sm text-gray-600">
                    ¿Deseas crear esta orden con el cliente y productos seleccionados?
                  </p>
                </div>
              </div>
              <div className="bg-background-light rounded-xl border border-primary/10 p-4 text-sm text-gray-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Cliente</span>
                  <span className="font-semibold">{customer.name || 'Sin nombre'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Teléfono</span>
                  <span className="font-semibold">{customer.phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipo</span>
                  <span className="font-semibold">
                    {orderType === 'delivery' ? 'Delivery' : 'Retiro'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pago</span>
                  <span className="font-semibold">
                    {paymentMethod === 'CASH'
                      ? 'Efectivo'
                      : paymentMethod === 'CARD'
                        ? 'Tarjeta'
                        : paymentMethod === 'TRANSFER'
                          ? 'Transferencia'
                          : 'Webpay'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contexto</span>
                  <span className="font-semibold text-right">{activeContext.label}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dirección</span>
                    <span className="font-semibold text-right">{deliveryAddress}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Total</span>
                  <span className="font-bold text-primary">
                    {formatClp(
                      cart.reduce(
                        (acc, item) => acc + item.numericPrice * item.quantity,
                        0
                      )
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-lg border border-primary/20 text-gray-700 hover:bg-primary/5"
                  onClick={() => setConfirmOpen(false)}
                  disabled={submittingOrder}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleCreateOrder}
                  disabled={submittingOrder}
                >
                  {submittingOrder ? 'Creando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
