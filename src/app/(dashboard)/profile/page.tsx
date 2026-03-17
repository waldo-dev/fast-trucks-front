'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getCurrentUser, logout } from '@/lib/auth';
import { normalizeRoleLabel } from '@/lib/constants';

type EditorValues = {
  name: string;
  email: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 100;

const PLAN_LABELS: Record<string, string> = {
  BASIC: 'Básico',
  STANDARD: 'Estándar',
  PRO: 'Pro',
};

const formatDate = (value?: string) => {
  if (!value) return 'No disponible';
  try {
    return new Date(value).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return value;
  }
};

const ProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<Awaited<ReturnType<typeof getCurrentUser>>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorValues, setEditorValues] = useState<EditorValues>({
    name: '',
    email: '',
  });
  const [editorError, setEditorError] = useState<string | null>(null);
  const [savingEditor, setSavingEditor] = useState(false);

  const loadUser = async () => {
    setRefreshing(true);
    try {
      const freshUser = await getCurrentUser();
      setUser(freshUser);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo sincronizar';
      setError(message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchUser = async () => {
      setLoading(true);
      try {
        const data = await getCurrentUser();
        if (active) {
          setUser(data);
          setError(null);
        }
      } catch (err) {
        if (active) {
          const message = err instanceof Error ? err.message : 'No se pudo cargar el perfil';
          setError(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchUser();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    setEditorValues({
      name: user.name ?? '',
      email: user.email ?? '',
    });
  }, [user]);

  const planLabel = useMemo(() => {
    if (!user?.subscriptionTier) return 'Sin plan';
    return PLAN_LABELS[user.subscriptionTier] ?? user.subscriptionTier;
  }, [user]);

  const statusLabel = useMemo(() => {
    if (!user?.subscriptionStatus) return 'Sin estado';
    return user.subscriptionStatus.toLowerCase().replace('_', ' ');
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const openEditor = () => {
    setEditorError(null);
    setEditorValues({
      name: user?.name ?? '',
      email: user?.email ?? '',
    });
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    if (savingEditor) return;
    setSavingEditor(false);
    setEditorError(null);
    setIsEditorOpen(false);
  };

  const handleFieldChange = (field: keyof EditorValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setEditorValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleEditorSubmit = async () => {
    if (savingEditor) return;
    const nameValue = editorValues.name.trim();
    const emailValue = editorValues.email.trim();
    const payload: Partial<EditorValues> = {};

    if (nameValue) {
      if (nameValue.length > MAX_NAME_LENGTH) {
        setEditorError(`El nombre no puede superar los ${MAX_NAME_LENGTH} caracteres`);
        return;
      }
      payload.name = nameValue;
    }

    if (emailValue) {
      if (!EMAIL_PATTERN.test(emailValue)) {
        setEditorError('Ingresa un correo válido');
        return;
      }
      payload.email = emailValue;
    }

    if (!Object.keys(payload).length) {
      setEditorError('Ingresa un nombre o correo para actualizar');
      return;
    }

    setSavingEditor(true);
    setEditorError(null);

    try {
      await api.patch('users/me', payload, { auth: true });
      await loadUser();
      setIsEditorOpen(false);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'No se pudo actualizar el perfil';
      setEditorError(message);
    } finally {
      setSavingEditor(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4">
        <header className="rounded-3xl border border-[#e6e0db] bg-white/90 p-6 shadow-sm backdrop-blur dark:border-[#3d3226] dark:bg-[#2d2419]">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
            Cuenta
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-[#181411] dark:text-white">Mi perfil</h1>
            <p className="text-sm text-[#8a7560] dark:text-[#a3907d]">
              Controla tu información personal, la suscripción activa y las opciones de seguridad desde un
              solo lugar.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
              type="button"
              onClick={openEditor}
              disabled={loading}
            >
              Editar perfil
            </button>
            {           /* <button
              className="rounded-full border border-[#e6e0db] px-4 py-2 text-sm font-semibold text-[#4b5563] transition hover:border-[#c7bfb6] dark:border-[#3d3226] dark:text-[#a3907d]"
              type="button"
              onClick={loadUser}
              disabled={loading || refreshing}
            >
              {refreshing ? 'Sincronizando...' : 'Sincronizar datos'}
            </button>*/}
            <button
              className="rounded-full border border-[#e6e0db] px-4 py-2 text-sm font-semibold text-[#4b5563] transition hover:border-[#c7bfb6] dark:border-[#3d3226] dark:text-[#a3907d]"
              type="button"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {loading ? (
          <section className="rounded-3xl border border-[#e6e0db] bg-white/70 p-6 shadow-sm backdrop-blur dark:border-[#3d3226] dark:bg-[#2d2419]">
            <p className="animate-pulse text-sm text-[#8a7560] dark:text-[#a3907d]">Cargando perfil...</p>
          </section>
        ) : (
          <>
            {error && (
              <section className="rounded-3xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700 dark:border-red-600 dark:bg-red-200/20">
                {error}
              </section>
            )}

            <section className="grid gap-6 rounded-3xl border border-[#e6e0db] bg-white/90 p-6 shadow-sm backdrop-blur dark:border-[#3d3226] dark:bg-[#2d2419] md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#8a7560] dark:text-[#a3907d]">
                  Datos personales
                </p>
                <h2 className="text-2xl font-semibold text-[#181411] dark:text-white">
                  {user?.name ?? 'Sin nombre'}
                </h2>
                <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">{user?.email ?? 'Sin correo'}</p>
                <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">
                  Rol actual:{' '}
                  <span className="font-semibold">
                    {normalizeRoleLabel(user?.role, 'Sin rol')}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#8a7560] dark:text-[#a3907d]">
                  Suscripción
                </p>
                <h3 className="text-xl font-semibold text-[#181411] dark:text-white">{planLabel}</h3>
                <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">Estado: {statusLabel}</p>
                <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">
                  Trial finaliza: {formatDate(user?.subscriptionTrialEndsAt)}
                </p>
                <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">
                  Periodo actual: {formatDate(user?.subscriptionCurrentPeriodEnd)}
                </p>
              </div>
            </section>

            <section className="grid gap-6 rounded-3xl border border-[#e6e0db] bg-white/90 p-6 shadow-sm backdrop-blur dark:border-[#3d3226] dark:bg-[#2d2419] md:grid-cols-2">
              <article className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#8a7560] dark:text-[#a3907d]">
                  Seguridad
                </p>
                <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">
                  Puedes solicitar un cambio de contraseña o agregar autenticación adicional desde el portal
                  de Operfoods. Si detectas actividad extraña, cierra sesión de inmediato.
                </p>
                {/*<button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-[#e6e0db] px-4 py-2 text-sm font-semibold text-[#4b5563] transition hover:border-[#c7bfb6] dark:border-[#3d3226] dark:text-[#a3907d]"
                >
                  Cerrar todas las sesiones
                </button>*/}
              </article>
              <article className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#8a7560] dark:text-[#a3907d]">
                  Preferencias
                </p>
                <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">
                  Tu negocio activo actualmente es{' '}
                  <span className="font-semibold">
                    {user?.business?.brandName ?? 'sin selección'}
                  </span>
                  . Puedes administrarlo desde el selector del sidebar.
                </p>
                <p className="text-sm text-[#4b5563] dark:text-[#a3907d]">
                  Mantén tu correo y datos de contacto actualizados para recibir alertas críticas.
                </p>
              </article>
            </section>
          </>
        )}
      </div>
      {isEditorOpen && (
        <div
          className="fixed inset-0 z-50 flex min-h-screen items-center justify-center px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeEditor}
          />
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl transition dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2
                  id="edit-profile-title"
                  className="text-lg font-semibold text-slate-900 dark:text-white"
                >
                  Editar perfil
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Actualiza tu nombre o correo para mantener tu cuenta al día.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                aria-label="Cerrar modal"
                className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="space-y-5">
              <label className="space-y-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                <span>Nombre</span>
                <input
                  id="profile-name"
                  name="name"
                  maxLength={MAX_NAME_LENGTH}
                  value={editorValues.name}
                  onChange={handleFieldChange('name')}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Máximo {MAX_NAME_LENGTH} caracteres.
                </span>
              </label>
              <label className="space-y-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                <span>Correo</span>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={editorValues.email}
                  onChange={handleFieldChange('email')}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Usa un correo válido.
                </span>
              </label>
            </div>
            {editorError && (
              <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
                {editorError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEditor}
                disabled={savingEditor}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEditorSubmit}
                disabled={savingEditor}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
              >
                {savingEditor ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProfilePage;
