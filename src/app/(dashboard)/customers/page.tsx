'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CustomerStats } from '@/components/customers/CustomerStats';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { businessService, customerService } from '@/lib/services';
import { readOperatingContext } from '@/lib/operatingContext';
import { orderService } from '@/lib/services';
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

const sanitizePhone = (phone?: string) => {
  if (!phone) return '';
  if (phone.startsWith('NO_PHONE_')) return '';
  return phone;
};

export default function CustomersPage() {
  const router = useRouter();
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
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [customerOrders, setCustomerOrders] = useState<Record<number, any[]>>({});

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
        const phone = sanitizePhone(customer.phone) || 'Sin teléfono';
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

  const fetchCustomerOrders = useCallback(
    async (customerId: number) => {
      const ctx = readOperatingContext();
      const businessId =
        (ctx?.type === 'business' && ctx.business_id) || getCachedUser()?.businessId;
      try {
        const resp = await orderService.list({
          customer_id: customerId,
          business_id: businessId,
        });
        const data = (resp as any)?.data ?? resp;
        if (!Array.isArray(data)) return;
        setCustomerOrders((prev) => ({ ...prev, [customerId]: data }));
      } catch (err) {
        toast.error(
          err instanceof Error
            ? 'No se pudo cargar el historial del cliente'
            : 'Error al cargar pedidos del cliente'
        );
      }
    },
    []
  );

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

  useEffect(() => {
    setPage(1);
  }, [customers]);

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
    if (!customerOrders[id]) {
      fetchCustomerOrders(id);
    }
  };

  const handleViewProfile = (id: number) => {
    router.push(`/customers/${encodeURIComponent(String(id))}`);
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
  const mapOrderCard = (order: any, idx: number) => {
    const total = order.total ?? order.amount ?? 0;
    return {
      id: String(order.id ?? order.code ?? order.external_id ?? idx + 1),
      items: order.items?.[0]?.name || order.source || 'Pedido',
      total: new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
      }).format(Number(total) || 0),
      time: formatDateLabel(order.created_at || order.createdAt),
    };
  };

  const customersWithExpanded = customers.map((customer) => ({
    ...customer,
    isExpanded: expandedCustomer === customer.id,
    recentOrders: customerOrders[customer.id]?.slice(0, 5).map(mapOrderCard),
  }));

  const totalPages = Math.max(1, Math.ceil(customersWithExpanded.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return customersWithExpanded.slice(start, start + pageSize);
  }, [customersWithExpanded, currentPage]);

  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1));

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
        <div className="bg-white border border-primary/10 rounded-lg">
          {/* Escritorio: tabla */}
          <div className="hidden lg:block">
            <CustomerTable
              customers={paginatedCustomers}
              onToggleExpand={handleToggleExpand}
              onViewProfile={handleViewProfile}
            />
          </div>

          {/* Mobile: tarjetas */}
          <div className="lg:hidden divide-y divide-primary/10">
            {paginatedCustomers.map((c) => (
              <div key={c.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`size-11 rounded-full bg-gradient-to-br ${c.avatarColor} flex items-center justify-center text-sm font-bold`}
                  >
                    {c.initials}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#181411]">{c.name}</p>
                    <p className="text-xs text-[#8a7560]">{c.email}</p>
                    <p className="text-xs text-[#8a7560]">{c.phone}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                      c.status === 'VIP'
                        ? 'bg-purple-100 text-purple-700'
                        : c.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-[#181411]">
                    <p className="font-semibold">{c.totalOrders} pedidos</p>
                    <p className="text-xs text-[#8a7560]">
                      Último: {c.lastOrder.time} · {c.lastOrder.venue}
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewProfile(c.id)}
                    className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-lg border border-primary/20 text-primary hover:bg-primary/5"
                  >
                    Ver perfil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 px-2">
        <p className="text-sm text-[#8a7560] font-medium text-center sm:text-left">
          Mostrando{' '}
          <span className="text-[#181411]">
            {customersWithExpanded.length === 0
              ? 0
              : (currentPage - 1) * pageSize + 1}
            {customersWithExpanded.length > 0
              ? `-${Math.min(currentPage * pageSize, customersWithExpanded.length)}`
              : ''}
          </span>{' '}
          de <span className="text-[#181411]">{customersWithExpanded.length}</span> clientes
        </p>
        <div className="flex items-center gap-2 justify-center sm:justify-end">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-primary/20 rounded-lg text-sm font-bold bg-white text-[#181411] hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            Anterior
          </button>
          <span className="text-sm text-[#8a7560] font-medium">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-primary/20 rounded-lg text-sm font-bold bg-white text-[#181411] hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            Siguiente
          </button>
        </div>
      </div>

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

