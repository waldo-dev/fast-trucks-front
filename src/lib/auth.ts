import { api } from './api';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  OPERATING_CONTEXT_KEY,
} from './storageKeys';

type StoredBusiness = {
  id: string;
  name?: string;
  brandName?: string;
  logoUrl?: string;
};

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
  business?: StoredBusiness;
};

type ApiBusiness = {
  id?: string | number;
  name?: string;
  brand_name?: string;
  logo_url?: string;
};

type ApiUser = {
  id: string | number;
  name: string;
  email: string;
  avatar?: string;
  business_id?: string | number;
  businessId?: string | number;
  business?: ApiBusiness;
  role?: string;
};

type LoginApiResponse = {
  success: boolean;
  data: {
    token: string;
    refreshToken?: string;
    refresh_token?: string;
    role?: string;
    businessId?: string | number;
    business_id?: string | number;
    business?: ApiBusiness;
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

const isBrowser = () => typeof window !== 'undefined';

const readOperatingContextBusinessId = (): string | undefined => {
  if (!isBrowser()) return undefined;
  const raw =
    localStorage.getItem(OPERATING_CONTEXT_KEY) ??
    sessionStorage.getItem(OPERATING_CONTEXT_KEY);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as { business_id?: string | number };
    const id = parsed?.business_id;
    return id ? String(id) : undefined;
  } catch {
    return undefined;
  }
};

const addBusinessIdQueryParam = (endpoint: string) => {
  const businessId = readOperatingContextBusinessId();
  if (!businessId) return endpoint;
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${separator}business_id=${encodeURIComponent(businessId)}`;
};

const normalizeBusiness = (
  detectedId: string | number | undefined,
  source?: ApiBusiness
): StoredBusiness | undefined => {
  const id = source?.id ?? detectedId;
  if (!id) return undefined;
  return {
    id: String(id),
    name: source?.name,
    brandName: source?.brand_name,
    logoUrl: source?.logo_url,
  };
};

const mapToStoredUser = (
  user: ApiUser,
  fallback?: {
    business_id?: string | number;
    businessId?: string | number;
    business?: ApiBusiness;
    role?: string;
    subscription?: any;
  }
): StoredUser => {
  const roleValue = user.role ?? fallback?.role;
  const normalizedRole = roleValue ? String(roleValue).toUpperCase() : undefined;
  const businessId =
    readOperatingContextBusinessId() ??
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

  const business = normalizeBusiness(businessId, user.business ?? fallback?.business);

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
    business,
  };
};

const normalizeLoginResponse = (data: LoginApiResponse['data']): NormalizedSession => {
  const refresh = data.refreshToken ?? (data as any)?.refresh_token;
  return {
    accessToken: data.token,
    refreshToken: refresh,
    user: mapToStoredUser(data.user, {
      business_id: data.business_id,
      businessId: data.businessId,
      business: data.business,
      role: data.role,
    }),
  };
};

const clearBrowserCookies = () => {
  if (!isBrowser()) return;

  const cookies =
    typeof document !== 'undefined' && document.cookie ? document.cookie.split(';') : [];

  cookies.forEach((cookie) => {
    const cookieName = cookie.split('=')[0]?.trim();
    if (!cookieName) return;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
};

const clearOperatingContext = () => {
  if (!isBrowser()) return;

  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem(OPERATING_CONTEXT_KEY);
  });
};

const clearStoredSession = () => {
  if (!isBrowser()) return;
  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(USER_KEY);
  });
  clearOperatingContext();
  clearBrowserCookies();
};

const storeSession = (data: NormalizedSession) => {
  if (!isBrowser()) return;
  const storage = localStorage;
  const other = sessionStorage;

  // Limpia la otra sesión para evitar estados mezclados y forzar persistencia
  other.removeItem(ACCESS_TOKEN_KEY);
  other.removeItem(REFRESH_TOKEN_KEY);
  other.removeItem(USER_KEY);

  // Limpia la actual antes de escribir
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
  storage.removeItem(USER_KEY);

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
    const response = await api.post<LoginApiResponse>(addBusinessIdQueryParam('auth/login'), {
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
    const response = await api.get<MeApiResponse>(addBusinessIdQueryParam('auth/me'), {
      auth: true,
    });
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
    const response = await api.post<LoginApiResponse>(
      addBusinessIdQueryParam('/auth/refresh'),
      {
        refresh_token: refreshToken,
      },
      { auth: false }
    );
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
