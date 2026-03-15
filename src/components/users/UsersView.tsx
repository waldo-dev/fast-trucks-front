'use client';

import { useEffect, useMemo, useState } from 'react';
import { businessService, userService } from '@/lib/services';
import { toast } from 'react-toastify';
import { getCachedUser } from '@/lib/auth';
import { OWNER_ROLES } from '@/lib/constants';

const friendlyUserError = (err: any, fallback: string) => {
  const msg =
    (err?.response?.data as any)?.message ||
    (err?.response?.data as any)?.error ||
    err?.message ||
    err;
  if (typeof msg === 'string') {
    const lower = msg.toLowerCase();
    if (
      lower.includes('email') &&
      (lower.includes('exists') || lower.includes('registrado') || lower.includes('duplicate'))
    ) {
      return 'El correo ya está registrado. Usa otro correo.';
    }
    return msg;
  }
  return fallback;
};

type NormalizedUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
  businessName?: string;
  businessId?: string;
  businessIds?: string[];
  status?: string;
};

interface UsersViewProps {
  scope: 'owner' | 'admin';
}

export const UsersView = ({ scope }: UsersViewProps) => {
  const [users, setUsers] = useState<NormalizedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<NormalizedUser | null>(null);
  const [passwordUser, setPasswordUser] = useState<NormalizedUser | null>(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<NormalizedUser | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [form, setForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
    active: boolean;
    businessIds: string[];
  }>({
    name: '',
    email: '',
    password: '',
    role: 'LOCAL_OPERATOR',
    active: true,
    businessIds: [],
  });

  const cachedRole = getCachedUser()?.role?.toUpperCase();
  const cachedBusinessId = getCachedUser()?.businessId;
  const roleLabel = (role?: string) => {
    const r = (role || '').toUpperCase();
    if (r === 'ADMIN') return 'Admin';
    if (OWNER_ROLES.includes(r as (typeof OWNER_ROLES)[number])) return 'Dueño de negocio';
    if (r === 'LOCAL_OPERATOR') return 'Operador de local';
    return role || 'N/A';
  };
  const scopeCopy =
    scope === 'admin'
      ? 'Verás todos los usuarios de todos los locales y cuentas.'
      : 'Verás solo los usuarios asociados a tus locales.';

  const businessMap = useMemo(() => {
    const map = new Map<string, string>();
    businesses.forEach((b) => map.set(String(b.id), b.name));
    return map;
  }, [businesses]);

  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const resp = await businessService.list();
        const list = (resp as any)?.data ?? resp;
        if (Array.isArray(list)) {
          const mapped = list.map((b: any) => ({
            id: String(b.id),
            name: b.name || b.brand_name || 'Sin nombre',
          }));
          setBusinesses(mapped);
          if (scope === 'owner') {
            // Owner: opción por defecto "todos mis negocios"
            setSelectedBusiness('');
          } else {
            setSelectedBusiness('');
          }
        } else {
          setBusinesses([]);
        }
      } catch {
        setBusinesses([]);
      }
    };

    loadBusinesses();
  }, [scope, cachedBusinessId]);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const businessIdParam =
          scope === 'owner'
            ? selectedBusiness || undefined
            : selectedBusiness || undefined;

        if (scope === 'admin') {
          const resp = await userService.listAdminsOwners(
            businessIdParam ? { business_id: businessIdParam } : undefined
          );
          const list = (resp as any)?.data ?? resp;
          if (Array.isArray(list)) {
            setUsers(
              list.map((u: any) => ({
                id: String(u.id ?? Math.random().toString(36).slice(2)),
                name: u.name || 'Sin nombre',
                email: u.email || 'Sin correo',
                role: (u.role || 'N/A') as string,
                businessId:
                  u.business?.id !== undefined
                    ? String(u.business.id)
                    : u.business_id !== undefined
                    ? String(u.business_id)
                    : undefined,
                businessIds: Array.isArray(u.business_ids)
                  ? u.business_ids.map((id: any) => String(id))
                  : u.business_id !== undefined
                  ? [String(u.business_id)]
                  : [],
                businessName: (() => {
                  const ids =
                    Array.isArray(u.business_ids) && u.business_ids.length
                      ? u.business_ids
                      : u.business_id !== undefined
                      ? [u.business_id]
                      : [];
                  const names = ids
                    .map((id: any) => businessMap.get(String(id)))
                    .filter(Boolean);
                  return names.length
                    ? names.join(' / ')
                    : u.business?.name || u.business_name || '—';
                })(),
                status: u.status || u.state || 'activo',
              }))
            );
          } else {
            setUsers([]);
          }
          return;
        }

        // Owner: si no se selecciona negocio, cargar todos los asociados (una llamada por negocio)
        if (scope === 'owner' && !businessIdParam && businesses.length > 0) {
          const responses = await Promise.all(
            businesses.map((b) => userService.listByBusiness(b.id))
          );
          const aggregated: Record<string, any> = {};
          responses.forEach((resp) => {
            const data = (resp as any)?.data ?? resp;
            if (Array.isArray(data)) {
              data.forEach((u: any) => {
                const rawId = u.id ?? u.email ?? `${u.name}-${u.role}`;
                const id = String(rawId);
                const businessIds = Array.isArray(u.business_ids)
                  ? u.business_ids.map((bid: string | number) => String(bid))
                  : u.business_id !== undefined
                  ? [String(u.business_id)]
                  : [];
                const businessNameFromIds = businessIds
                  .map((bid: string) => businessMap.get(String(bid)))
                  .filter(Boolean);
                const businessName =
                  businessNameFromIds.length > 0
                    ? businessNameFromIds.join(' / ')
                    : u.business?.name || u.business_name || '—';
                if (aggregated[id]) {
                  // Combina nombres de negocio sin duplicar
                  const existing = aggregated[id];
                  const names = new Set(
                    `${existing.businessName || ''}`
                      .split(' / ')
                      .filter(Boolean)
                      .concat(businessName)
                  );
                  aggregated[id] = {
                    ...existing,
                    businessName: Array.from(names).join(' / '),
                  };
                } else {
                  aggregated[id] = {
                    id,
                    name: u.name || 'Sin nombre',
                    email: u.email || 'Sin correo',
                    role: (u.role || 'N/A') as string,
                    businessName,
                    businessIds,
                    businessId: businessIds[0],
                    status: u.status || u.state || 'activo',
                  };
                }
              });
            }
          });
          setUsers(Object.values(aggregated));
          return;
        }

        const resp = businessIdParam
          ? await userService.listByBusiness(businessIdParam)
          : await userService.list();
        const list = (resp as any)?.data ?? resp;
        if (Array.isArray(list)) {
          const mapped = list.map((u: any) => ({
            id: String(u.id ?? Math.random().toString(36).slice(2)),
            name: u.name || 'Sin nombre',
            email: u.email || 'Sin correo',
            role: (u.role || 'N/A') as string,
            businessId:
              u.business?.id !== undefined
                ? String(u.business.id)
                : u.business_id !== undefined
                ? String(u.business_id)
                : undefined,
            businessIds: Array.isArray(u.business_ids)
              ? u.business_ids.map((id: any) => String(id))
              : u.business_id !== undefined
              ? [String(u.business_id)]
              : [],
            businessName: (() => {
              const ids =
                Array.isArray(u.business_ids) && u.business_ids.length
                  ? u.business_ids
                  : u.business_id !== undefined
                  ? [u.business_id]
                  : [];
              const names = ids
                .map((id: any) => businessMap.get(String(id)))
                .filter(Boolean);
              return names.length
                ? names.join(' / ')
                : u.business?.name || u.business_name || '—';
            })(),
            status: u.status || u.state || 'activo',
          }));
          setUsers(mapped);
        } else {
          setUsers([]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No se pudieron cargar los usuarios'
        );
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [scope, selectedBusiness, cachedBusinessId, reloadKey, businesses]);

  const handleDelete = async (user: NormalizedUser) => {
    setActionError(null);
    if (cachedRole !== 'ADMIN') {
      setActionError('Solo un administrador puede eliminar usuarios.');
      toast.error('Solo un administrador puede eliminar usuarios.');
      return;
    }

    const businessIdForDelete =
      selectedBusiness ||
      (user.businessId ? String(user.businessId) : '') ||
      (cachedBusinessId ? String(cachedBusinessId) : '');

    if (!businessIdForDelete) {
      const msg = 'Selecciona un negocio para eliminar este usuario.';
      setActionError(msg);
      toast.error(msg);
      return;
    }

    setDeletingId(user.id);
    try {
      await toast.promise(
        userService.remove(user.id, { business_id: businessIdForDelete }),
        {
          pending: 'Eliminando usuario...',
          success: 'Usuario eliminado (inactivado) correctamente',
          error: 'No se pudo eliminar el usuario',
        }
      );
      setReloadKey((n) => n + 1);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'No se pudo eliminar el usuario';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setDeletingId(null);
      setConfirmUser(null);
    }
  };

  const filtered = useMemo(() => {
    const byBusiness = selectedBusiness
      ? users.filter((u) => {
          const ids = u.businessIds || (u.businessId ? [u.businessId] : []);
          return ids.map(String).includes(String(selectedBusiness));
        })
      : users;

    if (!search.trim()) return byBusiness;
    const term = search.toLowerCase();
    return byBusiness.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.role || '').toLowerCase().includes(term) ||
        (u.businessName || '').toLowerCase().includes(term)
    );
  }, [search, users, selectedBusiness]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedBusiness, users]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7560]">
          <span className="material-symbols-outlined text-sm">group</span>
          <span>Usuarios</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-[#181411] dark:text-white">
              Gestión de usuarios
            </h1>
            <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">{scopeCopy}</p>
          </div>
          <span className="text-xs font-semibold text-[#8a7560] bg-[#f5f2f0] px-3 py-1 rounded-full">
            Rol actual: {roleLabel(cachedRole) || '—'}
          </span>
        </div>
      </header>

      <div className="bg-white dark:bg-[#2d2419] rounded-xl border border-[#e6e0db] dark:border-[#3d3326] p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 h-11 bg-[#f9f7f5] dark:bg-[#241c14] border border-[#e6e0db] dark:border-[#3d3326] rounded-lg text-sm text-[#181411] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="Buscar por nombre, email o rol"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {businesses.length > 0 && (
              <select
                className="h-11 rounded-lg border border-[#e6e0db] dark:border-[#3d3326] bg-[#f9f7f5] dark:bg-[#241c14] px-3 text-sm text-[#181411] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none w-full sm:w-64"
                value={selectedBusiness}
                onChange={(e) => setSelectedBusiness(e.target.value)}
              >
                {scope === 'admin' ? (
                  <option value="">Todos los negocios</option>
                ) : (
                  <option value="">Todos mis negocios</option>
                )}
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 px-4 h-11 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors w-full sm:w-auto"
              onClick={() => {
                setEditingUser(null);
                setActionError(null);
                setForm({
                  name: '',
                  email: '',
                  password: '',
                  role: 'LOCAL_OPERATOR',
                  active: true,
                  businessIds:
                    scope === 'owner' && (selectedBusiness || cachedBusinessId)
                      ? [String(selectedBusiness || cachedBusinessId)]
                      : [],
                });
                setModalError(null);
                setModalOpen(true);
              }}
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Nuevo usuario
            </button>
          </div>
        </div>

        {actionError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-500">Cargando usuarios...</div>
        ) : error ? (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-primary/20 rounded-xl p-6 text-sm text-gray-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>No hay usuarios para mostrar.</span>
            <button
              type="button"
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-primary/20 w-full sm:w-auto justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              Crear usuario
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop: tabla */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-[#8a7560] uppercase tracking-[0.08em] text-xs">
                    <th className="px-3 py-2">Nombre</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Rol</th>
                    <th className="px-3 py-2">Local/Negocio</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-[#f0ece8] dark:border-[#3d3326] hover:bg-[#f9f7f5] dark:hover:bg-[#241c14]"
                    >
                      <td className="px-3 py-3 font-semibold text-[#181411] dark:text-white">
                        {user.name}
                      </td>
                      <td className="px-3 py-3 text-[#4b5563] dark:text-[#a3907d]">
                        {user.email}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#f5f2f0] text-[#8a7560] dark:bg-[#241c14] dark:text-[#d2b29b]">
                          <span className="material-symbols-outlined text-[14px]">shield_person</span>
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[#4b5563] dark:text-[#a3907d]">
                        {user.businessName || '—'}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="material-symbols-outlined text-[14px]">task_alt</span>
                          {user.status || 'activo'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(user);
                              setActionError(null);
                              setForm({
                                name: user.name,
                                email: user.email,
                                password: '',
                                role: user.role || 'LOCAL_OPERATOR',
                                active: (user.status || 'activo').toLowerCase() !== 'inactive',
                                businessIds:
                                  user.businessIds && user.businessIds.length
                                    ? user.businessIds
                                    : user.businessId
                                    ? [user.businessId]
                                    : [],
                              });
                              setModalError(null);
                              setModalOpen(true);
                            }}
                            className="text-primary font-semibold text-sm hover:underline"
                          >
                            Editar
                          </button>
                          {(cachedRole === 'ADMIN' || cachedRole === 'BUSINESS_OWNER') && (
                            <button
                              type="button"
                              onClick={() => {
                                setPasswordUser(user);
                                setPasswordValue('');
                                setPasswordError(null);
                              }}
                              className="text-[#8a7560] font-semibold text-sm hover:underline"
                            >
                              Contraseña
                            </button>
                          )}
                          {cachedRole === 'ADMIN' && (
                            <button
                              type="button"
                              onClick={() => setConfirmUser(user)}
                              disabled={deletingId === user.id}
                              className="text-red-600 font-semibold text-sm hover:underline disabled:opacity-60"
                            >
                              {deletingId === user.id ? 'Eliminando...' : 'Eliminar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: tarjetas */}
            <div className="md:hidden divide-y divide-[#f0ece8] dark:divide-[#3d3326] border border-[#f0ece8] dark:border-[#3d3326] rounded-xl">
              {paginatedUsers.map((user) => (
                <div key={user.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#181411] dark:text-white">{user.name}</p>
                      <p className="text-xs text-[#8a7560]">{user.email}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#f5f2f0] text-[#8a7560] dark:bg-[#241c14] dark:text-[#d2b29b]">
                      <span className="material-symbols-outlined text-[14px]">shield_person</span>
                      {roleLabel(user.role)}
                    </span>
                  </div>
                  <div className="text-sm text-[#4b5563] dark:text-[#a3907d]">
                    <p className="font-semibold">{user.businessName || '—'}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <span className="material-symbols-outlined text-[14px]">task_alt</span>
                      {user.status || 'activo'}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUser(user);
                          setActionError(null);
                          setForm({
                            name: user.name,
                            email: user.email,
                            password: '',
                            role: user.role || 'LOCAL_OPERATOR',
                            active: (user.status || 'activo').toLowerCase() !== 'inactive',
                            businessIds:
                              user.businessIds && user.businessIds.length
                                ? user.businessIds
                                : user.businessId
                                ? [user.businessId]
                                : [],
                          });
                          setModalError(null);
                          setModalOpen(true);
                        }}
                        className="text-primary font-semibold text-xs hover:underline"
                      >
                        Editar
                      </button>
                      {(cachedRole === 'ADMIN' || cachedRole === 'BUSINESS_OWNER') && (
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordUser(user);
                            setPasswordValue('');
                            setPasswordError(null);
                          }}
                          className="text-[#8a7560] font-semibold text-xs hover:underline"
                        >
                          Contraseña
                        </button>
                      )}
                      {cachedRole === 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => setConfirmUser(user)}
                          disabled={deletingId === user.id}
                          className="text-red-600 font-semibold text-xs hover:underline disabled:opacity-60"
                        >
                          {deletingId === user.id ? '...' : 'Eliminar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm text-[#8a7560] text-center sm:text-left">
                Mostrando{' '}
                <span className="text-[#181411]">
                  {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                  {filtered.length > 0 ? `-${Math.min(currentPage * pageSize, filtered.length)}` : ''}
                </span>{' '}
                de <span className="text-[#181411]">{filtered.length}</span> usuarios
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-2 py-4">
          <div className="bg-white dark:bg-[#2d2419] rounded-xl shadow-2xl border border-primary/10 w-full max-w-xl relative flex flex-col max-h-[calc(100vh-2rem)]">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-primary"
              onClick={() => setModalOpen(false)}
              aria-label="Cerrar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="overflow-y-auto px-6 py-6 space-y-4">
            <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-1">
              {editingUser ? 'Editar usuario' : 'Crear usuario'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-[#a3907d] mb-4">
              Completa la información y asigna el rol y los locales permitidos.
            </p>
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setModalError(null);
                const allowedRoles =
                  cachedRole === 'ADMIN'
                    ? ['ADMIN', 'BUSINESS_OWNER', 'LOCAL_OPERATOR']
                    : ['BUSINESS_OWNER', 'LOCAL_OPERATOR'];
                if (!allowedRoles.includes(form.role)) {
                  setModalError('No puedes asignar ese rol.');
                  return;
                }
                const businessIds =
                  form.businessIds.length > 0
                    ? form.businessIds
                    : scope === 'owner' && (selectedBusiness || cachedBusinessId)
                    ? [String(selectedBusiness || cachedBusinessId)]
                    : [];
                if (!businessIds.length) {
                  setModalError('Selecciona al menos un negocio.');
                  return;
                }

                setModalSaving(true);
                try {
                  if (editingUser) {
                    await toast.promise(
                      userService.update(editingUser.id, {
                        name: form.name,
                        email: form.email.toLowerCase(),
                        role: form.role,
                        active: form.active,
                        business_ids: businessIds.map((b) => Number(b)),
                      }),
                      {
                        pending: 'Guardando usuario...',
                        success: 'Usuario actualizado correctamente',
                        error: 'No se pudo guardar el usuario',
                      }
                    );
                  } else {
                    await toast.promise(
                      userService.create({
                        name: form.name,
                        email: form.email.toLowerCase(),
                        password: form.password,
                        role: form.role,
                        business_ids: businessIds.map((b) => Number(b)),
                      }),
                      {
                        pending: 'Creando usuario...',
                        success: 'Usuario creado correctamente',
                        error: 'No se pudo guardar el usuario',
                      }
                    );
                  }
                  setModalOpen(false);
                  setEditingUser(null);
                  setForm({
                    name: '',
                    email: '',
                    password: '',
                    role: scope === 'admin' ? 'ADMIN' : 'BUSINESS_OWNER',
                    active: true,
                    businessIds: [],
                  });
                  setReloadKey((n) => n + 1);
                } catch (err) {
                  const msg = friendlyUserError(err, 'No se pudo guardar el usuario');
                  setModalError(msg);
                  toast.error(msg);
                } finally {
                  setModalSaving(false);
                }
              }}
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411] dark:text-white">
                  Nombre
                </label>
                <input
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none dark:bg-[#241c14] dark:border-[#3d3326] dark:text-white"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411] dark:text-white">
                  Email
                </label>
                <input
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none dark:bg-[#241c14] dark:border-[#3d3326] dark:text-white"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              {!editingUser && (
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-semibold text-[#181411] dark:text-white">
                    Contraseña
                  </label>
                  <input
                    className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none dark:bg-[#241c14] dark:border-[#3d3326] dark:text-white"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    required
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411] dark:text-white">
                  Rol
                </label>
                <select
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none dark:bg-[#241c14] dark:border-[#3d3326] dark:text-white"
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                >
                  {cachedRole === 'ADMIN' && <option value="ADMIN">Admin</option>}
                  {cachedRole === 'ADMIN' && <option value="BUSINESS_OWNER">Dueño de negocio</option>}
                  <option value="LOCAL_OPERATOR">Operador de local</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411] dark:text-white">
                  Activo
                </label>
                <select
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none dark:bg-[#241c14] dark:border-[#3d3326] dark:text-white"
                  value={form.active ? '1' : '0'}
                  onChange={(e) => setForm((p) => ({ ...p, active: e.target.value === '1' }))}
                >
                  <option value="1">Sí</option>
                  <option value="0">No</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-[#181411] dark:text-white">
                  Asociar a negocios
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {businesses.map((b) => {
                    const checked = form.businessIds.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:border-primary/40 dark:border-[#3d3326] dark:hover:border-primary/60"
                      >
                        <input
                          type="checkbox"
                          className="text-primary border-gray-300 rounded focus:ring-primary"
                          checked={checked}
                          onChange={() =>
                            setForm((prev) => ({
                              ...prev,
                              businessIds: checked
                                ? prev.businessIds.filter((id) => id !== b.id)
                                : [...prev.businessIds, b.id],
                            }))
                          }
                        />
                        <span className="text-sm text-gray-700 dark:text-[#d2b29b]">{b.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              {modalError && (
                <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {modalError}
                </div>
              )}
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setModalError(null);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {modalSaving ? 'Guardando...' : editingUser ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {confirmUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white dark:bg-[#2d2419] rounded-xl shadow-2xl border border-primary/10 w-full max-w-md p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-primary"
              onClick={() => setConfirmUser(null)}
              aria-label="Cerrar confirmación"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-[#181411] dark:text-white">
                  Confirmar eliminación
                </h4>
                <p className="text-sm text-gray-600 dark:text-[#a3907d]">
                  ¿Seguro que deseas eliminar (inactivar) al usuario <strong>{confirmUser.name}</strong>?
                  Esta acción lo dejará inactivo.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                onClick={() => setConfirmUser(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60"
                disabled={!!deletingId}
                onClick={() => handleDelete(confirmUser)}
              >
                {deletingId === confirmUser.id ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white dark:bg-[#2d2419] rounded-xl shadow-2xl border border-primary/10 w-full max-w-md p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-primary"
              onClick={() => {
                setPasswordUser(null);
                setPasswordValue('');
                setPasswordError(null);
              }}
              aria-label="Cerrar cambio de contraseña"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-[#181411] dark:text-white">
                Actualizar contraseña
              </h4>
              <p className="text-sm text-gray-600 dark:text-[#a3907d]">
                Establece una nueva contraseña para <strong>{passwordUser.name}</strong>.
              </p>
            </div>
            <form
              className="mt-4 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setPasswordError(null);
                if (!passwordValue.trim()) {
                  setPasswordError('La nueva contraseña es obligatoria.');
                  toast.error('La nueva contraseña es obligatoria.');
                  return;
                }

                const businessIdForUpdate =
                  selectedBusiness ||
                  (passwordUser.businessId ? String(passwordUser.businessId) : '') ||
                  (cachedBusinessId ? String(cachedBusinessId) : '');

                setPasswordSaving(true);
                try {
                  await toast.promise(
                    userService.updatePassword(
                      passwordUser.id,
                      { password: passwordValue },
                      businessIdForUpdate ? { business_id: businessIdForUpdate } : undefined
                    ),
                    {
                      pending: 'Actualizando contraseña...',
                      success: 'Contraseña actualizada correctamente',
                      error: 'No se pudo actualizar la contraseña',
                    }
                  );
                  setPasswordUser(null);
                  setPasswordValue('');
                  setReloadKey((n) => n + 1);
                } catch (err) {
                  const msg =
                    err instanceof Error ? err.message : 'No se pudo actualizar la contraseña';
                  setPasswordError(msg);
                  toast.error(msg);
                } finally {
                  setPasswordSaving(false);
                }
              }}
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#181411] dark:text-white">
                  Nueva contraseña
                </label>
                <input
                  className="h-11 rounded-lg border border-primary/20 px-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none dark:bg-[#241c14] dark:border-[#3d3326] dark:text-white"
                  type="password"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  required
                />
              </div>
              {passwordError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {passwordError}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  onClick={() => {
                    setPasswordUser(null);
                    setPasswordValue('');
                    setPasswordError(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {passwordSaving ? 'Guardando...' : 'Guardar contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

