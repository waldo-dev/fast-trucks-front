"use client";

import { useEffect, useMemo, useState } from "react";

type PublicProduct = {
  id: number;
  name: string;
  description?: string;
  price?: number;
  image_url?: string;
  category?: { id?: number; name?: string } | string;
};

type PublicMenuData = any;

type CartItem = {
  product: PublicProduct;
  quantity: number;
};

const formatClp = (value: number) => {
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(value || 0);
  } catch {
    return `$${value}`;
  }
};

const normalizeProducts = (data: PublicMenuData): PublicProduct[] => {
  const candidates =
    data?.products ??
    data?.items ??
    data?.menu?.products ??
    data?.menu?.items ??
    data?.data?.products ??
    data?.data?.items ??
    [];
  if (Array.isArray(candidates)) return candidates as PublicProduct[];

  const byCategory = data?.categories ?? data?.menu?.categories ?? data?.data?.categories;
  if (Array.isArray(byCategory)) {
    const flat: PublicProduct[] = [];
    byCategory.forEach((c: any) => {
      const arr = c?.products ?? c?.items ?? [];
      if (!Array.isArray(arr)) return;
      arr.forEach((p: any) => {
        flat.push({
          ...p,
          category: p?.category ?? { id: c?.id, name: c?.name },
        });
      });
    });
    return flat;
  }

  return [];
};

const productCategoryName = (p: PublicProduct) => {
  if (!p.category) return "Sin categoría";
  if (typeof p.category === "string") return p.category || "Sin categoría";
  return p.category.name || "Sin categoría";
};

