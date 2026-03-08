'use client';

import { useEffect, useState } from 'react';
import { businessService, planService } from '@/lib/services';
import { toast } from 'react-toastify';

type Business = {
  id: string | number;
  name?: string;
  brand_name?: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  created_at?: string;
  status?: string;
};

const emptyForm = {
  id: null as string | number | null,
  name: '',
  brand_name: '',
  primary_color: '',
  secondary_color: '',
  logo: null as File | null,
};

const friendlyError = (err: any, fallback: string) => {
  const msg =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    (typeof err === 'string' ? err : null);
  return msg && typeof msg === 'string' ? msg : fallback;
};

export default function AdminNegociosPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [plans, setPlans] = useState<Array<{ id: string; name: string; priceLabel: string }>>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedBilling, setSelectedBilling] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  const isEditing = form.id !== null;

  const loadBusinesses = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await businessService.list();
      const data = (resp as any)?.data ?? resp;
      setBusinesses(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = friendlyError(e, 'No se pudieron cargar los negocios.');
      setError(msg);
      toast.error(msg);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    setPlansLoading(true);
    try {
      const resp = await planService.list();
      const data = (resp as any)?.data ?? resp;
      if (Array.isArray(data)) {
        setPlans(
          data.map((p: any) => ({
            id: String(p.id),
            name: p.name || `Plan ${p.id}`,
            priceLabel: (() => {
              const price = p.price ?? p.price_monthly ?? p.amount ?? p.monthly_amount;
              if (price === undefined || price === null) return '';
              return `$${Number(price).toLocaleString('es-CL')} / mes`;
            })(),
          }))
        );
      } else {
        setPlans([]);
      }
    } catch (e) {
      setPlans([]);
      toast.error(friendlyError(e, 'No se pudieron cargar los planes.'));
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
    loadPlans();
  }, []);

  const handleInput =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = key === 'logo' ? e.target.files?.[0] ?? null : e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const startCreate = () => {
    setForm(emptyForm);
    setFormError(null);
    setSelectedPlanId('');
    setSelectedBilling('MONTHLY');
  };

  const startEdit = (b: Business) => {
    setForm({
      id: b.id,
      name: b.name || '',
      brand_name: b.brand_name || '',
      primary_color: b.primary_color || '',
      secondary_color: b.secondary_color || '',
      logo: null,
    });
    setFormError(null);
    setSelectedPlanId('');
    setSelectedBilling('MONTHLY');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim() || !form.brand_name.trim()) {
      setFormError('Nombre y Marca son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        brand_name: form.brand_name.trim(),
        primary_color: form.primary_color || undefined,
        secondary_color: form.secondary_color || undefined,
        logo: form.logo || undefined,
      };

      if (isEditing && form.id !== null) {
        await businessService.updateWithLogo(form.id, payload);
      } else {
        const created = await businessService.createWithLogo({
          ...payload,
          plan_id: selectedPlanId ? Number(selectedPlanId) : undefined,
          billing_period: selectedPlanId ? selectedBilling : undefined,
        });
        const createdData = (created as any)?.data ?? created;
        const newBusinessId = createdData?.id ?? (created as any)?.id ?? null;
        if (!newBusinessId) {
          toast.warn('Negocio creado, pero no se recibió ID.');
        }
        if (selectedPlanId) {
          toast.success('Negocio creado con plan asignado');
        } else {
          toast.success('Negocio creado con trial PRO 30 días');
        }
      }
      await loadBusinesses();
      startCreate();
    } catch (err) {
      const msg = friendlyError(err, 'No se pudo guardar el negocio.');
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">
          Gestión de clientes (multi-tenant)
        </p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#181411] dark:text-white">Negocios</h1>
            <p className="text-[#8a7560] dark:text-[#a3907d]">
              Lista, crea y edita negocios usando los endpoints disponibles.
            </p>
          </div>
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:brightness-110 transition"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Nuevo negocio
          </button>
        </div>
      </header>

      <div className="bg-white/90 backdrop-blur dark:bg-[#2d2419] rounded-2xl border border-[#e6e0db] dark:border-[#3d3226] p-6 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-bold dark:text-white">
              {isEditing ? 'Editar negocio' : 'Crear negocio'}
            </h3>
            <p className="text-sm text-[#8a7560] dark:text-[#a3907d]">
              Alta rápida con trial de 30 días PRO; opcionalmente asigna plan y ciclo de cobro.
            </p>
          </div>
          {isEditing && (
            <button onClick={startCreate} className="text-xs text-primary hover:underline">
              Cancelar edición
            </button>
          )}
        </div>
        {formError && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {formError}
          </div>
        )}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-[#4b5563] dark:text-[#a3907d]">
            Nombre
            <input
              type="text"
              value={form.name}
              onChange={handleInput('name')}
              className="px-3 py-2 rounded-lg border border-[#e6e0db] bg-white dark:bg-[#2d2419] dark:border-[#3d3226] text-sm"
              placeholder="Ej: Operfoods HQ"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#4b5563] dark:text-[#a3907d]">
            Marca
            <input
              type="text"
              value={form.brand_name}
              onChange={handleInput('brand_name')}
              className="px-3 py-2 rounded-lg border border-[#e6e0db] bg-white dark:bg-[#2d2419] dark:border-[#3d3226] text-sm"
              placeholder="Ej: Operfoods"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#4b5563] dark:text-[#a3907d]">
            Color primario
            <input
              type="color"
              value={form.primary_color || '#f97316'}
              onChange={handleInput('primary_color')}
              className="h-8 w-8 rounded border border-[#e6e0db] bg-white dark:bg-[#2d2419] dark:border-[#3d3226] cursor-pointer"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#4b5563] dark:text-[#a3907d]">
            Color secundario
            <input
              type="color"
              value={form.secondary_color || '#fbbf24'}
              onChange={handleInput('secondary_color')}
              className="h-8 w-8 rounded border border-[#e6e0db] bg-white dark:bg-[#2d2419] dark:border-[#3d3226] cursor-pointer"
            />
          </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-[#4b5563] dark:text-[#a3907d] md:col-span-2">
            Plan (opcional)
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#e6e0db] bg-white dark:bg-[#2d2419] dark:border-[#3d3226] text-sm"
              disabled={isEditing || plansLoading}
            >
              <option value="">
                {plansLoading
                  ? 'Cargando planes...'
                  : 'Trial 30 días PRO (por defecto si no eliges)'}
              </option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.priceLabel ? ` · ${p.priceLabel}` : ''}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <label className="flex items-center gap-2 text-sm text-[#4b5563] dark:text-[#a3907d]">
                <input
                  type="radio"
                  name="billing_period"
                  value="MONTHLY"
                  checked={selectedBilling === 'MONTHLY'}
                  onChange={() => setSelectedBilling('MONTHLY')}
                  className="accent-primary"
                  disabled={isEditing}
                />
                Mensual
              </label>
              <label className="flex items-center gap-2 text-sm text-[#4b5563] dark:text-[#a3907d]">
                <input
                  type="radio"
                  name="billing_period"
                  value="YEARLY"
                  checked={selectedBilling === 'YEARLY'}
                  onChange={() => setSelectedBilling('YEARLY')}
                  className="accent-primary"
                  disabled={isEditing}
                />
                Anual
              </label>
            </div>
            <span className="text-xs text-[#8a7560]">
              Al crear un negocio se asigna un trial de 30 días al plan PRO automáticamente. Selecciona
              otro plan (Básico, Estándar o Pro) y su ciclo de facturación (mensual/anual) sólo si quieres
              reemplazar el trial justo después de crear.
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#4b5563] dark:text-[#a3907d] md:col-span-2">
            Logo (opcional)
            <input
              type="file"
              accept="image/*"
              onChange={handleInput('logo')}
              className="text-sm"
            />
          </label>
          </div>
          <div className="md:col-span-2 flex items-center gap-3 justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-white text-sm font-semibold hover:brightness-110 transition disabled:opacity-60 shadow-md shadow-primary/20"
            >
              <span className="material-symbols-outlined text-base">
                {saving ? 'progress_activity' : 'save'}
              </span>
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear negocio'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-[#2d2419] rounded-2xl border border-[#e6e0db] dark:border-[#3d3226] p-6 shadow-lg space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold dark:text-white">Negocios</h3>
          {loading && <span className="text-xs text-[#8a7560]">Cargando...</span>}
        </div>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        {!loading && !businesses.length ? (
          <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">Sin negocios aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm rounded-lg overflow-hidden">
              <thead className="bg-primary/5">
                <tr className="text-left text-[#8a7560] uppercase text-xs tracking-wide">
                  <th className="py-2 px-3">Nombre</th>
                  <th className="py-2 px-3">Marca</th>
                  <th className="py-2 px-3">Colores</th>
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f2f0] dark:divide-[#3d3226] bg-white dark:bg-[#2d2419]">
                {businesses.map((b) => (
                  <tr key={b.id}>
                    <td className="py-2 px-3 text-[#181411] dark:text-white font-semibold">
                      {b.name || 'Sin nombre'}
                    </td>
                    <td className="py-2 px-3 text-[#4b5563] dark:text-[#a3907d]">
                      {b.brand_name || '—'}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        {b.primary_color && (
                          <span
                            className="inline-flex h-4 w-4 rounded-full border"
                            style={{ backgroundColor: b.primary_color }}
                          ></span>
                        )}
                        {b.secondary_color && (
                          <span
                            className="inline-flex h-4 w-4 rounded-full border"
                            style={{ backgroundColor: b.secondary_color }}
                          ></span>
                        )}
                        {!b.primary_color && !b.secondary_color && (
                          <span className="text-xs text-[#8a7560]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-xs text-[#8a7560] font-mono">{b.id}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(b)}
                          className="text-primary hover:underline text-sm inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
