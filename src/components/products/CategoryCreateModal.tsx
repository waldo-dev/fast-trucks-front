"use client";

import { useState } from "react";
import { categoryService } from "@/lib/services";
import { readOperatingContext } from "@/lib/operatingContext";

export type CategoryCreateModalProps = {
  open: boolean;
  onClose: () => void;
  /** Ej. tras guardar, recargar lista en el padre */
  onCreated?: () => void | Promise<void>;
  /** Mensaje al abrir desde “primero crea categoría” u otro flujo */
  contextHint?: string | null;
};

export function CategoryCreateModal({
  open,
  onClose,
  onCreated,
  contextHint,
}: CategoryCreateModalProps) {
  const [newCategory, setNewCategory] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  if (!open) return null;

  const close = () => {
    setNewCategory("");
    setCategoryError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-start justify-center px-4 py-6 overflow-y-auto"
      onClick={close}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-primary/10 w-full max-w-md p-6 relative max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-3 right-3 text-gray-500 hover:text-primary"
          onClick={close}
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <h3 className="text-lg font-bold text-[#181411] mb-2">Crear nueva categoría</h3>
        <p className="text-sm text-gray-500 mb-4">Ingresa el nombre de la categoría.</p>
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newCategory.trim()) return;
            const ctx = readOperatingContext();
            const businessId =
              ctx?.type === "business" && ctx.business_id
                ? Number(ctx.business_id)
                : undefined;
            if (!businessId || Number.isNaN(businessId)) {
              setCategoryError("No hay un local seleccionado en el contexto.");
              return;
            }
            setSavingCategory(true);
            setCategoryError(null);
            try {
              await categoryService.create({
                name: newCategory.trim(),
                business_id: businessId,
              });
              setNewCategory("");
              await onCreated?.();
              close();
            } catch (err) {
              setCategoryError(
                err instanceof Error ? err.message : "No se pudo crear la categoría",
              );
            } finally {
              setSavingCategory(false);
            }
          }}
        >
          {contextHint && (
            <div className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {contextHint}
            </div>
          )}
          <input
            className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Ej. Bebidas"
            required
          />
          {categoryError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {categoryError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingCategory}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingCategory ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
