'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CustomerStats } from '@/components/customers/CustomerStats';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { businessService, customerService } from '@/lib/services';
import { getAccessToken, getCachedUser } from '@/lib/auth';
import { toast } from 'react-toastify';
import { config } from '@/lib/config';

type UiCustomer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  initials: string;
  avatarColor: string;
  totalOrders: number;
  lastOrder: { time: string; venue: string; isToday?: boolean };
  status: 'VIP' | 'Active' | 'New';
  isExpanded?: boolean;
};

export default function CustomersPage() {
  const [expandedCustomer, setExpandedCustomer] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<UiCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [businessNames, setBusinessNames] = useState<Record<string, string>>({});
  const [businessOptions, setBusinessOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'Active',
  });

  const initialsFromName = (name?: string) => {
    if (!name) return 'NN';
    const parts = name.trim().split(' ');
    const [first, second] = parts;
    return `${first?.[0] ?? ''}${second?.[0] ?? ''}`.toUpperCase() || 'NN';
  };

  const formatDateLabel = (iso?: string) => {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: sameDay ? undefined : 'short',
      timeStyle: 'short',
    }).format(date);
  };

  const gradientPalette = [
    'from-primary/20 to-primary/40 text-primary',
    'from-blue-100 to-blue-200 text-blue-600',
    'from-purple-100 to-purple-200 text-purple-600',
    'from-orange-100 to-orange-200 text-orange-600',
    'from-green-100 to-green-200 text-green-600',
  ];

  const mapCustomers = (data: Array<{ business_id?: string | number; customers?: any[] }>) => {
    const mapped: UiCustomer[] = [];
    data.forEach((group, groupIdx) => {
      const venue =
        (group.business_id &&
          businessNames[String(group.business_id)]) ||
        (group.business_id ? `Local ${group.business_id}` : 'Local sin nombre');
      (group.customers || []).forEach((customer: any, idx: number) => {
        const numericId = Number(customer.id ?? `${groupIdx}-${idx}`);
        const id = Number.isFinite(numericId) ? numericId : idx + 1;
        const name = customer.name || 'Sin nombre';
        const email = customer.email || 'Sin correo';
        const phone = customer.phone || 'Sin teléfono';
        const color = gradientPalette[(groupIdx + idx) % gradientPalette.length];
        const orders = Array.isArray(customer.orders) ? customer.orders : [];
        const latestOrder = orders
          .slice()
          .sort(
            (a: any, b: any) =>
              new Date(b.created_at || b.createdAt || '').getTime() -
              new Date(a.created_at || a.createdAt || '').getTime()
          )[0];
        const status: UiCustomer['status'] = orders.length === 0 ? 'New' : 'Active';
        mapped.push({
          id,
          name,
          email,
          phone,
          initials: customer.initials || initialsFromName(name),
          avatarColor: color,
          totalOrders: orders.length,
          lastOrder: {
            time: formatDateLabel(latestOrder?.created_at || latestOrder?.createdAt),
            venue,
            isToday: !!latestOrder?.created_at || !!latestOrder?.createdAt
              ? (() => {
                  const d = new Date(latestOrder?.created_at || latestOrder?.createdAt);
                  const now = new Date();
                  return (
                    d.getFullYear() === now.getFullYear() &&
                    d.getMonth() === now.getMonth() &&
                    d.getDate() === now.getDate()
                  );
                })()
              : false,
          },
          status,
        });
      });
    });
    return mapped;
  };

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const user = getCachedUser();
    if (!user?.id) {
      setError('No se encontró el usuario en sesión.');
      setCustomers([]);
      setLoading(false);
      return;
    }
    try {
      const resp = await customerService.listByUser(user.id);
      const data = (resp as any)?.data ?? resp;
      if (Array.isArray(data)) {
        setCustomers(mapCustomers(data));
      } else {
        setCustomers([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudieron cargar los clientes';
      setError(msg);
      toast.error(msg);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBusinessNames = useCallback(async () => {
    try {
      const resp = await businessService.list();
      const list = (resp as any)?.data ?? resp;
      if (Array.isArray(list)) {
        const dict: Record<string, string> = {};
        const opts: Array<{ id: string; name: string }> = [];
        list.forEach((b: any) => {
          if (b?.id) {
            const idStr = String(b.id);
            const name = b.name || b.brand_name || `Local ${b.id}`;
            dict[idStr] = name;
            opts.push({ id: idStr, name });
          }
        });
        setBusinessNames(dict);
        setBusinessOptions(opts);
        if (!selectedBusinessId && opts.length) {
          const cached = getCachedUser()?.businessId;
          const found = cached ? opts.find((o) => o.id === String(cached)) : undefined;
          setSelectedBusinessId(found?.id || opts[0].id);
        }
      }
    } catch {
      // silencioso, usamos fallback de id
    }
  }, [selectedBusinessId]);

  useEffect(() => {
    fetchCustomers();
    fetchBusinessNames();
  }, [fetchCustomers, fetchBusinessNames]);

  const stats = useMemo(
    () => [
      {
        icon: 'group',
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        label: 'Total Clientes',
        value: new Intl.NumberFormat('es-CL').format(customers.length),
        change: '',
        changeColor: 'text-[#07880e]',
        changeBg: 'bg-green-50',
      },
      {
        icon: 'shopping_cart',
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        label: 'Activos Esta Semana',
        value: '—',
        change: '',
        changeColor: 'text-[#07880e]',
        changeBg: 'bg-green-50',
      },
      {
        icon: 'repeat',
        iconBg: 'bg-orange-50',
        iconColor: 'text-orange-600',
        label: 'Frecuencia Promedio',
        value: '—',
        change: '',
        changeColor: 'text-red-500',
        changeBg: 'bg-red-50',
      },
    ],
    [customers.length]
  );

  const handleToggleExpand = (id: number) => {
    setExpandedCustomer(expandedCustomer === id ? null : id);
  };

  const handleViewProfile = (id: number) => {
    // Placeholder: sin acción real
    console.log('Ver perfil completo:', id);
  };

  const handleExport = async () => {
    const user = getCachedUser();
    const token = getAccessToken();
    if (!user?.id || !token) {
      toast.error('No se encontró sesión activa para exportar.');
      return;
    }
    try {
      setExporting(true);
      const url = `${config.api.baseUrl}customers/by-user/${user.id}/csv`;
      const resp = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        throw new Error(`No se pudo exportar (${resp.status})`);
      }
      const blob = await resp.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `customers-${user.id}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo exportar CSV';
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  const handleNewCustomer = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      address: '',
      status: 'Active',
    });
  };

  const handleSubmitNewCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedBusinessId) {
      toast.error('Selecciona un negocio para crear el cliente.');
      return;
    }
    const payload: any = {
      name: newCustomer.name.trim(),
      email: newCustomer.email.trim() || undefined,
      phone: newCustomer.phone.trim(),
      business_id: selectedBusinessId,
    };
    if (newCustomer.address.trim()) {
      payload.address = { address: newCustomer.address.trim() };
    }

    if (!payload.name || !payload.phone) {
      toast.error('Nombre y teléfono son obligatorios.');
      return;
    }

    setSubmitting(true);
    customerService
      .create(payload)
      .then(() => {
        toast.success('Cliente creado');
        handleCloseModal();
        fetchCustomers();
      })
      .catch((err) => {
        const msg =
          err instanceof Error ? err.message : 'No se pudo crear el cliente';
        toast.error(msg);
      })
      .finally(() => setSubmitting(false));
  };

  // Agregar isExpanded a cada cliente
  const customersWithExpanded = customers.map((customer) => ({
    ...customer,
    isExpanded: expandedCustomer === customer.id,
  }));

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-10 gap-8 overflow-y-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <a className="text-[#8a7560] hover:text-primary transition-colors" href="#">
          Admin
        </a>
        <span className="material-symbols-outlined text-xs text-[#8a7560]">chevron_right</span>
        <span className="text-[#181411] font-medium">Directorio de Clientes</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-[#181411] text-3xl font-black tracking-tight">
            Directorio de Clientes
          </h2>
          <p className="text-[#8a7560] text-base mt-1">
            Gestiona y relaciona con 1,284 clientes en todos los food trucks y locales.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 h-11 bg-white border border-primary/20 rounded-lg text-[#181411] text-sm font-bold hover:bg-primary/5 transition-colors disabled:opacity-60"
            disabled={exporting || loading}
          >
            <span className="material-symbols-outlined text-lg">download</span>
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
          <button
            onClick={handleNewCustomer}
            className="flex items-center gap-2 px-4 h-11 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <CustomerStats stats={stats} />

      {/* Main CRM Table Card */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <div className="bg-white border border-primary/10 rounded-lg px-4 py-3 text-sm text-[#8a7560]">
          Cargando clientes...
        </div>
      ) : customersWithExpanded.length === 0 ? (
        <div className="bg-white border border-primary/10 rounded-lg px-4 py-3 text-sm text-[#8a7560]">
          No hay clientes para mostrar.
        </div>
      ) : (
        <CustomerTable
          customers={customersWithExpanded}
          onToggleExpand={handleToggleExpand}
          onViewProfile={handleViewProfile}
        />
      )}

      {/* Modal Crear Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8 border border-primary/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#8a7560] font-semibold">
                  Nuevo Cliente
                </p>
                <h3 className="text-2xl font-black text-[#181411]">Crear cliente</h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-full hover:bg-primary/10 text-[#8a7560] transition-colors"
                aria-label="Cerrar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmitNewCustomer}>
              <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                Negocio
                <select
                  required
                  value={selectedBusinessId}
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                  className="h-11 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-[#181411] bg-white"
                >
                  <option value="">Selecciona un negocio</option>
                  {businessOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Nombre completo
                  <input
                    required
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="h-11 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-[#181411]"
                    placeholder="Ej. Alex Morgan"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Correo
                  <input
                    required
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="h-11 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-[#181411]"
                    placeholder="cliente@email.com"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Teléfono
                  <input
                    required
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="h-11 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-[#181411]"
                    placeholder="+1 (555) 123-4567"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Dirección (opcional)
                  <input
                    type="text"
                    value={newCustomer.address}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({ ...prev, address: e.target.value }))
                    }
                    className="h-11 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-[#181411]"
                    placeholder="Calle, número, comuna"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Estado
                  <select
                    value={newCustomer.status}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="h-11 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-[#181411] bg-white"
                  >
                    <option value="Active">Activo</option>
                    <option value="VIP">VIP</option>
                    <option value="New">Nuevo</option>
                  </select>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="h-11 px-4 rounded-lg border border-primary/20 text-[#181411] text-sm font-bold hover:bg-primary/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-11 px-4 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? 'Creando...' : 'Guardar cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

