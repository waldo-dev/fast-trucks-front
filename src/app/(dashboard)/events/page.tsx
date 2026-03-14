'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventService, productService } from '@/lib/services';
import { getCachedUser } from '@/lib/auth';
import { readOperatingContext } from '@/lib/operatingContext';
import { toast } from 'react-toastify';

type UiEvent = {
  id: string;
  name: string;
  date: string;
  start?: string;
  end?: string;
  status?: string;
  isActive?: boolean;
  city?: string;
  district?: string;
  address?: string;
  organizer?: string;
  organizers?: Array<{ name?: string; role?: string; email?: string; phone?: string }>;
  eventType?: string;
  expectedAttendance?: number;
};

const EVENT_TYPES = ['Clientes (B2C)', 'Empresas (B2B)'];
const STATUS_OPTIONS = ['PLANNED', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'];
const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planeado',
  ACTIVE: 'Activo',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado',
  CANCELED: 'Cancelado',
};
const WEATHER_OPTIONS = [
  'Soleado',
  'Parcialmente nublado',
  'Nublado',
  'Lloviendo',
  'Tormenta',
  'Ventoso',
  'Nevando',
  'Húmedo',
];
const ORGANIZER_ROLES = [
  'Productora',
  'Coordinación',
  'Operaciones',
  'Logística',
  'Marketing',
  'Ventas',
  'Finanzas',
  'Otro',
];

const normalizeStatus = (value?: string) => {
  if (!value) return '';
  return value.trim().toUpperCase();
};

const formatStatusLabel = (value?: string) => {
  const normalized = normalizeStatus(value);
  if (!normalized) return '—';
  if (STATUS_LABELS[normalized]) return STATUS_LABELS[normalized];
  const prettified = normalized.replace(/_/g, ' ').toLowerCase();
  return prettified.charAt(0).toUpperCase() + prettified.slice(1);
};

