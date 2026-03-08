import { api } from './api';

type StoredUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  businessId?: string;
  role?: string;
  subscriptionPlanId?: string;
  subscriptionPlanName?: string;
  subscriptionStatus?: string;
  subscriptionTier?: 'BASIC' | 'STANDARD' | 'PRO';
  subscriptionTrialEndsAt?: string;
  subscriptionCurrentPeriodEnd?: string;
};

type ApiUser = {
  id: string | number;
  name: string;
  email: string;
  avatar?: string;
  business_id?: string | number;
  businessId?: string | number;
  role?: string;
};

type LoginApiResponse = {
  success: boolean;
  data: {
    token: string;
    refreshToken?: string;
    role?: string;
    businessId?: string | number;
    business_id?: string | number;
    user: ApiUser;
  };
  message?: string;
};

type MeApiResponse = {
  success: boolean;
  data: ApiUser;
  message?: string;
};

type NormalizedSession = {
  accessToken: string;
  refreshToken?: string;
  user: StoredUser;
};

const ACCESS_TOKEN_KEY = 'fasttrucks_access_token';
const REFRESH_TOKEN_KEY = 'fasttrucks_refresh_token';
const USER_KEY = 'fasttrucks_user';

const isBrowser = () => typeof window !== 'undefined';

const mapToStoredUser = (
  user: ApiUser,
  fallback?: {
    business_id?: string | number;
    businessId?: string | number;
    role?: string;
    subscription?: any;
  }
): StoredUser => {
  const roleValue = user.role ?? fallback?.role;
  const normalizedRole = roleValue ? String(roleValue).toUpperCase() : undefined;
  const businessId =
    user.businessId ??
    user.business_id ??
    fallback?.businessId ??
    (fallback?.business_id ? String(fallback.business_id) : undefined);

  const subscription = (user as any)?.subscription ?? fallback?.subscription;
  const planIdRaw = subscription?.plan?.id ?? subscription?.plan_id;
  const planNameRaw = subscription?.plan?.name ?? subscription?.plan_name;
  const statusRaw = subscription?.status;
  const normalizeTier = (name?: any, id?: any): 'BASIC' | 'STANDARD' | 'PRO' | undefined => {
    const lowered = String(name || '').toLowerCase();
    const idNum = Number(id);
    if (lowered.includes('basic') || idNum === 1) return 'BASIC';
    if (lowered.includes('standard') || lowered.includes('estandar') || lowered.includes('estándar') || idNum === 2)
      return 'STANDARD';
    if (lowered.includes('pro') || idNum === 3) return 'PRO';
    return undefined;
  };
  const tier = normalizeTier(planNameRaw, planIdRaw);

  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    businessId: businessId ? String(businessId) : undefined,
    role: normalizedRole,
    subscriptionPlanId: planIdRaw !== undefined && planIdRaw !== null ? String(planIdRaw) : undefined,
    subscriptionPlanName: planNameRaw,
    subscriptionStatus: statusRaw ? String(statusRaw).toUpperCase() : undefined,
    subscriptionTier: tier,
    subscriptionTrialEndsAt: subscription?.trial_ends_at,
    subscriptionCurrentPeriodEnd: subscription?.current_period_end,
  };
};

const normalizeLoginResponse = (data: LoginApiResponse['data']): NormalizedSession => {
  return {
    accessToken: data.token,
    refreshToken: data.refreshToken,
    user: mapToStoredUser(data.user, {
      business_id: data.business_id,
      businessId: data.businessId,
      role: data.role,
    }),
  };
};

const clearStoredSession = () => {
  if (!isBrowser()) return;
  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(USER_KEY);
  });
};

const storeSession = (data: NormalizedSession) => {
  if (!isBrowser()) return;
  const storage = localStorage;
  const other = sessionStorage;

  // Limpia la otra sesión para evitar estados mezclados y forzar persistencia
  other.removeItem(ACCESS_TOKEN_KEY);
  other.removeItem(REFRESH_TOKEN_KEY);
  other.removeItem(USER_KEY);

  storage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  if (data.refreshToken) {
    storage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  }
  storage.setItem(USER_KEY, JSON.stringify(data.user));
};

const getFromStorage = (key: string): string | null => {
  if (!isBrowser()) return null;
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

const getStoredUser = (): StoredUser | null => {
  if (!isBrowser()) return null;
  const raw =
    localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
};

export const getCachedUser = (): StoredUser | null => {
  return getStoredUser();
};

export const getAccessToken = (): string | null => {
  return getFromStorage(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return getFromStorage(REFRESH_TOKEN_KEY);
};

export const authHeaders = () => {
  const token = getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export const login = async (
  email: string,
  password: string,
  options?: { remember?: boolean }
): Promise<StoredUser> => {
  try {
    const response = await api.post<LoginApiResponse>('auth/login', {
      email,
      password,
    });

    if (!response?.success || !response.data?.token) {
      throw new Error('No se pudo iniciar sesión, verifica tus credenciales');
    }

    const normalized = normalizeLoginResponse(response.data);
    storeSession(normalized);
    return normalized.user;
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes('401')
        ? 'Correo o contraseña incorrectos'
        : 'No se pudo iniciar sesión, verifica tus credenciales';
    throw new Error(message);
  }
};

export const logout = () => {
  clearStoredSession();
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

export const getCurrentUser = async (): Promise<StoredUser | null> => {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const response = await api.get<MeApiResponse>('auth/me', { auth: true });
    if (!response?.success || !response.data) {
      throw new Error('No se pudo obtener el usuario');
    }
    const mapped = mapToStoredUser(response.data, {
      subscription: (response as any)?.data?.subscription,
    });
    // Refresca el cache local sin tocar tokens
    storeSession({
      accessToken: token,
      refreshToken: getRefreshToken() ?? undefined,
      user: mapped,
    });
    return mapped;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const isUnauthorized = message.includes('401');

    if (isUnauthorized) {
      clearStoredSession();
      // Fuerza al guard a redirigir cuando el token expira o es inválido
      throw new Error('Sesión expirada, vuelve a iniciar sesión');
    }

    // Si falla por otra razón (network) intenta devolver el cache
    return getStoredUser();
  }
};

export const refreshSession = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await api.post<LoginApiResponse>('/auth/refresh', {
      refreshToken,
    });
    // Reutiliza la preferencia de remember según dónde estaba guardado el refresh
    if (!response?.success || !response.data?.token) {
      throw new Error('No se pudo refrescar la sesión');
    }
    const normalized = normalizeLoginResponse(response.data);
    storeSession(normalized);
    return normalized.accessToken;
  } catch {
    clearStoredSession();
    return null;
  }
};
