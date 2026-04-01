"use client";

import { useEffect, useState } from "react";
import { productService } from "@/lib/services";
import { readOperatingContext } from "@/lib/operatingContext";
import { toast } from "react-toastify";

export type ProductFormCategoryOption = { id: string; name: string; icon?: string };

const emptyForm = {
  name: "",
  description: "",
  sku: "",
  price: "",
  category_id: "",
  status: "active" as "active" | "paused" | "draft",
  options: "",
  image: null as File | null,
};

export type ProductFormModalProps = {
  open: boolean;
  editingProductId: number | null;
  categories: ProductFormCategoryOption[];
  loadingCategories?: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onRequestNewCategory?: () => void;
};

export function ProductFormModal({
  open,
  editingProductId,
  categories,
  loadingCategories,
  onClose,
  onSaved,
  onRequestNewCategory,
}: ProductFormModalProps) {
  const [productForm, setProductForm] = useState(emptyForm);
  const [productError, setProductError] = useState<string | null>(null);
  const [productSaving, setProductSaving] = useState(false);
  const [productLoading, setProductLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (editingProductId) {
      let cancelled = false;
      setProductLoading(true);
      setProductError(null);
      productService
        .get(editingProductId)
        .then((resp: any) => {
          if (cancelled) return;
          const data = resp?.data ?? resp;
          setProductForm({
            name: data?.name || "",
            description: data?.description || "",
            sku: data?.sku || "",
            price: data?.price ? String(data.price) : "",
            category_id: data?.category_id ? String(data.category_id) : "",
            status: (data?.status as "active" | "paused" | "draft") || "active",
            options: typeof data?.options === "string" ? data.options : "",
            image: null,
          });
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setProductError(
              err instanceof Error ? err.message : "No se pudo cargar el producto",
            );
          }
        })
        .finally(() => {
          if (!cancelled) setProductLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }

    setProductForm(emptyForm);
    setProductError(null);
    setProductLoading(false);
    return undefined;
  }, [open, editingProductId]);

  if (!open) return null;

  const resetAndClose = () => {
    setProductForm(emptyForm);
    setProductError(null);
    setProductLoading(false);
    setProductSaving(false);
    onClose();
  };

  const categorySelectOptions = categories.filter((c) => c.id !== "");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center px-4 py-6 overflow-y-auto"
      onClick={resetAndClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-2xl p-6 relative max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-3 right-3 text-gray-500 hover:text-primary"
          onClick={resetAndClose}
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <h3 className="text-lg font-bold text-[#181411] mb-2">
          {editingProductId ? "Editar producto" : "Crear nuevo producto"}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Completa los datos y sube una imagen (opcional).
        </p>
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setProductError(null);
            if (!productForm.name || !productForm.price || !productForm.category_id) {
              setProductError("Nombre, precio y categoría son obligatorios");
              return;
            }
            const ctx = readOperatingContext();
            const ctxBusinessId =
              ctx?.type === "business" && ctx.business_id
                ? Number(ctx.business_id)
                : undefined;
            if (!ctxBusinessId || Number.isNaN(ctxBusinessId)) {
              setProductError("No hay un local seleccionado en el contexto.");
              return;
            }
            setProductSaving(true);
            try {
              let promise: Promise<unknown>;
              if (editingProductId) {
                promise = productService.update(editingProductId, {
                  name: productForm.name,
                  description: productForm.description || undefined,
                  sku: productForm.sku || undefined,
                  price: productForm.price,
                  category_id: productForm.category_id,
                  status: productForm.status,
                  options: productForm.options || undefined,
                  business_ids: [ctxBusinessId],
                });
              } else {
                promise = productService.createWithImage({
                  name: productForm.name,
                  description: productForm.description || undefined,
                  sku: productForm.sku || undefined,
                  price: productForm.price,
                  category_id: productForm.category_id,
                  status: productForm.status,
                  options: productForm.options || undefined,
                  business_id: ctxBusinessId,
                  image: productForm.image || undefined,
                });
              }

              await toast.promise(promise, {
                pending: editingProductId ? "Actualizando producto..." : "Creando producto...",
                success: editingProductId ? "Producto actualizado" : "Producto creado",
                error: "No se pudo guardar el producto",
              });

              await onSaved();
              resetAndClose();
            } catch (err) {
              setProductError(
                err instanceof Error ? err.message : "No se pudo crear el producto",
              );
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
              placeholder="Ej. SKU-123 (vacío = auto)"
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
              onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-semibold text-[#181411]">Categoría</label>
              {onRequestNewCategory ? (
                <button
                  type="button"
                  onClick={onRequestNewCategory}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  + Nueva categoría
                </button>
              ) : null}
            </div>
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
              {categorySelectOptions.map((c) => (
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
          </div>
          {productError && (
            <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {productError}
            </div>
          )}
          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetAndClose}
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
  );
}
