'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { eventService, productService } from '@/lib/services';
import { getCachedUser } from '@/lib/auth';
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
  const [events, setEvents] = useState<UiEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [futureOnly, setFutureOnly] = useState(true);
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

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | boolean> = {};
      if (futureOnly) params.future = true;
      if (activeFilter === 'active') params.is_active = true;
      if (activeFilter === 'inactive') params.is_active = false;
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
            name: ev.name || ev.title || 'Evento',
            date: normalizeDate(
              ev.event_date || ev.date || ev.start_at || ev.start || ev.starts_at
            ),
            start: ev.start_at || ev.start || ev.starts_at,
            end: ev.end_at || ev.end || ev.ends_at,
            status: ev.status,
            isActive: typeof ev.is_active === 'boolean' ? ev.is_active : undefined,
            city: ev.city,
            district: ev.district,
            address: ev.address || ev.location?.address,
            organizer: ev.organizer,
            organizers: ev.organizers,
            eventType: ev.event_type,
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
  }, [futureOnly, activeFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const loadProducts = async () => {
      const businessId = getCachedUser()?.businessId;
      if (!businessId) return;
      try {
        const resp = await productService.listByOwner({ business_id: businessId });
        const list = (resp as any)?.data ?? resp;
        if (Array.isArray(list)) {
          setProducts(
            list.map((p: any) => ({
              id: Number(p.id),
              name: p.name || `Producto ${p.id}`,
            }))
          );
        }
      } catch {
        // silencioso
      }
    };
    loadProducts();
  }, []);

  const filteredEvents = useMemo(() => events, [events]);

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

    const eventDateFormatted =
      newEvent.event_date && /^\d{4}-\d{2}-\d{2}$/.test(newEvent.event_date)
        ? newEvent.event_date
        : undefined;
    if (newEvent.event_date && !eventDateFormatted) {
      toast.error('event_date debe ser YYYY-MM-DD');
      return;
    }

    const startIso = buildIsoUtc(newEvent.start_at);
    const endIso = buildIsoUtc(newEvent.end_at);
    const closedIso = buildIsoUtc(newEvent.closed_at);
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
        event_date: eventDateFormatted,
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
          <div className="overflow-x-auto bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl">
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
                  <th className="px-4 py-3">Activo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 text-sm text-[#181411]">
                {filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-primary/5">
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
                    <td className="px-4 py-3">{ev.status || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          ev.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {ev.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  Fecha (YYYY-MM-DD)
                  <input
                    type="date"
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent((p) => ({ ...p, event_date: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    placeholder="2026-02-02"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Inicio (ISO)
                  <input
                    type="datetime-local"
                    value={newEvent.start_at}
                    onChange={(e) => setNewEvent((p) => ({ ...p, start_at: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Fin (ISO)
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Estado
                  <input
                    type="text"
                    value={newEvent.status}
                    onChange={(e) => setNewEvent((p) => ({ ...p, status: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    placeholder="Ej: PLANNED"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#181411] mt-6">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={newEvent.is_active}
                    onChange={(e) => setNewEvent((p) => ({ ...p, is_active: e.target.checked }))}
                  />
                  Evento activo
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
                  <input
                    type="text"
                    value={newEvent.weather_condition}
                    onChange={(e) => setNewEvent((p) => ({ ...p, weather_condition: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    placeholder="Ej: Soleado"
                  />
                </label>
                <div className="flex flex-col gap-2 text-sm font-semibold text-[#181411]">
                  <span>Productos</span>
                  <div className="max-h-40 overflow-y-auto border border-primary/10 rounded-lg p-2 space-y-2 bg-white">
                    {products.length === 0 ? (
                      <span className="text-xs text-[#8a7560]">No hay productos disponibles.</span>
                    ) : (
                      products.map((p) => {
                        const checked = selectedProductIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className="flex items-center gap-2 text-sm font-medium text-[#181411]"
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
                            <span>{p.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm font-semibold text-[#181411]">
                  Cierre (ISO)
                  <input
                    type="datetime-local"
                    value={newEvent.closed_at}
                    onChange={(e) => setNewEvent((p) => ({ ...p, closed_at: e.target.value }))}
                    className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  />
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
                      <input
                        type="text"
                        value={org.role}
                        onChange={(e) =>
                          setOrganizers((prev) =>
                            prev.map((o, i) => (i === idx ? { ...o, role: e.target.value } : o))
                          )
                        }
                        className="h-10 px-3 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                      />
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
