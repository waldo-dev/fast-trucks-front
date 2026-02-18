import { api } from './api';

type StoredUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  user: StoredUser;
};

const ACCESS_TOKEN_KEY = 'fasttrucks_access_token';
const REFRESH_TOKEN_KEY = 'fasttrucks_refresh_token';
const USER_KEY = 'fasttrucks_user';

const isBrowser = () => typeof window !== 'undefined';

const clearStoredSession = () => {
  if (!isBrowser()) return;
  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(USER_KEY);
  });
};

const storeSession = (
  data: LoginResponse,
  remember: boolean
) => {
  if (!isBrowser()) return;
  const storage = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;

  // Limpia la otra sesión para evitar estados mezclados
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
  const remember = options?.remember ?? false;
  const response = await api.post<LoginResponse>('auth/login', {
    email,
    password,
  });

  storeSession(response, remember);
  return response.user;
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
    const user = await api.get<StoredUser>('auth/me', { auth: true });
    return user;
  } catch {
    // Si falla la API, intenta devolver el usuario guardado para no romper la UI
    return getStoredUser();
  }
};

export const refreshSession = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await api.post<LoginResponse>('/auth/refresh', {
      refreshToken,
    });
    // Reutiliza la preferencia de remember según dónde estaba guardado el refresh
    const remember = !!localStorage.getItem(REFRESH_TOKEN_KEY);
    storeSession(response, remember);
    return response.accessToken;
  } catch {
    clearStoredSession();
    return null;
  }
};
