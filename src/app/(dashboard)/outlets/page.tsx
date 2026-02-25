'use client';

import { useEffect, useState } from 'react';
import { businessService } from '@/lib/services';
import { OutletCard } from '@/components/outlets/OutletCard';
import { OutletTabs } from '@/components/outlets/OutletTabs';
import { StatsOverview } from '@/components/outlets/StatsOverview';
import { AddOutletCard } from '@/components/outlets/AddOutletCard';

export default function OutletsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingOutletId, setEditingOutletId] = useState<number | null>(null);
  const [outletsData, setOutletsData] = useState<
    Array<{
      id: number;
      name: string;
      address: string;
      type: 'Pizzeria' | 'Food Truck' | 'Ghost Kitchen';
      status: 'active' | 'inactive';
      statusLabel: string;
      statusColor: string;
      image: string;
      todayRevenue: string;
      pendingOrders: number;
      hours?: string;
      warning?: string;
    }>
  >([]);
  const [loadingOutlets, setLoadingOutlets] = useState(false);
  const [form, setForm] = useState({
    name: '',
    brand_name: '',
    primary_color: '',
    secondary_color: '',
    logo: null as File | null,
  });

  const tabs = [
    { label: 'Todos los Locales', count: outletsData.length, id: 'all' },
  ];

  const stats = [
    {
      icon: 'payments',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      label: 'Ingresos Totales',
      value: '$14,530.22',
      badge: {
        text: '+12% vs Año Pasado',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      },
    },
    {
      icon: 'shopping_cart',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      label: 'Pedidos Activos',
      value: '44',
      badge: {
        text: 'Alto Volumen',
        color: 'text-primary',
        bgColor: 'bg-primary/5',
      },
    },
    {
      icon: 'groups',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      label: 'Personal en Turno',
      value: '18/22',
    },
    {
      icon: 'schedule',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      label: 'Tiempo Prom. Preparación',
      value: '14.5m',
    },
  ];

  const handleEdit = (id: number) => {
    const outlet = outletsData.find((o) => o.id === id);
    if (!outlet) return;
    setEditingOutletId(id);
    setForm({
      name: outlet.name || '',
      brand_name: outlet.address || '',
      primary_color: '',
      secondary_color: '',
      logo: null,
    });
    setShowModal(true);
  };

  const handleToggleStatus = (id: number) => {
    // Placeholder: sin acción real
    console.log('Cambiar estado local:', id);
  };

  const handleAddOutlet = () => {
    setShowModal(true);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, logo: file }));
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    if (!form.name || !form.brand_name) {
      setCreateError('Nombre y marca son obligatorios');
      return;
    }
    setCreating(true);
    try {
      if (editingOutletId) {
        await businessService.updateWithLogo(editingOutletId, {
          name: form.name,
          brand_name: form.brand_name,
          primary_color: form.primary_color || undefined,
          secondary_color: form.secondary_color || undefined,
          logo: form.logo || undefined,
        });
        setCreateSuccess('Local actualizado correctamente');
      } else {
        await businessService.createWithLogo({
          name: form.name,
          brand_name: form.brand_name,
          primary_color: form.primary_color || undefined,
          secondary_color: form.secondary_color || undefined,
          logo: form.logo || undefined,
        });
        setCreateSuccess('Local creado correctamente');
      }
      // Refresca la lista
      await loadOutlets();
      setForm({
        name: '',
        brand_name: '',
        primary_color: '',
        secondary_color: '',
        logo: null,
      });
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : 'No se pudo crear el local'
      );
    } finally {
      setCreating(false);
      setEditingOutletId(null);
      setShowModal(false);
    }
  };

  const loadOutlets = async () => {
      setLoadingOutlets(true);
      try {
        const data = await businessService.list();
        const payload = (data as any)?.data ?? data;
        const mapped =
          Array.isArray(payload) && payload.length
            ? payload.map((biz: any) => ({
                id: Number(biz.id) || Math.random(),
                name: biz.name || biz.brand_name || 'Sin nombre',
                address: biz.brand_name || 'Sin dirección',
                type: 'Pizzeria' as const,
                status: 'active' as const,
                statusLabel: 'Activo',
                statusColor: 'text-primary',
                image:
                  biz.logo_url ||
                  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80',
                todayRevenue: '$0.00',
                pendingOrders: 0,
                hours: biz.hours || '',
              }))
            : [];
        setOutletsData(mapped);
      } catch {
        setOutletsData([]);
      } finally {
        setLoadingOutlets(false);
      }
    };

  useEffect(() => {
    loadOutlets();
  }, []);

  return (
    <div className="flex-1 px-10 py-8 max-w-[1440px] mx-auto w-full">
      {/* Page Header Area */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#181411] text-4xl font-extrabold tracking-tight">
            Gestionar Locales de Comida
          </h1>
          <p className="text-[#8a7560] text-lg font-medium">
            Centro de control y visión general para tus 12 ubicaciones activas.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl h-12 px-6 bg-white border border-[#e6e0db] text-[#181411] font-bold hover:bg-gray-50 transition-all shadow-sm">
            <span className="material-symbols-outlined">filter_list</span>
            <span>Filtros</span>
          </button>
          <button
            onClick={handleAddOutlet}
            className="flex items-center gap-2 rounded-xl h-12 px-6 bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span>Agregar Nuevo Local</span>
          </button>
        </div>
      </div>

      {/* Tabs Section */}
      <OutletTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Outlet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loadingOutlets && (
          <div className="col-span-1 md:col-span-2 xl:col-span-3 bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-6 text-sm text-[#8a7560]">
            Cargando locales...
          </div>
        )}
        {!loadingOutlets && outletsData.length === 0 && (
          <div className="col-span-1 md:col-span-2 xl:col-span-3 bg-white dark:bg-[#2d2419] border border-dashed border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-6 text-sm text-[#8a7560] flex items-center justify-between">
            <span>No hay locales disponibles. Crea el primero para comenzar.</span>
            <button
              onClick={handleAddOutlet}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Nuevo local
            </button>
          </div>
        )}
        {!loadingOutlets &&
          outletsData.map((outlet) => (
            <OutletCard
              key={outlet.id}
              outlet={outlet}
              onEdit={() => handleEdit(outlet.id)}
              onToggleStatus={() => handleToggleStatus(outlet.id)}
            />
          ))}
        <AddOutletCard onClick={handleAddOutlet} />
      </div>

      {/* Stats Overview Summary */}
      <StatsOverview stats={stats} />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl shadow-2xl max-w-3xl w-full p-6 relative">
            <button
              className="absolute top-4 right-4 text-[#8a7560] hover:text-primary"
              onClick={() => {
                setShowModal(false);
                setCreateError(null);
                setCreateSuccess(null);
              }}
              aria-label="Cerrar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="mb-4">
              <h2 className="text-xl font-bold text-[#181411] dark:text-white">
                {editingOutletId ? 'Editar local' : 'Crear nuevo local'}
              </h2>
              <p className="text-sm text-[#8a7560] dark:text-[#a3907d]">
                Envía el logo como archivo y define colores principales.
              </p>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleCreateBusiness}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411] dark:text-white">Nombre</label>
                <input
                  className="h-11 rounded-lg border border-[#e6e0db] dark:border-[#3d3226] bg-white dark:bg-[#2d2419] px-3 text-sm"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411] dark:text-white">Marca</label>
                <input
                  className="h-11 rounded-lg border border-[#e6e0db] dark:border-[#3d3226] bg-white dark:bg-[#2d2419] px-3 text-sm"
                  value={form.brand_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, brand_name: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411] dark:text-white">Color primario</label>
                <input
                  className="h-11 rounded-lg border border-[#e6e0db] dark:border-[#3d3226] bg-white dark:bg-[#2d2419] px-3 text-sm"
                  value={form.primary_color}
                  onChange={(e) => setForm((prev) => ({ ...prev, primary_color: e.target.value }))}
                  placeholder="#EC4913"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411] dark:text-white">Color secundario</label>
                <input
                  className="h-11 rounded-lg border border-[#e6e0db] dark:border-[#3d3226] bg-white dark:bg-[#2d2419] px-3 text-sm"
                  value={form.secondary_color}
                  onChange={(e) => setForm((prev) => ({ ...prev, secondary_color: e.target.value }))}
                  placeholder="#2A1E1A"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411] dark:text-white">Logo (archivo)</label>
                <input
                  className="h-11 rounded-lg border border-[#e6e0db] dark:border-[#3d3226] bg-white dark:bg-[#2d2419] px-3 text-sm file:mr-3 file:py-2 file:px-3 file:border-0 file:rounded-md file:bg-primary file:text-white"
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center justify-center h-11 px-5 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary/20"
                >
                  {creating
                    ? editingOutletId
                      ? 'Actualizando...'
                      : 'Creando...'
                    : editingOutletId
                      ? 'Actualizar local'
                      : 'Crear local'}
                </button>
              </div>
            </form>
            {(createError || createSuccess) && (
              <div
                className={`mt-4 rounded-lg px-4 py-3 text-sm font-semibold ${
                  createError
                    ? 'bg-red-50 border border-red-100 text-red-700'
                    : 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                }`}
              >
                {createError || createSuccess}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

