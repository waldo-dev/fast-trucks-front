"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useOperatingContext } from "@/lib/hooks/useOperatingContext";
import { toast } from "react-toastify";
import { businessService, categoryService, productService } from "@/lib/services";

type MenuProduct = {
  id: number;
  name: string;
  price?: string | number;
  categoryName: string;
  imageUrl?: string;
  status?: string;
};

type BusinessDto = {
  id?: string | number;
  name?: string;
  brand_name?: string;
  slug?: string;
};

export default function MenuPage() {
  const operatingContext = useOperatingContext();
  const businessId =
    operatingContext?.type === "business" ? operatingContext.business_id : undefined;

  const hasBusiness = useMemo(() => !!businessId, [businessId]);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [products, setProducts] = useState<MenuProduct[]>([]);

  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [business, setBusiness] = useState<BusinessDto | null>(null);
  const [publishing, setPublishing] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    sku: "",
    price: "",
    category_id: "",
    status: "active" as "active" | "paused" | "draft",
    image: null as File | null,
  });

  const priceFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
      });
    } catch {
      return null;
    }
  }, []);

  const formatPrice = (value: MenuProduct["price"]) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "number" && Number.isFinite(value)) {
      return priceFormatter ? priceFormatter.format(value) : `$${value}`;
    }
    const trimmed = String(value).trim();
    if (!trimmed) return undefined;
    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber)) {
      return priceFormatter ? priceFormatter.format(asNumber) : `$${trimmed}`;
    }
    return trimmed;
  };

  const slugifyBrandName = (value: string) => {
    return value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-");
  };

  useEffect(() => {
    let alive = true;
    const loadBusiness = async () => {
      if (!businessId) {
        setBusiness(null);
        return;
      }
      try {
        const resp = await businessService.get(businessId);
        const data = (resp as any)?.data ?? resp;
        if (alive) setBusiness(data as BusinessDto);
      } catch {
        if (alive) setBusiness(null);
      }
    };

    loadBusiness();
    return () => {
      alive = false;
    };
  }, [businessId]);

  useEffect(() => {
    let alive = true;
    const loadCategories = async () => {
      if (!businessId) {
        setCategories([]);
        return;
      }
      setLoadingCategories(true);
      try {
        const resp = await categoryService.listByOwner({ business_id: businessId });
        const list = (resp as any)?.data ?? resp;
        const mapped = Array.isArray(list)
          ? list.map((c: any) => ({
              id: String(c?.id ?? ""),
              name: c?.name || "Sin nombre",
            }))
          : [];
        if (alive) setCategories(mapped.filter((c) => c.id));
      } catch {
        if (alive) setCategories([]);
      } finally {
        if (alive) setLoadingCategories(false);
      }
    };

    loadCategories();
    return () => {
      alive = false;
    };
  }, [businessId]);

  useEffect(() => {
    let alive = true;

    const loadForEdit = async () => {
      if (!showEditModal || !editingProductId) return;
      setProductError(null);
      setProductLoading(true);
      try {
        const resp = await productService.get(editingProductId);
        const data = (resp as any)?.data ?? resp;
        if (!alive) return;
        setProductForm({
          name: data?.name || "",
          description: data?.description || "",
          sku: data?.sku || "",
          price: data?.price ? String(data.price) : "",
          category_id: data?.category_id ? String(data.category_id) : "",
          status: (data?.status as "active" | "paused" | "draft") || "active",
          image: null,
        });
      } catch (err) {
        if (alive) {
          setProductError(err instanceof Error ? err.message : "No se pudo cargar el producto");
        }
      } finally {
        if (alive) setProductLoading(false);
      }
    };

    loadForEdit();

    return () => {
      alive = false;
    };
  }, [showEditModal, editingProductId]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!businessId) {
        setProducts([]);
        return;
      }

      setLoadingProducts(true);
      try {
        const resp = await productService.listByOwner({
          business_id: businessId,
        });
        const list = (resp as any)?.data ?? resp;
        const mapped: MenuProduct[] = Array.isArray(list)
          ? list.map((p: any) => ({
              id: Number(p?.id) || 0,
              name: p?.name || "Sin nombre",
              price: p?.price,
              imageUrl: p?.image_url || p?.image || p?.imageUrl || p?.imageURL,
              status: p?.status ? String(p.status).toUpperCase() : undefined,
              categoryName: p?.category?.name || "Sin categoría",
            }))
          : [];
        if (alive) setProducts(mapped.filter((p) => p.id));
      } catch {
        if (alive) setProducts([]);
      } finally {
        if (alive) setLoadingProducts(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [businessId]);

  const productCount = products.length;
  const hasProducts = productCount > 0;

  const productsByCategory = useMemo(() => {
    const map = new Map<string, MenuProduct[]>();
    for (const p of products) {
      const key = p.categoryName || "Sin categoría";
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [products]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-[#181411]">
            Menú digital
          </h1>
          <p className="text-sm text-[#8a7560]">
            Sube tu menú (CSV/PDF/imagen) o cárgalo manualmente para activar los
            pedidos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!hasBusiness || publishing}
            onClick={async () => {
              if (!businessId) {
                toast.error("Selecciona un negocio para continuar");
                return;
              }
              setPublishing(true);
              try {
                let current = business as any;
                console.log("🚀 ~ MenuPage ~ current:", current)
                if (!current) {
                  const getResp = await businessService.get(businessId);
                  current = (getResp as any)?.data ?? getResp;
                }
                const brandName = current?.brand_name || current?.name || "";
                if (!brandName) {
                  toast.error("El negocio no tiene brand_name para generar el slug");
                  return;
                }
                const slug = slugifyBrandName(String(brandName));
                console.log("🚀 ~ MenuPage ~ slug:", slug)
                if (!slug) {
                  toast.error("No se pudo generar el slug desde el brand_name");
                  return;
                }

                const resp = await businessService.update(businessId, {
                  slug,
                  status: "ACTIVE",
                });
                const updated = ((resp as any)?.data ?? resp) as BusinessDto;
                setBusiness(updated);
                toast.success(`Publicado. Slug actualizado a "${slug}"`);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "No se pudo publicar");
              } finally {
                setPublishing(false);
              }
            }}
            className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-95"
          >
            {publishing ? "Publicando..." : "Publicar"}
          </button>
          <Link
            href="/menu/preview"
            aria-disabled={hasBusiness && !loadingProducts && !hasProducts}
            className={`inline-flex items-center justify-center h-10 px-4 rounded-xl border border-[#e6e0db] text-[#5d4b3f] font-bold text-sm hover:bg-[#f7f3ef] ${
              hasBusiness && !loadingProducts && !hasProducts
                ? "pointer-events-none opacity-50"
                : ""
            }`}
          >
            Vista previa
          </Link>
          <Link
            href="/menu/onboarding"
            className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-95"
          >
            Cargar menú
          </Link>
        </div>
      </div>

      {!hasBusiness && (
        <div className="rounded-2xl border border-[#e6e0db] bg-white p-5">
          <p className="text-sm font-semibold text-[#181411]">
            Selecciona un negocio para continuar.
          </p>
          <p className="text-sm text-[#8a7560] mt-1">
            Usa el selector de “Local activo” en la barra superior.
          </p>
        </div>
      )}

      {hasBusiness && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#e6e0db] bg-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-black text-[#181411]">Lo que vendes (catálogo)</p>
              <p className="text-sm text-[#8a7560]">
                {loadingProducts
                  ? "Revisando productos asociados al local activo..."
                  : hasProducts
                  ? `Detectamos ${productCount} producto(s). Ya puedes armar tu menú.`
                  : "Aún no hay productos asociados a este negocio. Crea productos para poder armar el menú."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              {hasProducts ? (
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <Link
                    href="/menu/onboarding?tab=csv"
                    className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-[#e6e0db] text-[#5d4b3f] font-bold text-xs hover:bg-[#f7f3ef]"
                  >
                    Importar CSV
                  </Link>
                  <Link
                    href="/menu/onboarding?tab=file"
                    className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-[#e6e0db] text-[#5d4b3f] font-bold text-xs hover:bg-[#f7f3ef]"
                  >
                    Subir PDF/imagen
                  </Link>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <Link
                    href="/menu/onboarding?tab=manual"
                    className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-[#e6e0db] text-[#5d4b3f] font-bold text-sm hover:bg-[#f7f3ef]"
                  >
                    Cargar manual
                  </Link>
                  <Link
                    href="/menu/onboarding?tab=manual"
                    className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-95"
                  >
                    Crear menú
                  </Link>
                </div>
              )}
            </div>
          </div>

          {hasProducts && !loadingProducts && (
            <div className="rounded-2xl border border-[#e6e0db] bg-white p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[#181411]">Tu menú (catálogo)</p>
                  <p className="text-sm text-[#8a7560]">
                    Productos asociados a este local, agrupados por categoría.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {productsByCategory.map(([categoryName, items]) => (
                  <div key={categoryName} className="rounded-xl border border-[#f0ebe6] bg-[#fbf8f6] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-[#181411]">{categoryName}</p>
                      <p className="text-xs font-semibold text-[#8a7560]">{items.length} item(s)</p>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {items.slice(0, 9).map((p) => (
                        <div
                          key={p.id}
                          className="rounded-lg border border-[#e6e0db] bg-white px-3 py-2 flex items-center gap-3"
                        >
                          <div className="size-10 rounded-lg bg-[#f7f3ef] border border-[#eee7e1] overflow-hidden flex items-center justify-center flex-shrink-0">
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-black text-[#8a7560]">—</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#181411] truncate">
                              {p.name}
                            </p>
                            <p className="text-xs text-[#8a7560]">
                              {formatPrice(p.price) ? formatPrice(p.price) : "Sin precio"}
                              {p.status ? ` · ${p.status}` : ""}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setProductError(null);
                              setEditingProductId(p.id);
                              setShowEditModal(true);
                            }}
                            className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-[#e6e0db] text-[#5d4b3f] font-bold text-xs hover:bg-[#f7f3ef] flex-shrink-0"
                          >
                            Editar
                          </button>
                        </div>
                      ))}
                    </div>
                    {items.length > 9 && (
                      <p className="mt-3 text-xs text-[#8a7560]">
                        Mostrando 9 de {items.length}. Usa la búsqueda y filtros para ver más.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loadingProducts && !hasProducts && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-semibold text-[#181411]">
                No hay productos para este local.
              </p>
              <p className="text-sm text-[#8a7560] mt-1">
                Agrega al menos un producto desde este mismo módulo “Menú” y vuelve aquí para continuar.
              </p>
            </div>
          )}

          {!loadingProducts && !hasProducts && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[#e6e0db] bg-white p-5 space-y-2">
            <p className="text-sm font-black text-[#181411]">CSV</p>
            <p className="text-sm text-[#8a7560]">
              Importa productos automáticamente desde un CSV.
            </p>
            <Link
              href="/menu/onboarding?tab=csv"
              className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-[#e6e0db] text-[#5d4b3f] font-bold text-sm hover:bg-[#f7f3ef]"
            >
              Importar CSV
            </Link>
            </div>
            <div className="rounded-2xl border border-[#e6e0db] bg-white p-5 space-y-2">
            <p className="text-sm font-black text-[#181411]">PDF / Imagen</p>
            <p className="text-sm text-[#8a7560]">
              Sube un archivo para que el equipo lo revise y lo convierta.
            </p>
            <Link
              href="/menu/onboarding?tab=file"
              className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-[#e6e0db] text-[#5d4b3f] font-bold text-sm hover:bg-[#f7f3ef]"
            >
              Subir archivo
            </Link>
            </div>
            <div className="rounded-2xl border border-[#e6e0db] bg-white p-5 space-y-2">
            <p className="text-sm font-black text-[#181411]">Manual</p>
            <p className="text-sm text-[#8a7560]">
              Si aún no tienes un archivo listo, puedes continuar con carga
              manual.
            </p>
            <Link
              href="/menu/onboarding?tab=manual"
              className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-[#e6e0db] text-[#5d4b3f] font-bold text-sm hover:bg-[#f7f3ef]"
            >
              Cargar manual
            </Link>
            </div>
          </div>
          )}

          {loadingProducts && (
            <div className="rounded-2xl border border-[#e6e0db] bg-white p-5">
              <p className="text-sm text-[#8a7560]">Cargando productos del local...</p>
            </div>
          )}
        </div>
      )}

      {showEditModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center px-4 py-6 overflow-y-auto"
          onClick={() => {
            setShowEditModal(false);
            setEditingProductId(null);
            setProductError(null);
            setProductLoading(false);
            setProductSaving(false);
            setProductForm({
              name: "",
              description: "",
              sku: "",
              price: "",
              category_id: "",
              status: "active",
              image: null,
            });
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-2xl p-6 relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-primary"
              onClick={() => {
                setShowEditModal(false);
                setEditingProductId(null);
                setProductError(null);
              }}
              aria-label="Cerrar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-lg font-bold text-[#181411] mb-2">Editar producto</h3>
            <p className="text-sm text-gray-500 mb-4">
              Actualiza los datos del producto. (Se edita con el mismo formulario que en Productos.)
            </p>

            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setProductError(null);
                if (!editingProductId) return;
                if (!businessId) {
                  toast.error("Selecciona un negocio para continuar");
                  return;
                }
                if (!productForm.name || !productForm.price || !productForm.category_id) {
                  setProductError("Nombre, precio y categoría son obligatorios");
                  return;
                }

                setProductSaving(true);
                try {
                  await toast.promise(
                    productService.update(editingProductId, {
                      name: productForm.name,
                      description: productForm.description || undefined,
                      sku: productForm.sku || undefined,
                      price: productForm.price,
                      category_id: productForm.category_id,
                      status: productForm.status,
                      business_ids: [Number(businessId)],
                    }),
                    {
                      pending: "Actualizando producto...",
                      success: "Producto actualizado",
                      error: "No se pudo guardar el producto",
                    },
                  );

                  const resp = await productService.listByOwner({ business_id: businessId });
                  const list = (resp as any)?.data ?? resp;
                  const mapped: MenuProduct[] = Array.isArray(list)
                    ? list.map((p: any) => ({
                        id: Number(p?.id) || 0,
                        name: p?.name || "Sin nombre",
                        price: p?.price,
                        imageUrl: p?.image_url || p?.image || p?.imageUrl || p?.imageURL,
                        status: p?.status ? String(p.status).toUpperCase() : undefined,
                        categoryName: p?.category?.name || "Sin categoría",
                      }))
                    : [];
                  setProducts(mapped.filter((p) => p.id));

                  setShowEditModal(false);
                  setEditingProductId(null);
                } catch (err) {
                  setProductError(err instanceof Error ? err.message : "No se pudo actualizar");
                } finally {
                  setProductSaving(false);
                }
              }}
            >
              {productLoading && (
                <div className="md:col-span-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  Cargando información del producto...
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">Nombre</label>
                <input
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  value={productForm.name}
                  onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">SKU (opcional)</label>
                <input
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  value={productForm.sku}
                  onChange={(e) => setProductForm((p) => ({ ...p, sku: e.target.value }))}
                  placeholder="Ej. SKU-123"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">Precio</label>
                <input
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-[#181411]">Descripción</label>
                <textarea
                  className="min-h-[80px] rounded-lg border border-primary/20 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">Categoría</label>
                <select
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  value={productForm.category_id}
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, category_id: e.target.value }))
                  }
                  required
                  disabled={loadingCategories}
                >
                  <option value="">
                    {loadingCategories ? "Cargando categorías..." : "Selecciona..."}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411]">Estado</label>
                <select
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  value={productForm.status}
                  onChange={(e) =>
                    setProductForm((p) => ({
                      ...p,
                      status: e.target.value as "active" | "paused" | "draft",
                    }))
                  }
                >
                  <option value="active">Activo</option>
                  <option value="paused">Pausado</option>
                  <option value="draft">Borrador</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-[#181411]">Imagen (archivo)</label>
                <input
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm file:mr-3 file:py-2 file:px-3 file:border-0 file:rounded-md file:bg-primary file:text-white"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, image: e.target.files?.[0] || null }))
                  }
                />
                <p className="text-xs text-[#8a7560]">
                  Nota: en edición, este formulario guarda los datos; la imagen se gestiona desde Productos si tu backend requiere endpoint especial.
                </p>
              </div>

              {productError && (
                <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {productError}
                </div>
              )}

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProductId(null);
                    setProductError(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={productSaving}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {productSaving ? "Guardando..." : "Guardar producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

