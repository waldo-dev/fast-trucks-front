'use client';

import { useEffect, useMemo, useState } from 'react';
import { eventService, businessService } from '@/lib/services';
import { readOperatingContext } from '@/lib/operatingContext';
import { getCachedUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

type UiEvent = {
  id: string;
  name: string;
  start?: string;
  end?: string;
  businessId?: string;
  venue?: string;
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

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const setOperatingContext = (context: unknown) => {
  if (typeof window === 'undefined') return;
  const payload = JSON.stringify(context);
  localStorage.setItem('business_operating_context', payload);
  sessionStorage.setItem('business_operating_context', payload);
};

export default function PosCambiarEventoPage() {
  const router = useRouter();
  const [events, setEvents] = useState<UiEvent[]>([]);
  const [businesses, setBusinesses] = useState<Record<string, string>>({});
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(() => {
    const ctx = readOperatingContext();
    return ctx?.business_id ? String(ctx.business_id) : getCachedUser()?.businessId ?? '';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operatingContext] = useState(() => readOperatingContext());

  const loadBusinesses = async () => {
    try {
      const resp = await businessService.list();
      const list = (resp as any)?.data ?? resp;
      if (Array.isArray(list)) {
        const dict: Record<string, string> = {};
        list.forEach((b: any) => {
          if (b?.id) {
            const label =
              toDisplayText(b.name) ||
              toDisplayText(b.brand_name) ||
              toDisplayText(b.title) ||
              `Local ${b.id}`;
            dict[String(b.id)] = label;
          }
        });
        setBusinesses(dict);
      }
    } catch {
      /* silent; fallback */
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      await loadBusinesses();
      // Si estamos en contexto de evento, no cargamos eventos; solo mostramos locales.
      if (operatingContext?.type === 'event') {
        if (active) setLoading(false);
        return;
      }
      try {
        const params: any = { future: true };
        if (operatingContext?.business_id) {
          params.business_id = operatingContext.business_id;
        }
        const resp = await eventService.list(params);
        const list = (resp as any)?.data ?? resp;
        if (Array.isArray(list)) {
          const mapped: UiEvent[] = list.map((ev: any, idx: number) => ({
            id: String(ev.id ?? idx + 1),
            name: toDisplayText(ev.name || ev.title) || 'Evento',
            start: ev.start_date || ev.start || ev.starts_at,
            end: ev.end_date || ev.end || ev.ends_at,
            businessId: ev.business_id ? String(ev.business_id) : undefined,
            venue:
              toDisplayText(ev.location?.name) ||
              toDisplayText(ev.location?.address) ||
              toDisplayText(ev.venue),
          }));
          if (active) setEvents(mapped);
        } else if (active) {
          setEvents([]);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'No se pudieron cargar los eventos';
        if (active) setError(msg);
        toast.error(msg);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId),
    [events, selectedEventId]
  );

  const handleApplyEvent = () => {
    if (!selectedEvent) {
      toast.error('Selecciona un evento activo.');
      return;
    }
    const businessId =
      selectedEvent.businessId || getCachedUser()?.businessId || events[0]?.businessId;
    setOperatingContext({
      type: 'event',
      event_id: selectedEvent.id,
      event_name: selectedEvent.name,
      business_id: businessId,
    });
    toast.success('Contexto actualizado al evento. Refrescando POS...');
    router.replace('/pos');
  };

  const handleApplyLocal = () => {
    const businessId = selectedBusinessId || operatingContext?.business_id || getCachedUser()?.businessId;
    if (!businessId) {
      toast.error('No se encontró un local asociado.');
      return;
    }
    setOperatingContext({
      type: 'business',
      business_id: String(businessId),
    });
    toast.success('Contexto actualizado al local. Refrescando POS...');
    router.replace('/pos');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">Punto de Venta</p>
        <h1 className="text-2xl font-black text-[#181411] dark:text-white">
          {operatingContext?.type === 'event' ? 'Cambiar a Local' : 'Cambiar a Evento'}
        </h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          {operatingContext?.type === 'event'
            ? 'Estás en contexto de evento. Selecciona el local para volver a operar en modo local.'
            : 'Selecciona un evento activo para operar el POS en ese contexto. También puedes volver al modo local.'}
        </p>
      </div>

      <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#181411] dark:text-white">
            {operatingContext?.type === 'event' ? 'Locales' : 'Eventos activos'}
          </h2>
          <button
            onClick={handleApplyLocal}
            className="px-3 py-2 text-sm font-semibold border border-primary/20 rounded-lg text-[#181411] hover:bg-primary/5"
          >
            Volver a modo local
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {operatingContext?.type === 'event' ? (
          <div className="space-y-3">
            {loading ? (
              <div className="text-sm text-[#8a7560]">Cargando locales...</div>
            ) : Object.keys(businesses).length === 0 ? (
              <div className="text-sm text-[#8a7560]">No hay locales disponibles.</div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#181411]">Selecciona un local</label>
                <select
                  className="w-full h-11 rounded-lg border border-[#e6e0db] bg-white dark:bg-[#2d2419] dark:border-[#3d3226] px-3 text-sm"
                  value={selectedBusinessId}
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                >
                  {Object.entries(businesses).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="text-sm text-[#8a7560]">Cargando eventos...</div>
        ) : events.length === 0 ? (
          <div className="text-sm text-[#8a7560]">No hay eventos activos.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {events.map((ev) => (
              <label
                key={ev.id}
                className={`flex flex-col gap-2 p-4 rounded-xl border cursor-pointer transition-colors ${
                  selectedEventId === ev.id
                    ? 'border-primary bg-primary/5'
                    : 'border-[#e6e0db] hover:border-primary/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="event"
                    value={ev.id}
                    checked={selectedEventId === ev.id}
                    onChange={() => setSelectedEventId(ev.id)}
                    className="mt-1 accent-primary"
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-[#181411] dark:text-white">
                      {ev.name}
                    </span>
                    <span className="text-xs text-[#8a7560]">
                      {ev.businessId && businesses[ev.businessId]
                        ? businesses[ev.businessId]
                        : ev.businessId
                        ? `Local ${ev.businessId}`
                        : 'Sin local asignado'}
                    </span>
                    <span className="text-xs text-[#8a7560]">
                      {formatDate(ev.start)} — {formatDate(ev.end)}
                    </span>
                    {ev.venue && (
                      <span className="text-xs text-[#8a7560]">Lugar: {ev.venue}</span>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={operatingContext?.type === 'event' ? handleApplyLocal : handleApplyEvent}
            disabled={
              loading ||
              (operatingContext?.type === 'event' ? !selectedBusinessId : !selectedEventId)
            }
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60"
          >
            {loading
              ? 'Cargando...'
              : operatingContext?.type === 'event'
              ? 'Cambiar a local'
              : 'Cambiar a evento'}
          </button>
        </div>
      </div>
    </div>
  );
}
