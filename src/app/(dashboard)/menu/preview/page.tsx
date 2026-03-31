"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useOperatingContext } from "@/lib/hooks/useOperatingContext";
import { businessService, menuUploadService } from "@/lib/services";

type BusinessDto = {
  id?: string | number;
  name?: string;
  brand_name?: string;
  slug?: string;
  status?: string;
};

export default function MenuPreviewPage() {
  const operatingContext = useOperatingContext();
  const businessId =
    operatingContext?.type === "business" ? operatingContext.business_id : undefined;

  const [loading, setLoading] = useState(false);
  const [business, setBusiness] = useState<BusinessDto | null>(null);

  const status = useMemo(() => {
    const raw = business?.status;
    return raw ? String(raw).toUpperCase() : undefined;
  }, [business?.status]);

  const publicPath = useMemo(() => {
    const id = businessId ? String(businessId) : undefined;
    const slug = business?.slug ? String(business.slug) : undefined;
    const key = slug || id;
    return key ? `/m/${encodeURIComponent(key)}` : undefined;
  }, [businessId, business?.slug]);

  useEffect(() => {
    if (!businessId) return;
    let active = true;
    setLoading(true);
    businessService
      .get(businessId)
      .then((resp) => {
        const data = (resp as any)?.data ?? resp;
        if (active) setBusiness(data as BusinessDto);
      })
      .catch(() => {
        if (active) setBusiness(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [businessId]);

  const publish = async () => {
    if (!businessId) {
      toast.error("Selecciona un negocio para continuar");
      return;
    }
    setLoading(true);
    try {
      const resp = await menuUploadService.setStatus(businessId, "ACTIVE");
      const data = (resp as any)?.data ?? resp;
      const updated = (data?.business ?? data) as BusinessDto;
      setBusiness(updated);
      toast.success("Menú publicado. Negocio activado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo publicar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-[#181411]">
            Vista previa del menú
          </h1>
          <p className="text-sm text-[#8a7560]">
            Revisa el estado del negocio y confirma cuando el menú esté listo para
            clientes.
          </p>
        </div>
        <Link
          href="/menu"
          className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-[#e6e0db] text-[#5d4b3f] font-bold text-sm hover:bg-[#f7f3ef]"
        >
          Volver
        </Link>
      </div>

      {!businessId && (
        <div className="rounded-2xl border border-[#e6e0db] bg-white p-5">
          <p className="text-sm font-semibold text-[#181411]">
            Selecciona un negocio para continuar.
          </p>
          <p className="text-sm text-[#8a7560] mt-1">
            Usa el selector de “Local activo” en la barra superior.
          </p>
        </div>
      )}

      {businessId && (
        <div className="rounded-2xl border border-[#e6e0db] bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-black text-[#181411]">
                {business?.name || business?.brand_name || `Negocio ${businessId}`}
              </p>
              <p className="text-sm text-[#8a7560]">
                Estado:{" "}
                <span className="font-bold text-[#181411]">
                  {loading ? "Cargando..." : status || "—"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {publicPath && (
                <Link
                  href={publicPath}
                  target="_blank"
                  className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-[#e6e0db] text-[#5d4b3f] font-bold text-sm hover:bg-[#f7f3ef]"
                >
                  Ver público
                </Link>
              )}
              <button
                type="button"
                onClick={publish}
                disabled={loading}
                className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-95"
              >
                Publicar / Confirmar
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#f0ebe6] bg-[#fbf8f6] p-4">
            <p className="text-sm font-semibold text-[#181411]">Nota</p>
            <p className="text-sm text-[#8a7560] mt-1">
              En esta etapa la “vista previa” es de estado y publicación. En el
              siguiente paso conectamos el render real del menú (categorías,
              productos, precios) desde el endpoint del menú.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

