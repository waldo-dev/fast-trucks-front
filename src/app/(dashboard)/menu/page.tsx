"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CategoryCreateModal } from "@/components/products/CategoryCreateModal";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { useOperatingContext } from "@/lib/hooks/useOperatingContext";
import { toast } from "react-toastify";
import {
  businessService,
  categoryService,
  productService,
  publicMenuService,
} from "@/lib/services";

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

  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; icon?: string }>
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [business, setBusiness] = useState<BusinessDto | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryModalHint, setCategoryModalHint] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

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

  const handleDownloadMenuTemplate = async () => {
    setTemplateDownloading(true);
    try {
      const { blob, filename } = await publicMenuService.downloadMenuTemplate();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Plantilla descargada");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo descargar la plantilla",
      );
    } finally {
      setTemplateDownloading(false);
    }
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

  const reloadCategories = useCallback(async () => {
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
            icon: "category" as const,
          }))
        : [];
      setCategories(mapped.filter((c) => c.id));
    } catch {
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, [businessId]);

  const reloadMenuProducts = useCallback(async () => {
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
      setProducts(mapped.filter((p) => p.id));
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [businessId]);

  const openAddCategory = () => {
    if (!businessId) {
      toast.error("Selecciona un negocio para continuar");
      return;
    }
    setCategoryModalHint(null);
    setShowCategoryModal(true);
  };

  const openAddProduct = () => {
    if (!businessId) {
      toast.error("Selecciona un negocio para continuar");
      return;
    }
    if (!categories.length) {
      setCategoryModalHint("Primero crea una categoría para poder añadir productos.");
      setShowCategoryModal(true);
      return;
    }
    setEditingProductId(null);
    setShowProductModal(true);
  };

  const openEditProduct = (id: number) => {
    setEditingProductId(id);
    setShowProductModal(true);
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
    void reloadCategories();
  }, [reloadCategories]);

  useEffect(() => {
    void reloadMenuProducts();
  }, [reloadMenuProducts]);

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
            Sube tu menú (CSV/PDF/imagen) o crea categorías y productos desde aquí para activar
            los pedidos.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#8a7560]">
            <span className="font-semibold text-[#5d4b3f]">¿No tienes menú?</span>
            <span>Empieza con nuestra plantilla CSV y complétala en minutos.</span>
            <button
              type="button"
              disabled={templateDownloading}
              onClick={handleDownloadMenuTemplate}
              className="inline-flex items-center text-primary font-bold underline decoration-primary/40 underline-offset-2 hover:decoration-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {templateDownloading ? "Descargando…" : "Descargar plantilla CSV"}
            </button>
          </div>
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
          {/*<Link
            href="/menu/preview"
            aria-disabled={hasBusiness && !loadingProducts && !hasProducts}
            className={`inline-flex items-center justify-center h-10 px-4 rounded-xl border border-[#e6e0db] text-[#5d4b3f] font-bold text-sm hover:bg-[#f7f3ef] ${
              hasBusiness && !loadingProducts && !hasProducts
                ? "pointer-events-none opacity-50"
                : ""
            }`}
          >
            Vista previa
          </Link>*/}
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
          {hasProducts && !loadingProducts && (
            <div className="rounded-2xl border border-[#e6e0db] bg-white p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[#181411]">Tu menú (catálogo)</p>
                  <p className="text-sm text-[#8a7560]">
                    Productos asociados a este local, agrupados por categoría.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 justify-end shrink-0">
                  <button
                    type="button"
                    onClick={openAddCategory}
                    className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-[#e6e0db] text-[#5d4b3f] font-bold text-xs hover:bg-[#f7f3ef]"
                  >
                    Agregar categoría
                  </button>
                  <button
                    type="button"
                    onClick={openAddProduct}
                    className="inline-flex items-center justify-center h-9 px-3 rounded-lg bg-primary text-white font-bold text-xs hover:brightness-95"
                  >
                    Añadir producto
                  </button>
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
                          </div>
                          <button
                            type="button"
                            onClick={() => openEditProduct(p.id)}
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
                Usa los botones de abajo: categoría, producto, importar CSV o subir PDF/imagen.
              </p>
            </div>
          )}

          {!loadingProducts && !hasProducts && (
            <div className="rounded-2xl border border-[#e6e0db] bg-white p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-black text-[#181411]">Cargar tu menú</p>
                <p className="text-sm text-[#8a7560]">
                  Añade categorías y productos con el mismo formulario que en Productos, importa un CSV
                  o sube un PDF o imagen para revisión.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={openAddCategory}
                  className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-[#e6e0db] text-[#5d4b3f] font-bold text-sm hover:bg-[#f7f3ef]"
                >
                  Agregar categoría
                </button>
                <button
                  type="button"
                  onClick={openAddProduct}
                  className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-95"
                >
                  Añadir producto
                </button>
                <Link
                  href="/menu/onboarding?tab=csv"
                  className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-[#e6e0db] text-[#5d4b3f] font-bold text-sm hover:bg-[#f7f3ef]"
                >
                  Importar CSV
                </Link>
                <Link
                  href="/menu/onboarding?tab=file"
                  className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-[#e6e0db] text-[#5d4b3f] font-bold text-sm hover:bg-[#f7f3ef]"
                >
                  Subir PDF/imagen
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

      <CategoryCreateModal
        open={showCategoryModal}
        contextHint={categoryModalHint}
        onClose={() => {
          setShowCategoryModal(false);
          setCategoryModalHint(null);
        }}
        onCreated={reloadCategories}
      />

      <ProductFormModal
        open={showProductModal}
        editingProductId={editingProductId}
        categories={categories}
        loadingCategories={loadingCategories}
        onClose={() => {
          setShowProductModal(false);
          setEditingProductId(null);
        }}
        onSaved={reloadMenuProducts}
        onRequestNewCategory={() => {
          setCategoryModalHint(null);
          setShowCategoryModal(true);
        }}
      />
    </div>
  );
}

