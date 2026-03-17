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
  const [editForm, setEditForm] = useState(emptyForm);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [plans, setPlans] = useState<Array<{ id: string; name: string; priceLabel: string }>>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedBilling, setSelectedBilling] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | number | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditForm(emptyForm);
  };

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

  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(businesses.length / PAGE_SIZE));
  const paginatedBusinesses = businesses.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    loadBusinesses();
    loadPlans();
  }, []);

  useEffect(() => {
    if (businesses.length === 0) {
      setCurrentPage(1);
      return;
    }
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [businesses.length, currentPage, totalPages]);

  const handleInput =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = key === 'logo' ? e.target.files?.[0] ?? null : e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const handleEditInput =
    (key: keyof typeof editForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = key === 'logo' ? e.target.files?.[0] ?? null : e.target.value;
      setEditForm((prev) => ({ ...prev, [key]: value }));
    };

  const startCreate = () => {
    setForm(emptyForm);
    setFormError(null);
    setSelectedPlanId('');
    setSelectedBilling('MONTHLY');
  };

  const startEdit = (b: Business) => {
    setEditForm({
      id: b.id,
      name: b.name || '',
      brand_name: b.brand_name || '',
      primary_color: b.primary_color || '',
      secondary_color: b.secondary_color || '',
      logo: null,
    });
    setFormError(null);
    setEditModalOpen(true);
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.brand_name.trim()) {
      toast.error('Nombre y Marca son obligatorios.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        brand_name: editForm.brand_name.trim(),
        primary_color: editForm.primary_color || undefined,
        secondary_color: editForm.secondary_color || undefined,
        logo: editForm.logo || undefined,
      };
      await businessService.updateWithLogo(editForm.id!, payload);
      toast.success('Negocio actualizado');
      await loadBusinesses();
      setEditModalOpen(false);
      setEditForm(emptyForm);
    } catch (err) {
      toast.error(friendlyError(err, 'No se pudo actualizar el negocio.'));
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (b: Business) => {
    setConfirmDeleteId(b.id);
    setConfirmDeleteName(b.name || b.brand_name || `Negocio ${b.id}`);
  };

  const closeDeleteModal = () => {
    setConfirmDeleteId(null);
    setConfirmDeleteName('');
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    try {
      await businessService.remove(confirmDeleteId);
      toast.success('Negocio eliminado');
      await loadBusinesses();
      closeDeleteModal();
    } catch (err) {
      toast.error(friendlyError(err, 'No se pudo eliminar el negocio.'));
    } finally {
      setDeletingId(null);
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
        </div>
      </header>

      <div className="bg-white/90 backdrop-blur dark:bg-[#2d2419] rounded-2xl border border-[#e6e0db] dark:border-[#3d3226] p-6 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-bold dark:text-white">Crear negocio</h3>
            <p className="text-sm text-[#8a7560] dark:text-[#a3907d]">
              Alta rápida con trial de 30 días PRO; opcionalmente asigna plan y ciclo de cobro.
            </p>
          </div>
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
          {/* Campos de color deshabilitados temporalmente
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
          */}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-[#4b5563] dark:text-[#a3907d] md:col-span-2">
            Plan (opcional)
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#e6e0db] bg-white dark:bg-[#2d2419] dark:border-[#3d3226] text-sm"
              disabled={plansLoading}
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
              {saving ? 'Guardando...' : 'Crear negocio'}
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
          <>
            <div className="md:hidden space-y-3">
              {paginatedBusinesses.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-[#e6e0db] dark:border-[#3d3226] bg-white dark:bg-[#2d2419] p-4 shadow-sm flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-base font-semibold text-[#181411] dark:text-white">
                        {b.name || 'Sin nombre'}
                      </span>
                      <span className="text-sm text-[#4b5563] dark:text-[#a3907d]">
                        {b.brand_name || '—'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8a7560] font-mono">ID: {b.id}</span>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => startEdit(b)}
                      className="text-primary hover:underline text-sm inline-flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => openDeleteModal(b)}
                      disabled={deletingId === b.id}
                      className="text-red-600 hover:underline text-sm inline-flex items-center gap-2 disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                      {deletingId === b.id ? 'Eliminando...' : ''}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm rounded-lg overflow-hidden">
                  <thead className="bg-primary/5">
                    <tr className="text-left text-[#8a7560] uppercase text-xs tracking-wide">
                      <th className="py-2 px-3">Nombre</th>
                      <th className="py-2 px-3">Marca</th>
                      <th className="py-2 px-3">ID</th>
                      <th className="py-2 px-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5f2f0] dark:divide-[#3d3226] bg-white dark:bg-[#2d2419]">
                    {paginatedBusinesses.map((b) => (
                      <tr key={b.id}>
                        <td className="py-2 px-3 text-[#181411] dark:text-white font-semibold">
                          {b.name || 'Sin nombre'}
                        </td>
                        <td className="py-2 px-3 text-[#4b5563] dark:text-[#a3907d]">
                          {b.brand_name || '—'}
                        </td>
                        <td className="py-2 px-3 text-xs text-[#8a7560] font-mono">{b.id}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(b)}
                              className="text-primary hover:underline text-sm inline-flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                              onClick={() => openDeleteModal(b)}
                              disabled={deletingId === b.id}
                              className="text-red-600 hover:underline text-sm inline-flex items-center gap-2 disabled:opacity-60"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                              {deletingId === b.id ? 'Eliminando...' : ''}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-[#8a7560]">
                  Mostrando{' '}
                  {businesses.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}-
                  {Math.min(currentPage * PAGE_SIZE, businesses.length)} de {businesses.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1 || loading}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-3 py-1 rounded-lg border border-[#e6e0db] text-xs text-[#181411] disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages || loading}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1 rounded-lg border border-[#e6e0db] text-xs text-[#181411] disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
          </>
        )}
      </div>

      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#181411] dark:text-white">Editar negocio</h3>
                <p className="text-sm text-[#8a7560] dark:text-[#a3907d]">
                  Actualiza nombre, marca o logo. El plan se gestiona desde suscripciones.
                </p>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 rounded-lg hover:bg-[#f5f2f0] dark:hover:bg-[#3d3226]"
                aria-label="Cerrar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <label className="flex flex-col gap-1 text-sm text-[#4b5563] dark:text-[#a3907d]">
                  Nombre
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={handleEditInput('name')}
                    className="px-3 py-2 rounded-lg border border-[#e6e0db] bg-white dark:bg-[#2d2419] dark:border-[#3d3226] text-sm"
                    placeholder="Ej: Operfoods HQ"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-[#4b5563] dark:text-[#a3907d]">
                  Marca
                  <input
                    type="text"
                    value={editForm.brand_name}
                    onChange={handleEditInput('brand_name')}
                    className="px-3 py-2 rounded-lg border border-[#e6e0db] bg-white dark:bg-[#2d2419] dark:border-[#3d3226] text-sm"
                    placeholder="Ej: Operfoods"
                    required
                  />
                </label>
                {/* Campos de color deshabilitados temporalmente en edición */}
              </div>

              <label className="flex flex-col gap-1 text-sm text-[#4b5563] dark:text-[#a3907d]">
                Logo (opcional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditInput('logo')}
                  className="text-sm"
                />
              </label>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 h-10 rounded-lg border border-[#e6e0db] text-[#5d4b3f] hover:bg-[#f7f3ef] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:brightness-110 transition disabled:opacity-60 shadow-md shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-base">
                    {saving ? 'progress_activity' : 'save'}
                  </span>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#181411] dark:text-white">Eliminar negocio</h3>
              <p className="text-sm text-[#8a7560] dark:text-[#a3907d]">
                ¿Seguro que deseas eliminar <span className="font-semibold">{confirmDeleteName}</span>? Solo ADMIN puede hacerlo.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="px-4 h-10 rounded-lg border border-[#e6e0db] text-[#5d4b3f] hover:bg-[#f7f3ef] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingId === confirmDeleteId}
                className="px-4 h-10 rounded-lg bg-red-600 text-white hover:brightness-95 transition-colors disabled:opacity-60"
              >
                {deletingId === confirmDeleteId ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
