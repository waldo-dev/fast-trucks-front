'use client';

import { useEffect, useMemo, useState } from 'react';
import { mailingService, customerService } from '@/lib/services';
import { toast } from 'react-toastify';

type Dashboard = {
  total_contacts?: number;
  campaigns_sent?: number;
  open_rate_avg?: number;
  click_rate_avg?: number;
  unsubscribe_rate_avg?: number;
  scheduled?: Array<{
    id: number | string;
    name?: string;
    send_at?: string;
    segment?: string;
  }>;
  last_campaign?: {
    name?: string;
    sent_at?: string;
    open_rate?: number;
    click_rate?: number;
    status?: string;
  };
};

type Campaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  send_at?: string;
  segment?: string;
  open_rate?: number;
  click_rate?: number;
};

type CampaignForm = {
  name: string;
  subject: string;
  preheader: string;
  sender: string;
  segment: string;
  send_type: 'IMMEDIATE' | 'SCHEDULED';
  send_at: string;
  content: string;
  auto_utm: boolean;
  ab_test_subject: boolean;
};

type CustomerOption = {
  id: string;
  name: string;
  email: string;
  selected: boolean;
};

const formatRate = (value?: number) => `${Math.round((value ?? 0) * 100)}%`;
const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(d);
};

export default function MailingPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState<CampaignForm>({
    name: '',
    subject: '',
    preheader: '',
    sender: '',
    segment: '',
    send_type: 'IMMEDIATE',
    send_at: '',
    content: '',
    auto_utm: true,
    ab_test_subject: false,
  });
  const [sendForm, setSendForm] = useState({
    from: '',
    subject: '',
    html: '',
  });
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dashResp, listResp] = await Promise.all([
          mailingService.dashboard(),
          mailingService.listCampaigns({ page: 1, page_size: 10 }),
        ]);
        setDashboard(((dashResp as any)?.data ?? dashResp) as Dashboard);
        const list = ((listResp as any)?.data ?? listResp) as any[];
        if (Array.isArray(list)) {
          setCampaigns(
            list.map((c) => ({
              id: String(c.id ?? c.code ?? Math.random().toString(36).slice(2)),
              name: c.name || 'Sin nombre',
              subject: c.subject || 'Sin asunto',
              status: (c.status || 'DRAFT').toUpperCase(),
              send_at: c.send_at,
              segment: c.segment,
              open_rate: c.open_rate,
              click_rate: c.click_rate,
            }))
          );
        } else {
          setCampaigns([]);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'No se pudo cargar mailing';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const resp = await customerService.list();
        const list = (resp as any)?.data ?? resp;
        if (Array.isArray(list)) {
          setCustomers(
            list
              .filter((c: any) => c.email)
              .map((c: any) => ({
                id: String(c.id ?? Math.random().toString(36).slice(2)),
                name: c.name || 'Sin nombre',
                email: c.email,
                selected: false,
              }))
          );
        }
      } catch (err) {
        // Silent; mailing puede seguir sin lista
        // eslint-disable-next-line no-console
        console.warn('No se pudieron cargar clientes para mailing', err);
      }
    };
    loadCustomers();
  }, []);

  const resetForm = () => {
    setForm({
      name: '',
      subject: '',
      preheader: '',
      sender: '',
      segment: '',
      send_type: 'IMMEDIATE',
      send_at: '',
      content: '',
      auto_utm: true,
      ab_test_subject: false,
    });
  };

  const handleCreateCampaign = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.sender.trim() || !form.segment.trim()) {
      toast.error('Completa nombre, asunto, remitente y segmento.');
      return;
    }
    if (form.send_type === 'SCHEDULED' && !form.send_at) {
      toast.error('Define la fecha/hora de envío programado.');
      return;
    }
    setCreating(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        preheader: form.preheader.trim() || undefined,
        sender: form.sender.trim(),
        segment: form.segment.trim(),
        send_type: form.send_type,
        send_at: form.send_type === 'SCHEDULED' ? form.send_at : undefined,
        content: form.content.trim() || undefined,
        auto_utm: form.auto_utm,
        ab_test_subject: form.ab_test_subject,
      };
      await toast.promise(mailingService.createCampaign(payload), {
        pending: 'Creando campaña...',
        success: 'Campaña creada',
        error: 'No se pudo crear la campaña',
      });
      setCreateOpen(false);
      resetForm();
      // reload
      const listResp = await mailingService.listCampaigns({ page: 1, page_size: 10 });
      const list = ((listResp as any)?.data ?? listResp) as any[];
      if (Array.isArray(list)) {
        setCampaigns(
          list.map((c) => ({
            id: String(c.id ?? c.code ?? Math.random().toString(36).slice(2)),
            name: c.name || 'Sin nombre',
            subject: c.subject || 'Sin asunto',
            status: (c.status || 'DRAFT').toUpperCase(),
            send_at: c.send_at,
            segment: c.segment,
            open_rate: c.open_rate,
            click_rate: c.click_rate,
          }))
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo crear la campaña';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const selectedEmails = useMemo(
    () => customers.filter((c) => c.selected).map((c) => c.email),
    [customers]
  );

  const toggleCustomer = (id: string, checked: boolean) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, selected: checked } : c)));
  };

  const toggleAllCustomers = (checked: boolean) => {
    setCustomers((prev) => prev.map((c) => ({ ...c, selected: checked })));
  };

  const handleSendBulk = async () => {
    const to = selectedEmails.length ? selectedEmails : customers.map((c) => c.email);
    if (!to.length) {
      toast.error('No hay destinatarios con email.');
      return;
    }
    if (!sendForm.from.trim() || !sendForm.subject.trim() || !sendForm.html.trim()) {
      toast.error('Completa remitente, asunto y contenido.');
      return;
    }
    setSending(true);
    try {
      const payload = {
        from: sendForm.from.trim(),
        to,
        subject: sendForm.subject.trim(),
        html: sendForm.html.trim(),
      };
      await toast.promise(mailingService.sendBulk(payload), {
        pending: 'Enviando campaña...',
        success: 'Envío iniciado',
        error: 'No se pudo enviar la campaña',
      });
      setSendOpen(false);
      setSendForm({ from: '', subject: '', html: '' });
      toggleAllCustomers(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo enviar el mailing';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const metrics = useMemo(() => {
    return [
      { label: 'Contactos', value: dashboard?.total_contacts ?? 0 },
      { label: 'Campañas enviadas', value: dashboard?.campaigns_sent ?? 0 },
      { label: 'Apertura prom.', value: formatRate(dashboard?.open_rate_avg) },
      { label: 'Clics prom.', value: formatRate(dashboard?.click_rate_avg) },
      { label: 'Desuscripción', value: formatRate(dashboard?.unsubscribe_rate_avg) },
    ];
  }, [dashboard]);

  const scheduled = dashboard?.scheduled ?? [];
  const last = dashboard?.last_campaign;

  return (
    <>
      <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">Mailing</p>
        <h1 className="text-3xl font-black text-[#181411] dark:text-white">Campañas y envíos</h1>
        <p className="text-[#8a7560] dark:text-[#a3907d]">
          Gestiona campañas, audiencias y desempeño en un solo lugar.
        </p>
      </header>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-[#6b7280] dark:text-[#a3907d]">
          {loading ? 'Actualizando datos...' : ''}
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold shadow-sm hover:bg-primary/90"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Crear campaña
        </button>
        <button
          onClick={() => setSendOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 text-primary font-semibold hover:bg-primary/5"
        >
          <span className="material-symbols-outlined text-base">send</span>
          Envío masivo
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-4 shadow-sm"
          >
            <p className="text-[11px] font-semibold text-[#8a7560] uppercase tracking-wide">
              {m.label}
            </p>
            <p className="text-2xl font-black text-[#181411] dark:text-white mt-2">
              {typeof m.value === 'number' ? m.value : m.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-4 shadow-sm space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#181411] dark:text-white">Campañas</h3>
            {loading && <span className="text-xs text-gray-500">Cargando...</span>}
          </div>
          {campaigns.length === 0 ? (
            <p className="text-sm text-[#6b7280] dark:text-[#a3907d]">
              No hay campañas aún. Crea tu primera campaña para empezar.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#fcfbf9] dark:bg-[#3d3226]">
                  <tr>
                    <th className="px-4 py-2 text-xs font-bold text-[#8a7560] uppercase tracking-wider">
                      Campaña
                    </th>
                    <th className="px-4 py-2 text-xs font-bold text-[#8a7560] uppercase tracking-wider">
                      Asunto
                    </th>
                    <th className="px-4 py-2 text-xs font-bold text-[#8a7560] uppercase tracking-wider">
                      Segmento
                    </th>
                    <th className="px-4 py-2 text-xs font-bold text-[#8a7560] uppercase tracking-wider">
                      Envío
                    </th>
                    <th className="px-4 py-2 text-xs font-bold text-[#8a7560] uppercase tracking-wider">
                      Open
                    </th>
                    <th className="px-4 py-2 text-xs font-bold text-[#8a7560] uppercase tracking-wider">
                      Click
                    </th>
                    <th className="px-4 py-2 text-xs font-bold text-[#8a7560] uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f2f0] dark:divide-[#3d3226] text-sm">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-background-light dark:hover:bg-[#3d3226]">
                      <td className="px-4 py-2 font-semibold text-[#181411] dark:text-white">
                        {c.name}
                      </td>
                      <td className="px-4 py-2 text-[#4b5563] dark:text-[#a3907d]">{c.subject}</td>
                      <td className="px-4 py-2 text-[#4b5563] dark:text-[#a3907d]">
                        {c.segment || '—'}
                      </td>
                      <td className="px-4 py-2 text-[#4b5563] dark:text-[#a3907d]">
                        {formatDateTime(c.send_at)}
                      </td>
                      <td className="px-4 py-2 font-semibold text-[#181411] dark:text-white">
                        {formatRate(c.open_rate)}
                      </td>
                      <td className="px-4 py-2 font-semibold text-[#181411] dark:text-white">
                        {formatRate(c.click_rate)}
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#2d2419] border border-[#e6e0db] dark:border-[#3d3226] rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#181411] dark:text-white">Próximos envíos</h3>
            {loading && <span className="text-xs text-gray-500">Cargando...</span>}
          </div>
          {scheduled.length === 0 ? (
            <p className="text-sm text-[#6b7280] dark:text-[#a3907d]">No hay envíos programados.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {scheduled.map((s) => (
                <li
                  key={s.id}
                  className="p-3 rounded-lg border border-[#e6e0db] dark:border-[#3d3226] bg-white dark:bg-[#2d2419]"
                >
                  <p className="font-semibold text-[#181411] dark:text-white">{s.name}</p>
                  <p className="text-xs text-[#4b5563] dark:text-[#a3907d]">
                    {s.segment || 'Segmento no especificado'}
                  </p>
                  <p className="text-xs text-[#4b5563] dark:text-[#a3907d]">
                    Envío: {formatDateTime(s.send_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-[#e6e0db] dark:border-[#3d3226] pt-3">
            <h4 className="text-sm font-bold text-[#181411] dark:text-white mb-1">Última campaña</h4>
            {last ? (
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-[#181411] dark:text-white">{last.name}</p>
                <p className="text-xs text-[#4b5563] dark:text-[#a3907d]">
                  Enviada: {formatDateTime(last.sent_at)}
                </p>
                <p className="text-xs text-[#4b5563] dark:text-[#a3907d]">
                  Open: {formatRate(last.open_rate)}
                </p>
                <p className="text-xs text-[#4b5563] dark:text-[#a3907d]">
                  Click: {formatRate(last.click_rate)}
                </p>
                <span className="inline-flex px-2 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                  {last.status || '—'}
                </span>
              </div>
            ) : (
              <p className="text-sm text-[#6b7280] dark:text-[#a3907d]">Sin campañas enviadas aún.</p>
            )}
          </div>
        </div>
      </div>

      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-[#2d2419] rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#181411] dark:text-white">Nueva campaña</h3>
              <button
                className="p-2 rounded-lg hover:bg-primary/10 text-[#8a7560]"
                onClick={() => {
                  setCreateOpen(false);
                  resetForm();
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#8a7560]">Nombre *</label>
                <input
                  className="border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1f1a13]"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#8a7560]">Asunto *</label>
                <input
                  className="border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1f1a13]"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#8a7560]">Preheader</label>
                <input
                  className="border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1f1a13]"
                  value={form.preheader}
                  onChange={(e) => setForm((f) => ({ ...f, preheader: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#8a7560]">Remitente *</label>
                <input
                  className="border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1f1a13]"
                  placeholder="ej: marketing@tu-dominio.com"
                  value={form.sender}
                  onChange={(e) => setForm((f) => ({ ...f, sender: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#8a7560]">Segmento *</label>
                <input
                  className="border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1f1a13]"
                  placeholder="Ej: clientes_activos"
                  value={form.segment}
                  onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#8a7560]">Tipo de envío *</label>
                <select
                  className="border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1f1a13]"
                  value={form.send_type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, send_type: e.target.value as CampaignForm['send_type'] }))
                  }
                >
                  <option value="IMMEDIATE">Inmediato</option>
                  <option value="SCHEDULED">Programado</option>
                </select>
              </div>
              {form.send_type === 'SCHEDULED' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#8a7560]">Fecha/hora de envío</label>
                  <input
                    type="datetime-local"
                    className="border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1f1a13]"
                    value={form.send_at}
                    onChange={(e) => setForm((f) => ({ ...f, send_at: e.target.value }))}
                  />
                </div>
              )}
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#8a7560]">Contenido</label>
                <textarea
                  rows={4}
                  className="border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1f1a13]"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Cuerpo de la campaña (HTML o texto)."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto_utm"
                  className="accent-primary"
                  checked={form.auto_utm}
                  onChange={(e) => setForm((f) => ({ ...f, auto_utm: e.target.checked }))}
                />
                <label htmlFor="auto_utm" className="text-sm text-[#4b5563] dark:text-[#a3907d]">
                  Añadir UTM automáticamente
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ab_test"
                  className="accent-primary"
                  checked={form.ab_test_subject}
                  onChange={(e) => setForm((f) => ({ ...f, ab_test_subject: e.target.checked }))}
                />
                <label htmlFor="ab_test" className="text-sm text-[#4b5563] dark:text-[#a3907d]">
                  Activar A/B test de asunto
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg border border-primary/20 text-[#4b5563] hover:bg-primary/5"
                onClick={() => {
                  setCreateOpen(false);
                  resetForm();
                }}
                disabled={creating}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60"
                onClick={handleCreateCampaign}
                disabled={creating}
              >
                {creating ? 'Creando...' : 'Crear campaña'}
              </button>
            </div>
          </div>
        </div>
      )}

      {sendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-[#2d2419] rounded-2xl shadow-xl w-full max-w-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#181411] dark:text-white">Enviar mailing</h3>
              <button
                className="p-2 rounded-lg hover:bg-primary/10 text-[#8a7560]"
                onClick={() => {
                  setSendOpen(false);
                  setSendForm({ from: '', subject: '', html: '' });
                  toggleAllCustomers(false);
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#8a7560]">Remitente *</label>
                <input
                  className="border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1f1a13]"
                  placeholder="ej: onboarding@tu-dominio.com"
                  value={sendForm.from}
                  onChange={(e) => setSendForm((f) => ({ ...f, from: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#8a7560]">Asunto *</label>
                <input
                  className="border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1f1a13]"
                  value={sendForm.subject}
                  onChange={(e) => setSendForm((f) => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#8a7560]">Contenido HTML *</label>
                <textarea
                  rows={6}
                  className="border border-primary/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1f1a13]"
                  placeholder="<h1>Hola</h1><p>Contenido</p>"
                  value={sendForm.html}
                  onChange={(e) => setSendForm((f) => ({ ...f, html: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-[#6b7280] dark:text-[#a3907d]">
                Vista previa renderiza el HTML tal cual (sin sanitizar).
              </div>
              <label className="flex items-center gap-2 text-sm text-[#4b5563] dark:text-[#a3907d]">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={showPreview}
                  onChange={(e) => setShowPreview(e.target.checked)}
                />
                Mostrar previsualización
              </label>
            </div>
            {showPreview && (
              <div className="border border-primary/20 rounded-lg p-3 bg-white dark:bg-[#1f1a13] max-h-72 overflow-y-auto text-sm text-[#181411] dark:text-white">
                <div dangerouslySetInnerHTML={{ __html: sendForm.html || '<p>(Sin contenido)</p>' }} />
              </div>
            )}

            <div className="border-t border-[#e6e0db] dark:border-[#3d3226] pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#181411] dark:text-white">Destinatarios</p>
                  <p className="text-xs text-[#6b7280] dark:text-[#a3907d]">
                    Selecciona clientes o envía a todos. Si no marcas ninguno, se enviará a todos los que tengan email.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="select_all_customers"
                    className="accent-primary"
                    checked={
                      customers.length > 0 &&
                      customers.every((c) => c.selected || !c.email === false) &&
                      selectedEmails.length === customers.length
                    }
                    onChange={(e) => toggleAllCustomers(e.target.checked)}
                  />
                  <label
                    htmlFor="select_all_customers"
                    className="text-xs font-semibold text-[#4b5563] dark:text-[#a3907d]"
                  >
                    Seleccionar todos
                  </label>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto border border-[#e6e0db] dark:border-[#3d3226] rounded-lg divide-y divide-[#f5f2f0] dark:divide-[#3d3226] bg-white dark:bg-[#2d2419]">
                {customers.length === 0 ? (
                  <div className="p-3 text-sm text-[#6b7280] dark:text-[#a3907d]">
                    No hay clientes con email.
                  </div>
                ) : (
                  customers.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-3 p-3 text-sm text-[#181411] dark:text-white"
                    >
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={c.selected}
                        onChange={(e) => toggleCustomer(c.id, e.target.checked)}
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-xs text-[#6b7280] dark:text-[#a3907d]">{c.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-[#6b7280] dark:text-[#a3907d]">
                <span>Seleccionados: {selectedEmails.length} / {customers.length}</span>
                <span>Si no eliges ninguno, se enviará a todos.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg border border-primary/20 text-[#4b5563] hover:bg-primary/5"
                onClick={() => {
                  setSendOpen(false);
                  setSendForm({ from: '', subject: '', html: '' });
                  toggleAllCustomers(false);
                }}
                disabled={sending}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60"
                onClick={handleSendBulk}
                disabled={sending}
              >
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

