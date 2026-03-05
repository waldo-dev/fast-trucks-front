'use client';

import { useEffect, useState } from 'react';
import { businessService } from '@/lib/services';

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

export default function AdminNegociosPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const isEditing = form.id !== null;

  const loadBusinesses = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await businessService.list();
      const data = (resp as any)?.data ?? resp;
      setBusinesses(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('No se pudieron cargar los negocios.');
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, []);

  const handleInput =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = key === 'logo' ? e.target.files?.[0] ?? null : e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const startCreate = () => {
    setForm(emptyForm);
    setFormError(null);
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
        await businessService.createWithLogo(payload);
      }
      await loadBusinesses();
      startCreate();
    } catch (err) {
      setFormError('No se pudo guardar el negocio.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
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

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold dark:text-white">
            {isEditing ? 'Editar negocio' : 'Crear negocio'}
          </h3>
          {isEditing && (
            <button onClick={startCreate} className="text-xs text-primary hover:underline">
              Cancelar edición
            </button>
          )}
        </div>
        {formError && <p className="text-sm text-red-600 mb-3">{formError}</p>}
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
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
          <label className="flex flex-col gap-1 text-sm text-[#4b5563] dark:text-[#a3907d] md:col-span-2">
            Logo (opcional)
            <input
              type="file"
              accept="image/*"
              onChange={handleInput('logo')}
              className="text-sm"
            />
          </label>
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:brightness-110 transition disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">
                {saving ? 'progress_activity' : 'save'}
              </span>
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear negocio'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold dark:text-white">Negocios</h3>
          {loading && <span className="text-xs text-[#8a7560]">Cargando...</span>}
        </div>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        {!loading && !businesses.length ? (
          <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">Sin negocios aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[#8a7560] uppercase text-xs tracking-wide">
                  <th className="py-2">Nombre</th>
                  <th className="py-2">Marca</th>
                  <th className="py-2">Colores</th>
                  <th className="py-2">ID</th>
                  <th className="py-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f2f0] dark:divide-[#3d3226]">
                {businesses.map((b) => (
                  <tr key={b.id}>
                    <td className="py-2 text-[#181411] dark:text-white">{b.name || 'Sin nombre'}</td>
                    <td className="py-2 text-[#4b5563] dark:text-[#a3907d]">
                      {b.brand_name || '—'}
                    </td>
                    <td className="py-2">
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
                    <td className="py-2 text-xs text-[#8a7560]">{b.id}</td>
                    <td className="py-2">
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
