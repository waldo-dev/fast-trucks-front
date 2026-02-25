'use client';

import { useEffect, useMemo, useState } from 'react';
import { businessService, promotionService, productService } from '@/lib/services';

type Promotion = {
  id: string;
  name: string;
  type?: string;
  amount?: number;
  percentage?: number;
  discount_value?: number;
  status?: 'draft' | 'active' | 'expired' | string;
  starts_at?: string;
  ends_at?: string;
  business_ids?: Array<string | number>;
  product_ids?: Array<string | number>;
  businesses?: Array<{ id: string | number; name: string }>;
  products?: Array<{ id: string | number; name: string }>;
};

const statusBadge = (status?: string) => {
  const st = (status || '').toLowerCase();
  if (st === 'active')
    return (
      <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
        Activa
      </span>
    );
  if (st === 'draft')
    return (
      <span className="px-2.5 py-1 text-xs font-semibold bg-slate-200 text-slate-700 rounded-full">
        Borrador
      </span>
    );
  return (
    <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">
      Expirada
    </span>
  );
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([]);
  const [selectedBusinessesForForm, setSelectedBusinessesForForm] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [products, setProducts] = useState<
    Array<{ key: string; name: string; productIds: string[]; businessNames: string[] }>
  >([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [editingPromotionId, setEditingPromotionId] = useState<string | null>(null);
  const [editingProductIds, setEditingProductIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    discount_type: 'PERCENTAGE',
    discount_value: '',
    start_date: '',
    end_date: '',
    active: true,
  });

  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const resp = await businessService.list();
        const list = (resp as any)?.data ?? resp;
        if (Array.isArray(list)) {
          const mapped = list.map((b: any) => ({
            id: String(b.id),
            name: b.name || b.brand_name || 'Sin nombre',
          }));
          setBusinesses(mapped);
          const allIds = mapped.map((b) => b.id);
          setSelectedBusinesses(allIds);
          setSelectedBusinessesForForm(allIds);
        }
      } catch {
        setBusinesses([]);
      }
    };
    loadBusinesses();
  }, []);

  useEffect(() => {
    const loadPromotions = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!selectedBusinesses.length) {
          setPromotions([]);
          return;
        }
        const resp = await promotionService.listByBusiness(selectedBusinesses);
        const list = (resp as any)?.data ?? resp;
        if (Array.isArray(list)) {
          setPromotions(
            list.map((p: any) => ({
              id: String(p.id ?? Math.random()),
              name: p.name || 'Sin nombre',
              type: p.discount_type || p.type || p.kind,
              amount: p.discount_value ?? p.amount,
              percentage: p.percentage,
              status: p.active === false ? 'draft' : 'active',
              starts_at: p.start_date || p.starts_at,
              ends_at: p.end_date || p.ends_at,
              business_ids: Array.isArray(p.business_ids) ? p.business_ids : [],
              businesses: Array.isArray(p.businesses) ? p.businesses : [],
              product_ids: Array.isArray(p.product_ids) ? p.product_ids : [],
              products: Array.isArray(p.products) ? p.products : [],
            }))
          );
        } else {
          setPromotions([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las promociones');
        setPromotions([]);
      } finally {
        setLoading(false);
      }
    };

    loadPromotions();
  }, [selectedBusinesses]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!showModal || !selectedBusinessesForForm.length) {
        setProducts([]);
        setSelectedProducts([]);
        return;
      }
      setLoadingProducts(true);
      try {
        const responses = await Promise.all(
          selectedBusinessesForForm.map((b) => productService.listByOwner({ business_id: b }))
        );
        const businessNameMap = businesses.reduce<Record<string, string>>((acc, b) => {
          acc[b.id] = b.name;
          return acc;
        }, {});
        const agg: Record<
          string,
          { key: string; name: string; productIds: string[]; businessNames: string[] }
        > = {};
        responses.forEach((resp, idx) => {
          const data = (resp as any)?.data ?? resp;
          if (Array.isArray(data)) {
            data.forEach((p: any) => {
              const name = p.name || 'Sin nombre';
              const key = name.toLowerCase().trim() || String(p.id ?? Math.random());
              const id = String(p.id ?? Math.random());
              const bName =
                businessNameMap[selectedBusinessesForForm[idx]] ??
                selectedBusinessesForForm[idx] ??
                'Local';
              if (!agg[key]) {
                agg[key] = {
                  key,
                  name,
                  productIds: [id],
                  businessNames: [bName],
                };
              } else {
                agg[key].productIds.push(id);
                if (!agg[key].businessNames.includes(bName)) {
                  agg[key].businessNames.push(bName);
                }
              }
            });
          }
        });
        setProducts(Object.values(agg));
      } catch {
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, [showModal, selectedBusinessesForForm, businesses]);

  const filteredPromos = useMemo(() => {
    if (!search.trim()) return promotions;
    const term = search.toLowerCase();
    return promotions.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.type || '').toLowerCase().includes(term) ||
        (p.status || '').toLowerCase().includes(term)
    );
  }, [promotions, search]);

  const total = promotions.length;
  const active = promotions.filter((p) => (p.status || '').toLowerCase() === 'active').length;
  const draft = promotions.filter((p) => (p.status || '').toLowerCase() === 'draft').length;
  const expired = total - active - draft;

  const toggleBusiness = (id: string) => {
    setSelectedBusinesses((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background-light">
      {/* Header */}
      <header className="bg-white border-b border-primary/10 px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary font-semibold">
            <span className="material-symbols-outlined text-sm">local_activity</span>
            <span>Promociones</span>
          </div>
          <h1 className="text-2xl font-black text-[#181411]">Promos y descuentos</h1>
          <p className="text-gray-500 text-sm">Gestiona vigencias, estados y a qué locales aplican.</p>
        </div>
        <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 sm:gap-3 justify-end">
          <div className="relative group w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              className="pl-10 pr-4 py-2 bg-background-light border border-primary/20 rounded-lg text-sm w-full focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
              placeholder="Buscar promoción..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-primary/20"
            onClick={() => {
              setForm({
                name: '',
                description: '',
                discount_type: 'PERCENTAGE',
                discount_value: '',
                start_date: '',
                end_date: '',
                active: true,
              });
              setSelectedProducts([]);
              setSelectedBusinessesForForm(selectedBusinesses);
              setFormError(null);
              setShowModal(true);
            }}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nueva promoción
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Total</span>
              <span className="material-symbols-outlined text-primary">local_activity</span>
            </div>
            <div className="text-3xl font-bold text-[#181411]">{total}</div>
          </div>
          <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Activas</span>
              <span className="material-symbols-outlined text-emerald-500">check_circle</span>
            </div>
            <div className="text-3xl font-bold text-[#181411]">{active}</div>
          </div>
          <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Borrador</span>
              <span className="material-symbols-outlined text-slate-500">draft</span>
            </div>
            <div className="text-3xl font-bold text-[#181411]">{draft}</div>
          </div>
          <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Expiradas</span>
              <span className="material-symbols-outlined text-amber-500">schedule</span>
            </div>
            <div className="text-3xl font-bold text-[#181411]">{expired}</div>
          </div>
        </div>

        {/* Filters for business */}
        <div className="bg-white border border-primary/10 rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-600">storefront</span>
              <p className="text-sm font-semibold text-[#181411]">Aplicar locales</p>
            </div>
            <button
              className="text-sm text-primary font-semibold hover:underline"
              onClick={() => setSelectedBusinesses(businesses.map((b) => b.id))}
            >
              Seleccionar todos
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {businesses.map((b) => {
              const checked = selectedBusinesses.includes(b.id);
              return (
                <button
                  key={b.id}
                  onClick={() => toggleBusiness(b.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    checked
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-700 border-primary/20 hover:bg-primary/5'
                  }`}
                >
                  {b.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-primary/10 rounded-xl shadow-sm">
          <div className="p-4 border-b border-primary/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-600">list_alt</span>
              <h2 className="text-lg font-bold text-[#181411]">Listado de promociones</h2>
            </div>
            <button
              className="p-2 bg-white border border-primary/10 rounded-lg hover:bg-primary/5 transition-colors text-gray-600"
              onClick={() => setSelectedBusinesses((prev) => [...prev])}
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-gray-500">Cargando promociones...</div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600 bg-red-50 border-t border-red-100">{error}</div>
          ) : filteredPromos.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No hay promociones para mostrar.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-[0.06em]">
                      <th className="px-6 py-4">Nombre</th>
                      <th className="px-6 py-4">Tipo</th>
                      <th className="px-6 py-4">Valor</th>
                      <th className="px-6 py-4">Vigencia</th>
                      <th className="px-6 py-4">Locales</th>
                      <th className="px-6 py-4">Productos</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPromos.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-sm text-[#181411]">{p.name}</div>
                          <div className="text-xs text-slate-500">ID: {p.id}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#181411]">
                          {p.type?.toString().toUpperCase() === 'FIXED'
                            ? 'Precio fijo'
                            : p.type?.toString().toUpperCase() === 'PERCENTAGE'
                            ? 'Porcentaje'
                            : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#181411]">
                          {p.type?.toString().toUpperCase() === 'FIXED'
                            ? `$${p.amount ?? p.discount_value ?? 0} (precio fijo)`
                            : `${p.percentage ?? p.discount_value ?? p.amount ?? 0}%`}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#181411]">
                          {formatDate(p.starts_at)} - {formatDate(p.ends_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#181411]">
                          {p.businesses?.length
                            ? p.businesses.map((b: any) => b.name).join(', ')
                            : p.business_ids?.length
                            ? p.business_ids.length
                            : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#181411]">
                          {Array.isArray(p.products) && p.products.length > 0
                            ? p.products.length
                            : p.product_ids?.length
                            ? p.product_ids.length
                            : 0}
                        </td>
                        <td className="px-6 py-4">{statusBadge(p.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                              <span className="material-symbols-outlined text-xl">visibility</span>
                            </button>
                            <button
                              className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                              onClick={() => {
                                setEditingPromotionId(p.id);
                                setEditingProductIds(
                                  Array.isArray(p.product_ids)
                                    ? p.product_ids.map((pid: any) => String(pid))
                                    : []
                                );
                                const bizIds = Array.isArray(p.business_ids)
                                  ? p.business_ids.map((b: any) => String(b))
                                  : [];
                                setSelectedBusinessesForForm(bizIds.length ? bizIds : selectedBusinesses);
                                setForm({
                                  name: p.name || '',
                                  description: '',
                                  discount_type: (p.type || 'PERCENTAGE').toString().toUpperCase(),
                                  discount_value: String(p.percentage ?? p.amount ?? p.discount_value ?? ''),
                                  start_date: p.starts_at || '',
                                  end_date: p.ends_at || '',
                                  active: (p.status || '').toLowerCase() === 'active',
                                });
                                setSelectedProducts([]);
                                setFormError(null);
                                setShowModal(true);
                              }}
                            >
                              <span className="material-symbols-outlined text-xl">edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-sm text-slate-500">
                Mostrando {filteredPromos.length} de {promotions.length} promociones
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => {
            setShowModal(false);
            setEditingPromotionId(null);
            setEditingProductIds([]);
            setSelectedProducts([]);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-2xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-primary"
              onClick={() => {
                setShowModal(false);
                setEditingPromotionId(null);
                setEditingProductIds([]);
                setSelectedProducts([]);
              }}
              aria-label="Cerrar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-lg font-bold text-[#181411] mb-1">
              {editingPromotionId ? 'Editar promoción' : 'Crear promoción'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Define el tipo de descuento, vigencia y locales asociados.
            </p>
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setFormError(null);
                if (!form.name.trim()) {
                  setFormError('El nombre es obligatorio.');
                  return;
                }
                if (!form.discount_value || Number(form.discount_value) <= 0) {
                  setFormError('Ingresa un valor de descuento mayor a 0.');
                  return;
                }
                if (!selectedBusinessesForForm.length) {
                  setFormError('Selecciona al menos un local.');
                  return;
                }
                if (!selectedProducts.length) {
                  setFormError('Selecciona al menos un producto para la promo.');
                  return;
                }
                setSaving(true);
                try {
                  const selectedProductIds = products
                    .filter((p) => selectedProducts.includes(p.key))
                    .flatMap((p) => p.productIds)
                    .map((id) => Number(id));
                  const payload = {
                    name: form.name.trim(),
                    description: form.description || undefined,
                    discount_type: form.discount_type,
                    discount_value: Number(form.discount_value),
                    start_date: form.start_date || null,
                    end_date: form.end_date || null,
                    active: form.active,
                    business_ids: selectedBusinessesForForm.map((b) => Number(b)),
                    product_ids: selectedProductIds,
                  };
                  if (editingPromotionId) {
                    await promotionService.update(editingPromotionId, payload);
                  } else {
                    await promotionService.create(payload);
                  }
                  setShowModal(false);
                  setForm({
                    name: '',
                    description: '',
                    discount_type: 'PERCENTAGE',
                    discount_value: '',
                    start_date: '',
                    end_date: '',
                    active: true,
                  });
                  setSelectedProducts([]);
                  setSelectedBusinessesForForm(selectedBusinesses);
                  setEditingPromotionId(null);
                  setEditingProductIds([]);
                  // refresh list
                  setSelectedBusinesses((prev) => [...prev]);
                } catch (err) {
                  setFormError(
                    err instanceof Error ? err.message : 'No se pudo guardar la promoción'
                  );
                } finally {
                  setSaving(false);
                }
              }}
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">Nombre</label>
                <input
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">Tipo de descuento</label>
                <select
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  value={form.discount_type}
                  onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value }))}
                >
                  <option value="PERCENTAGE">% Porcentaje</option>
                  <option value="FIXED">Monto fijo</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">Valor</label>
                <input
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discount_value}
                  onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">Activa</label>
                <select
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  value={form.active ? '1' : '0'}
                  onChange={(e) => setForm((p) => ({ ...p, active: e.target.value === '1' }))}
                >
                  <option value="1">Sí</option>
                  <option value="0">No</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">Inicio</label>
                <input
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">Fin</label>
                <input
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-[#181411]">Descripción</label>
                <textarea
                  className="min-h-[80px] rounded-lg border border-primary/20 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Ej. 20% OFF en hamburguesas los viernes"
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">Aplicar a locales</label>
                <div className="flex flex-wrap gap-2">
                  {businesses.map((b) => {
                    const checked = selectedBusinessesForForm.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          setSelectedBusinessesForForm((prev) =>
                            checked ? prev.filter((id) => id !== b.id) : [...prev, b.id]
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                          checked
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-primary/20 hover:bg-primary/5'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          {checked && (
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          )}
                          {b.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">
                  Productos aplicados
                </label>
                {loadingProducts ? (
                  <div className="text-sm text-gray-500">Cargando productos...</div>
                ) : products.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No se encontraron productos en los locales seleccionados.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    {products.map((p) => {
                      const checked = selectedProducts.includes(p.key);
                      return (
                        <label
                          key={p.key}
                          className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:border-primary/40"
                        >
                          <input
                            type="checkbox"
                            className="text-primary border-gray-300 rounded focus:ring-primary"
                            checked={checked}
                            onChange={() =>
                              setSelectedProducts((prev) =>
                                checked ? prev.filter((id) => id !== p.key) : [...prev, p.key]
                              )
                            }
                          />
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-700">{p.name}</span>
                            {p.businessNames.length > 0 && (
                              <span className="text-xs text-gray-400">
                                {p.businessNames.join(', ')}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 flex justify-end gap-2">
                {formError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex-1">
                    {formError}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Creando...' : 'Crear promoción'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