export function PublicMenuClient({
  slug,
  businessId,
  businessName,
  apiBaseUrl,
}: {
  slug: string;
  businessId?: string;
  businessName?: string;
  apiBaseUrl: string;
}) {
  const [menuData, setMenuData] = useState<PublicMenuData | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!slug) return;
      setLoadingMenu(true);
      setMenuError(null);
      try {
        const base = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
        const url = `${base}public/menu?slug=${encodeURIComponent(slug)}`;
        const resp = await fetch(url, { method: "GET", cache: "no-store" });
        if (!resp.ok) throw new Error(`No se pudo cargar el menú (${resp.status})`);
        const json = await resp.json();
        if (!alive) return;
        setMenuData(json?.data ?? json);
      } catch (err) {
        if (!alive) return;
        setMenuData(null);
        setMenuError(err instanceof Error ? err.message : "Error al cargar el menú");
      } finally {
        if (alive) setLoadingMenu(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [slug, apiBaseUrl]);

  const effectiveBusinessId = useMemo(() => {
    return (
      businessId ||
      (menuData as any)?.business_id ||
      (menuData as any)?.businessId ||
      (menuData as any)?.data?.business_id ||
      undefined
    );
  }, [businessId, menuData]);

  const products = useMemo(() => {
    const list = normalizeProducts(menuData)
      .map((p) => ({
        id: Number((p as any)?.id) || 0,
        name: (p as any)?.name || "Sin nombre",
        description: (p as any)?.description || undefined,
        price:
          (p as any)?.price !== undefined && (p as any)?.price !== null
            ? Number((p as any)?.price)
            : undefined,
        image_url: (p as any)?.image_url || (p as any)?.image || undefined,
        category: (p as any)?.category,
      }))
      .filter((p) => p.id);

    list.sort((a, b) => {
      const ca = productCategoryName(a);
      const cb = productCategoryName(b);
      if (ca !== cb) return ca.localeCompare(cb);
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [menuData]);

  const groups = useMemo(() => {
    const map = new Map<string, PublicProduct[]>();
    for (const p of products) {
      const key = productCategoryName(p);
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [products]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "TRANSFER" | "WEBPAY"
  >("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ code?: string; id?: string } | null>(null);

  const total = useMemo(() => {
    return cart.reduce((acc, it) => acc + (it.product.price || 0) * it.quantity, 0);
  }, [cart]);

  const addToCart = (p: PublicProduct) => {
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.product.id === p.id);
      if (idx === -1) return prev.concat({ product: p, quantity: 1 });
      const next = prev.slice();
      next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
      return next;
    });
  };

  const decFromCart = (productId: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.product.id === productId);
      if (idx === -1) return prev;
      const next = prev.slice();
      const q = next[idx].quantity - 1;
      if (q <= 0) return next.filter((x) => x.product.id !== productId);
      next[idx] = { ...next[idx], quantity: q };
      return next;
    });
  };

  const canSubmit = useMemo(() => {
    // Si no tenemos business_id, igual intentamos vía slug en query (middleware backend)
    if (!effectiveBusinessId && !slug) return false;
    if (!customer.name.trim()) return false;
    if (cart.length === 0) return false;
    if (orderType === "delivery" && !deliveryAddress.trim()) return false;
    return true;
  }, [effectiveBusinessId, slug, customer.name, cart.length, orderType, deliveryAddress]);

  const submitOrder = async () => {
    if (!canSubmit) {
      setSubmitError(
        orderType === "delivery"
          ? "Completa nombre, dirección y agrega productos."
          : "Completa nombre y agrega productos."
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSuccess(null);
    try {
      const base = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
      const url = `${base}public/orders?slug=${encodeURIComponent(slug)}`;

      const payload: any = {
        ...(effectiveBusinessId ? { business_id: effectiveBusinessId } : {}),
        order_type: orderType === "delivery" ? "DELIVERY" : "PICKUP",
        order_source: "WEB",
        payment_method: paymentMethod,
        items: cart.map((it) => ({
          product_id: it.product.id,
          quantity: it.quantity,
          unit_price: Number(it.product.price || 0),
        })),
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim() || undefined,
          email: customer.email.trim() || undefined,
          notes: orderType === "delivery" ? deliveryNotes.trim() || undefined : undefined,
          address:
            orderType === "delivery"
              ? { address: deliveryAddress.trim(), notes: deliveryNotes.trim() || undefined }
              : undefined,
        },
      };

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        throw new Error(`No se pudo crear el pedido (${resp.status})`);
      }
      const json: any = await resp.json();
      const created = json?.data ?? json;
      setSuccess({
        id: created?.id ? String(created.id) : undefined,
        code: created?.code ? String(created.code) : undefined,
      });
      setCart([]);
      setCustomer({ name: "", phone: "", email: "" });
      setDeliveryAddress("");
      setDeliveryNotes("");
      setOrderType("pickup");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error al crear el pedido");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background-light text-[#181411]">
      <div className="mx-auto max-w-5xl px-5 py-10 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Menú público
            </p>
            <h1 className="text-3xl font-black tracking-tight">
              {businessName || "Menú"}
            </h1>
            <p className="text-sm text-[#8a7560]">
              {effectiveBusinessId ? `Local: ${effectiveBusinessId}` : `Slug: ${slug}`}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e6e0db] bg-white px-4 py-3">
            <p className="text-xs font-semibold text-[#8a7560]">Total</p>
            <p className="text-xl font-black text-[#181411]">{formatClp(total)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {loadingMenu ? (
              <div className="rounded-2xl border border-[#e6e0db] bg-white p-6 text-sm text-[#8a7560]">
                Cargando menú...
              </div>
            ) : menuError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 space-y-2">
                <p className="text-sm font-semibold text-red-700">No pudimos cargar el menú.</p>
                <p className="text-sm text-red-700/80">{menuError}</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="rounded-2xl border border-[#e6e0db] bg-white p-6 space-y-2">
                <p className="text-sm font-semibold">Aún no hay un menú público disponible.</p>
                <p className="text-sm text-[#8a7560]">
                  Si este negocio está en onboarding o el menú todavía no fue publicado, vuelve más tarde.
                </p>
              </div>
            ) : (
              groups.map(([cat, items]) => (
                <div key={cat} className="rounded-2xl border border-[#e6e0db] bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black">{cat}</h2>
                    <p className="text-xs font-semibold text-[#8a7560]">{items.length} productos</p>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addToCart(p)}
                        className="text-left rounded-xl border border-[#f0ebe6] bg-[#fbf8f6] hover:bg-[#f7f3ef] transition p-4 flex gap-3"
                      >
                        <div className="size-14 rounded-xl bg-white border border-[#eee7e1] overflow-hidden flex items-center justify-center flex-shrink-0">
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-black text-[#8a7560]">—</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-black truncate">{p.name}</p>
                          {p.description && (
                            <p className="text-sm text-[#8a7560] line-clamp-2">{p.description}</p>
                          )}
                          <p className="mt-2 text-sm font-black text-[#181411]">
                            {typeof p.price === "number" ? formatClp(p.price) : "Sin precio"}
                          </p>
                          <p className="text-xs text-primary font-semibold mt-1">Agregar</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-[#e6e0db] bg-white p-5 space-y-3">
              <h3 className="text-lg font-black">Tu pedido</h3>
              {cart.length === 0 ? (
                <p className="text-sm text-[#8a7560]">Agrega productos para comenzar.</p>
              ) : (
                <div className="space-y-2">
                  {cart.map((it) => (
                    <div key={it.product.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{it.product.name}</p>
                        <p className="text-xs text-[#8a7560]">
                          {formatClp((it.product.price || 0) * it.quantity)} · {it.quantity} u.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => decFromCart(it.product.id)}
                          className="size-8 rounded-lg border border-[#e6e0db] font-black text-[#5d4b3f] hover:bg-[#f7f3ef]"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => addToCart(it.product)}
                          className="size-8 rounded-lg border border-[#e6e0db] font-black text-[#5d4b3f] hover:bg-[#f7f3ef]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#e6e0db] bg-white p-5 space-y-3">
              <h3 className="text-lg font-black">Datos</h3>
              <div className="grid grid-cols-1 gap-2">
                <input
                  className="h-11 rounded-xl border border-[#e6e0db] px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Nombre *"
                  value={customer.name}
                  onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                />
                <input
                  className="h-11 rounded-xl border border-[#e6e0db] px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Teléfono (opcional)"
                  value={customer.phone}
                  onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                />
                <input
                  className="h-11 rounded-xl border border-[#e6e0db] px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Correo (opcional)"
                  value={customer.email}
                  onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                />
                <select
                  className="h-11 rounded-xl border border-[#e6e0db] px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as any)}
                >
                  <option value="pickup">Retiro</option>
                  <option value="delivery">Delivery</option>
                </select>
                {orderType === "delivery" && (
                  <>
                    <input
                      className="h-11 rounded-xl border border-[#e6e0db] px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Dirección *"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                    <input
                      className="h-11 rounded-xl border border-[#e6e0db] px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Notas (opcional)"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                    />
                  </>
                )}
                <select
                  className="h-11 rounded-xl border border-[#e6e0db] px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                >
                  <option value="CASH">Efectivo</option>
                  <option value="DEBIT_CARD">Tarjeta débito</option>
                  <option value="CREDIT_CARD">Tarjeta crédito</option>
                  <option value="TRANSFER">Transferencia</option>
                  <option value="WEBPAY">Webpay</option>
                </select>
              </div>

              {submitError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}
              {success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  Pedido creado correctamente{success.code ? `: ${success.code}` : ""}.
                </div>
              )}

              <button
                type="button"
                disabled={!canSubmit || submitting}
                onClick={submitOrder}
                className="w-full h-11 rounded-xl bg-primary text-white font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-95"
              >
                {submitting ? "Enviando pedido..." : "Realizar pedido"}
              </button>
              <p className="text-xs text-[#8a7560]">
                Endpoints: <span className="font-semibold">`GET public/menu`</span> y{" "}
                <span className="font-semibold">`POST public/orders`</span>.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