const toDisplayText = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if ('name' in value && value.name) return String(value.name);
    if ('title' in value && (value as any).title) return String((value as any).title);
    if ('address' in value && (value as any).address) return String((value as any).address);
  }
  return '';
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  // Si viene como YYYY-MM-DD, la devolvemos directo para evitar desfases por zona horaria
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  try {
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
};

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<UiEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [futureOnly, setFutureOnly] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [creating, setCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    event_date: '',
    start_at: '',
    end_at: '',
    closed_at: '',
    city: '',
    district: '',
    address: '',
    status: '',
    is_active: true,
    notes: '',
    description: '',
    event_type: '',
    expected_attendance: '',
    weather_condition: '',
  });
  const [organizers, setOrganizers] = useState<
    Array<{ name: string; role: string; email: string; phone: string; notes: string }>
  >([{ name: '', role: '', email: '', phone: '', notes: '' }]);
  const [products, setProducts] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [operatingContext] = useState(() => readOperatingContext());
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | boolean | number> = {};
      if (futureOnly) params.future = true;
      if (activeFilter === 'active') params.is_active = true;
      if (activeFilter === 'inactive') params.is_active = false;
      const bizId = operatingContext?.business_id ?? getCachedUser()?.businessId;
      if (bizId) params.business_id = bizId;
      const resp = await eventService.list(params as any);
      const data = (resp as any)?.data ?? resp;
      if (Array.isArray(data)) {
        const normalizeDate = (input?: string) => {
          if (!input) return '';
          if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
          if (input.includes('T')) return input.split('T')[0];
          return input;
        };
        setEvents(
          data.map((ev: any, idx: number) => ({
            id: String(ev.id ?? idx + 1),
            name: toDisplayText(ev.name || ev.title) || 'Evento',
            date: normalizeDate(
              ev.event_date || ev.date || ev.start_at || ev.start || ev.starts_at
            ),
            start: ev.start_at || ev.start || ev.starts_at,
            end: ev.end_at || ev.end || ev.ends_at,
            status: (() => {
              const normalized = normalizeStatus(ev.status || (ev as any)?.state);
              return STATUS_OPTIONS.includes(normalized) ? normalized : '';
            })(),
            isActive: typeof ev.is_active === 'boolean' ? ev.is_active : undefined,
            city: toDisplayText(ev.city),
            district: toDisplayText(ev.district),
            address: toDisplayText(ev.address || ev.location?.address),
            organizer: toDisplayText(ev.organizer),
            organizers: Array.isArray(ev.organizers)
              ? ev.organizers.map((o: any) => ({
                  name: toDisplayText(o?.name ?? o),
                  role: toDisplayText(o?.role),
                  email: toDisplayText(o?.email),
                  phone: toDisplayText(o?.phone),
                }))
              : undefined,
            eventType: toDisplayText(ev.event_type),
            expectedAttendance: ev.expected_attendance,
          }))
        );
      } else {
        setEvents([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudieron cargar los eventos';
      setError(msg);
      toast.error(msg);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [futureOnly, activeFilter, operatingContext]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    setPage(1);
  }, [futureOnly, activeFilter, events]);

  useEffect(() => {
    const loadProducts = async () => {
      const businessId = operatingContext?.business_id ?? getCachedUser()?.businessId;
      if (!businessId) return;
      try {
        const resp = await productService.listByOwner({ business_id: businessId });
        const list = (resp as any)?.data ?? resp;
        if (Array.isArray(list)) {
          setProducts(
            list.map((p: any) => ({
              id: Number(p.id),
              name:
                toDisplayText(p.name) ||
                toDisplayText(p.title) ||
                toDisplayText(p?.location?.name) ||
                `Producto ${p.id}`,
            }))
          );
        }
      } catch {
        // silencioso
      }
    };
    loadProducts();
  }, [operatingContext]);

  const statusOptions = STATUS_OPTIONS;

  useEffect(() => {
    setProductPage(1);
  }, [products]);

  const productPageSize = 8;
  const totalProductPages = Math.max(1, Math.ceil(products.length / productPageSize));
  const currentProductPage = Math.min(productPage, totalProductPages);

  const paginatedProducts = useMemo(() => {
    const start = (currentProductPage - 1) * productPageSize;
    return products.slice(start, start + productPageSize);
  }, [products, currentProductPage, productPageSize]);

  const allProductsSelected =
    products.length > 0 && products.every((p) => selectedProductIds.includes(p.id));
  const allPageProductsSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedProductIds.includes(p.id));

  const toggleSelectAllProducts = () => {
    setSelectedProductIds((prev) => {
      if (allProductsSelected) {
        const pageIds = new Set(products.map((p) => p.id));
        return prev.filter((id) => !pageIds.has(id));
      }
      return Array.from(new Set([...prev, ...products.map((p) => p.id)]));
    });
  };

  const toggleSelectAllPageProducts = () => {
    setSelectedProductIds((prev) => {
      if (allPageProductsSelected) {
        const pageIds = new Set(paginatedProducts.map((p) => p.id));
        return prev.filter((id) => !pageIds.has(id));
      }
      return Array.from(new Set([...prev, ...paginatedProducts.map((p) => p.id)]));
    });
  };

  const filteredEvents = useMemo(() => events, [events]);
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, currentPage]);

  const handleProductPrev = () => setProductPage((prev) => Math.max(1, prev - 1));
  const handleProductNext = () => setProductPage((prev) => Math.min(totalProductPages, prev + 1));
  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1));

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newEvent.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const buildIsoUtc = (value: string) => {
      if (!value) return undefined;
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return undefined;
      return d.toISOString();
    };

    const startIso = buildIsoUtc(newEvent.start_at);
    const endIso = buildIsoUtc(newEvent.end_at);
    const closedIso = endIso;
    if (newEvent.start_at && !startIso) {
      toast.error('start_at debe ser datetime válido');
      return;
    }
    if (newEvent.end_at && !endIso) {
      toast.error('end_at debe ser datetime válido');
      return;
    }

    setCreating(true);
    try {
      await eventService.create({
        name: newEvent.name.trim(),
        event_date: newEvent.start_at
          ? newEvent.start_at.split('T')[0]
          : undefined,
        start_at: startIso,
        end_at: endIso,
        closed_at: closedIso,
        description: newEvent.description || undefined,
        address: newEvent.address || undefined,
        event_type: newEvent.event_type || undefined,
        expected_attendance: newEvent.expected_attendance
          ? Number(newEvent.expected_attendance)
          : undefined,
        weather_condition: newEvent.weather_condition || undefined,
        city: newEvent.city || undefined,
        district: newEvent.district || undefined,
        status: newEvent.status || undefined,
        notes: newEvent.notes || undefined,
        is_active: newEvent.is_active,
        business_id: operatingContext?.business_id ?? getCachedUser()?.businessId,
        product_ids: selectedProductIds.length ? selectedProductIds : undefined,
        organizers:
          organizers
            .map((o) => ({
              name: o.name.trim(),
              role: o.role.trim() || undefined,
              email: o.email.trim() || undefined,
              phone: o.phone.trim() || undefined,
              notes: o.notes.trim() || undefined,
            }))
            .filter((o) => o.name) || undefined,
      });
      toast.success('Evento creado');
      setIsModalOpen(false);
      setNewEvent({
        name: '',
        event_date: '',
        start_at: '',
        end_at: '',
        closed_at: '',
        city: '',
        district: '',
        address: '',
        status: '',
        is_active: true,
        notes: '',
        description: '',
        event_type: '',
        expected_attendance: '',
        weather_condition: '',
      });
      setOrganizers([{ name: '', role: '', email: '', phone: '', notes: '' }]);
      setSelectedProductIds([]);
      fetchEvents();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo crear el evento';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full px-2 sm:px-4 lg:px-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">
          Eventos del negocio
        </p>
        <div className="flex flex-wrap items-start md:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-[#181411] dark:text-white">Eventos y calendario</h1>
            <p className="text-[#8a7560] dark:text-[#a3907d]">
              Lista y crea eventos asociados a tus campañas o locales.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 h-11 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Nuevo Evento
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3226] p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-[#181411]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-primary"
                checked={futureOnly}
                onChange={(e) => setFutureOnly(e.target.checked)}
              />
              Solo futuros
            </label>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-[#181411]">
            <span>Estado:</span>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as any)}
              className="h-10 px-3 rounded-lg border border-primary/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="px-4 h-10 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Cargando...' : 'Refrescar'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading && filteredEvents.length === 0 ? (
          <div className="text-sm text-[#8a7560]">Cargando eventos...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-sm text-[#8a7560]">No hay eventos para los filtros seleccionados.</div>
        ) : (
          <div className="space-y-4">
            {/* Escritorio: tabla */}
            <div className="hidden md:block overflow-x-auto bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl">
              <table className="min-w-full text-left">
                <thead className="bg-primary/5 text-[#8a7560] text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Inicio</th>
                    <th className="px-4 py-3">Fin</th>
                    <th className="px-4 py-3">Organizadores</th>
                    <th className="px-4 py-3">Ciudad / Distrito</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10 text-sm text-[#181411]">
                  {paginatedEvents.map((ev) => (
                    <tr
                      key={ev.id}
                      className="hover:bg-primary/5 cursor-pointer"
                      onClick={() =>
                        router.push(`/events/analytics?eventId=${encodeURIComponent(ev.id)}`)
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold">{ev.name}</span>
                          {ev.organizer && (
                            <span className="text-xs text-[#8a7560]">Organiza: {ev.organizer}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatDate(ev.date)}</td>
                      <td className="px-4 py-3">{formatDateTime(ev.start)}</td>
                      <td className="px-4 py-3">{formatDateTime(ev.end)}</td>
                      <td className="px-4 py-3">
                        {ev.organizers?.length ? (
                          <div className="flex flex-col text-xs text-[#181411] gap-1">
                            {ev.organizers.slice(0, 2).map((org, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1">
                                <span className="font-semibold">{org.name || 'Organizador'}</span>
                                {org.role && <span className="text-[#8a7560]">({org.role})</span>}
                              </span>
                            ))}
                            {ev.organizers.length > 2 && (
                              <span className="text-[#8a7560]">+{ev.organizers.length - 2} más</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#8a7560]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span>
                            {ev.city || ev.district
                              ? `${ev.city || ''} ${ev.district || ''}`.trim()
                              : '—'}
                          </span>
                          {ev.address && (
                            <span className="text-xs text-[#8a7560]">{ev.address}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatStatusLabel(ev.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: tarjetas */}
            <div className="md:hidden divide-y divide-primary/10 bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl">
              {paginatedEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="px-4 py-3 space-y-2 cursor-pointer active:scale-[0.99] transition"
                  onClick={() =>
                    router.push(`/events/analytics?eventId=${encodeURIComponent(ev.id)}`)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#181411]">{ev.name}</p>
                      {ev.organizer && (
                        <p className="text-xs text-[#8a7560]">Organiza: {ev.organizer}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-[#181411] space-y-1">
                    <p>
                      <span className="font-semibold">Fecha:</span> {formatDate(ev.date)}
                    </p>
                    <p className="text-xs text-[#8a7560]">
                      {formatDateTime(ev.start)} · {formatDateTime(ev.end)}
                    </p>
                    <p>
                      <span className="font-semibold">Lugar:</span>{' '}
                      {ev.city || ev.district
                        ? `${ev.city || ''} ${ev.district || ''}`.trim()
                        : '—'}
                    </p>
                    {ev.address && <p className="text-xs text-[#8a7560]">{ev.address}</p>}
                  </div>
                  <div className="text-xs text-[#8a7560]">
                    {ev.organizers?.length ? (
                      <p>
                        Organizadores: {ev.organizers.map((o) => o.name || 'Organizador').join(', ')}
                      </p>
                    ) : (
                      <p>Organizadores: —</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#181411]">
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                      {formatStatusLabel(ev.status)}
                    </span>
                    <span className="text-[#8a7560]">{ev.eventType || ''}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-2">
              <span className="text-sm text-[#8a7560] text-center sm:text-left">
                Mostrando{' '}
                <span className="text-[#181411]">
                  {filteredEvents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                  {filteredEvents.length > 0
                    ? `-${Math.min(currentPage * pageSize, filteredEvents.length)}`
                    : ''}
                </span>{' '}
                de <span className="text-[#181411]">{filteredEvents.length}</span> eventos
              </span>
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
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 border border-primary/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#8a7560] font-semibold">
                  Nuevo Evento
                </p>
                <h3 className="text-2xl font-black text-[#181411]">Crear evento</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-primary/10 text-[#8a7560] transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Nombre
                  <input
                    required
                    type="text"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent((p) => ({ ...p, name: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    placeholder="Ej: Festival de verano"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Estado
                  <select
                    value={newEvent.status}
                    onChange={(e) => setNewEvent((p) => ({ ...p, status: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
                  >
                    <option value="">Selecciona estado</option>
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {formatStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Inicio
                  <input
                    type="datetime-local"
                    value={newEvent.start_at}
                    onChange={(e) => setNewEvent((p) => ({ ...p, start_at: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Fin 
                  <input
                    type="datetime-local"
                    value={newEvent.end_at}
                    onChange={(e) => setNewEvent((p) => ({ ...p, end_at: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Ciudad
                  <input
                    type="text"
                    value={newEvent.city}
                    onChange={(e) => setNewEvent((p) => ({ ...p, city: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Comuna
                  <input
                    type="text"
                    value={newEvent.district}
                    onChange={(e) => setNewEvent((p) => ({ ...p, district: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Dirección
                  <input
                    type="text"
                    value={newEvent.address}
                    onChange={(e) => setNewEvent((p) => ({ ...p, address: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    placeholder="Calle, número, comuna"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Asistencia esperada
                  <input
                    type="number"
                    value={newEvent.expected_attendance}
                    onChange={(e) =>
                      setNewEvent((p) => ({ ...p, expected_attendance: e.target.value }))
                    }
                    className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    placeholder="Ej: 120"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                Notas
                <textarea
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent((p) => ({ ...p, notes: e.target.value }))}
                  className="min-h-20 px-3 py-2 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  placeholder="Observaciones adicionales"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                Descripción
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))}
                  className="min-h-20 px-3 py-2 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  placeholder="Descripción breve del evento"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Condición climática
                  <select
                    value={newEvent.weather_condition}
                    onChange={(e) => setNewEvent((p) => ({ ...p, weather_condition: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
                  >
                    <option value="">Selecciona condición</option>
                    {WEATHER_OPTIONS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Tipo de evento
                  <select
                    value={newEvent.event_type}
                    onChange={(e) => setNewEvent((p) => ({ ...p, event_type: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
                  >
                    <option value="">Selecciona</option>
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-col gap-3 text-sm font-semibold text-[#181411] bg-white border border-primary/10 rounded-xl p-3 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-[#181411]">Productos</span>
                  <div className="flex flex-wrap gap-3 text-xs font-medium text-[#6f5b4a]">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={allProductsSelected}
                        onChange={toggleSelectAllProducts}
                      />
                      Seleccionar todos
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={allPageProductsSelected}
                        onChange={toggleSelectAllPageProducts}
                      />
                      Seleccionar página
                    </label>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto border border-primary/10 rounded-lg p-3 bg-primary/5 space-y-2">
                  {paginatedProducts.length === 0 ? (
                    <span className="text-xs text-[#8a7560]">No hay productos disponibles.</span>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {paginatedProducts.map((p) => {
                        const checked = selectedProductIds.includes(p.id);
                        const displayName = toDisplayText(p.name) || `Producto ${p.id}`;
                        return (
                          <label
                            key={p.id}
                            className="flex items-center gap-3 text-sm font-medium text-[#181411] bg-white rounded-lg px-3 py-2 border border-primary/10 hover:border-primary/40 transition-colors"
                          >
                            <input
                              type="checkbox"
                              className="accent-primary"
                              checked={checked}
                              onChange={() =>
                                setSelectedProductIds((prev) =>
                                  checked ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                                )
                              }
                            />
                            <span className="truncate">{displayName}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-[#8a7560] pt-1 gap-2">
                  <span>
                    Mostrando{' '}
                    <span className="text-[#181411]">
                      {products.length === 0
                        ? 0
                        : (currentProductPage - 1) * productPageSize + 1}
                      {products.length > 0
                        ? `-${Math.min(currentProductPage * productPageSize, products.length)}`
                        : ''}
                    </span>{' '}
                    de <span className="text-[#181411]">{products.length}</span> productos
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleProductPrev}
                      disabled={currentProductPage === 1}
                      className="px-3 py-1.5 border border-primary/20 rounded-lg font-semibold bg-white text-[#181411] hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="font-medium text-[#181411]">
                      Página {currentProductPage} de {totalProductPages}
                    </span>
                    <button
                      type="button"
                      onClick={handleProductNext}
                      disabled={currentProductPage === totalProductPages}
                      className="px-3 py-1.5 border border-primary/20 rounded-lg font-semibold bg-white text-[#181411] hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#181411]">Organizadores</span>
                  <button
                    type="button"
                    onClick={() =>
                      setOrganizers((prev) => [
                        ...prev,
                        { name: '', role: '', email: '', phone: '', notes: '' },
                      ])
                    }
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    + Agregar organizador
                  </button>
                </div>
                {organizers.map((org, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-primary/10 rounded-lg p-3"
                  >
                    <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                      Nombre *
                      <input
                        required
                        type="text"
                        value={org.name}
                        onChange={(e) =>
                          setOrganizers((prev) =>
                            prev.map((o, i) => (i === idx ? { ...o, name: e.target.value } : o))
                          )
                        }
                        className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                      Rol
                      <select
                        value={org.role}
                        onChange={(e) =>
                          setOrganizers((prev) =>
                            prev.map((o, i) => (i === idx ? { ...o, role: e.target.value } : o))
                          )
                        }
                        className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
                      >
                        <option value="">Selecciona rol</option>
                        {ORGANIZER_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                      Email
                      <input
                        type="email"
                        value={org.email}
                        onChange={(e) =>
                          setOrganizers((prev) =>
                            prev.map((o, i) => (i === idx ? { ...o, email: e.target.value } : o))
                          )
                        }
                        className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                      Teléfono
                      <input
                        type="text"
                        value={org.phone}
                        onChange={(e) =>
                          setOrganizers((prev) =>
                            prev.map((o, i) => (i === idx ? { ...o, phone: e.target.value } : o))
                          )
                        }
                        className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411] md:col-span-2">
                      Notas
                      <textarea
                        value={org.notes}
                        onChange={(e) =>
                          setOrganizers((prev) =>
                            prev.map((o, i) => (i === idx ? { ...o, notes: e.target.value } : o))
                          )
                        }
                        className="min-h-16 px-3 py-2 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                      />
                    </label>
                    {organizers.length > 1 && (
                      <div className="md:col-span-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setOrganizers((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Quitar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 h-10 rounded-lg border border-primary/20 text-sm font-semibold text-[#181411] hover:bg-primary/5"
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 h-10 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60"
                  disabled={creating}
                >
                  {creating ? 'Creando...' : 'Crear evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
