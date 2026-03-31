"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import { useOperatingContext } from "@/lib/hooks/useOperatingContext";
import { menuUploadService } from "@/lib/services";

type TabKey = "csv" | "file" | "manual";

const acceptMenuFile = "application/pdf,image/*";

export default function MenuOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const operatingContext = useOperatingContext();
  const businessId =
    operatingContext?.type === "business" ? operatingContext.business_id : undefined;

  const initialTab = (searchParams?.get("tab") || "csv").toLowerCase() as TabKey;
  const [tab, setTab] = useState<TabKey>(
    initialTab === "file" || initialTab === "manual" || initialTab === "csv"
      ? initialTab
      : "csv",
  );

  const [csvText, setCsvText] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [finalize, setFinalize] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    if (!businessId) return false;
    if (tab === "csv") return !!csvText.trim() || !!csvFile || !!finalize;
    if (tab === "file") return !!menuFile || !!finalize;
    return !!finalize;
  }, [businessId, tab, csvText, csvFile, menuFile, finalize]);

  const submit = async () => {
    if (!businessId) {
      toast.error("Selecciona un negocio para continuar");
      return;
    }
    if (!canSubmit) {
      toast.error("Sube un archivo o marca “Finalizar”");
      return;
    }

    setSubmitting(true);
    try {
      const resp = await menuUploadService.upload(businessId, {
        menu_csv: csvText.trim() ? csvText : undefined,
        menu_csv_file: csvFile,
        menu_file: menuFile,
        finalize,
      });
      const data = (resp as any)?.data ?? resp;

      const businessStatus = data?.business?.status ?? data?.status ?? data?.business_status;
      const statusUpper = businessStatus ? String(businessStatus).toUpperCase() : undefined;

      if (statusUpper === "ACTIVE") {
        toast.success("Menú listo. Negocio activado.");
        router.replace("/menu");
        router.refresh();
        return;
      }

      toast.success("Carga recibida. Te avisaremos cuando esté listo.");
      router.replace("/menu");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir el menú");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-[#181411]">
            Cargar menú
          </h1>
          <p className="text-sm text-[#8a7560]">
            Puedes importar por CSV, subir un PDF/imagen o finalizar y continuar con
            carga manual.
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

      <div className="rounded-2xl border border-[#e6e0db] bg-white p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {([
            { key: "csv", label: "CSV" },
            { key: "file", label: "PDF / Imagen" },
            { key: "manual", label: "Manual" },
          ] as Array<{ key: TabKey; label: string }>).map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`h-10 px-4 rounded-xl text-sm font-bold border transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-[#e6e0db] text-[#5d4b3f] hover:bg-[#f7f3ef]"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "csv" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#181411]">CSV pegado</p>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Pega aquí tu CSV (incluye encabezados)."
                className="w-full min-h-44 rounded-xl border border-[#e6e0db] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-xs text-[#8a7560]">
                Si subes archivo CSV, puedes dejar este campo vacío.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#181411]">Archivo CSV</p>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="block w-full text-sm"
              />
              {csvFile && (
                <p className="text-xs text-[#8a7560]">Seleccionado: {csvFile.name}</p>
              )}
            </div>
          </div>
        )}

        {tab === "file" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#181411]">Archivo</p>
              <input
                type="file"
                accept={acceptMenuFile}
                onChange={(e) => setMenuFile(e.target.files?.[0] || null)}
                className="block w-full text-sm"
              />
              {menuFile && (
                <p className="text-xs text-[#8a7560]">Seleccionado: {menuFile.name}</p>
              )}
              <p className="text-xs text-[#8a7560]">
                Sube PDF o imagen. Quedará en revisión si requiere procesamiento.
              </p>
            </div>
          </div>
        )}

        {tab === "manual" && (
          <div className="space-y-2">
            <p className="text-sm text-[#8a7560]">
              Puedes continuar cargando productos manualmente dentro de “Menú”. Si ya está listo,
              marca “Finalizar” para activar el negocio.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-[#e6e0db] text-[#5d4b3f] font-bold text-sm hover:bg-[#f7f3ef]"
            >
              Volver a Menú
            </Link>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm font-semibold text-[#181411]">
          <input
            type="checkbox"
            checked={finalize}
            onChange={(e) => setFinalize(e.target.checked)}
            className="size-4"
          />
          Finalizar (activar negocio)
        </label>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || submitting}
            className="h-10 px-4 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-95"
          >
            {submitting ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

