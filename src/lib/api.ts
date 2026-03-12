import { config } from './config';

/**
 * API client for making HTTP requests to the backend
 * Uses environment variables for configuration
 */
type ApiRequestOptions = RequestInit & { auth?: boolean };

const ACCESS_TOKEN_KEY = 'fasttrucks_access_token';
const REFRESH_TOKEN_KEY = 'fasttrucks_refresh_token';
const USER_KEY = 'fasttrucks_user';

class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
  }

  private getStoredToken() {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem(ACCESS_TOKEN_KEY) ||
      sessionStorage.getItem(ACCESS_TOKEN_KEY)
    );
  }

  private getRefreshToken() {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem(REFRESH_TOKEN_KEY) ||
      sessionStorage.getItem(REFRESH_TOKEN_KEY)
    );
  }

  private persistTokens(accessToken: string, refreshToken?: string) {
    if (typeof window === 'undefined') return;
    const storage = localStorage;
    [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY].forEach((key) => {
      storage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    storage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  private clearSession() {
    if (typeof window === 'undefined') return;
    [localStorage, sessionStorage].forEach((store) => {
      store.removeItem(ACCESS_TOKEN_KEY);
      store.removeItem(REFRESH_TOKEN_KEY);
      store.removeItem(USER_KEY);
    });
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const resp = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!resp.ok) return null;
      const data: any = await resp.json();
      const token = data?.data?.token ?? data?.token;
      const newRefresh =
        data?.data?.refreshToken ?? data?.data?.refresh_token ?? data?.refresh_token;
      if (!token) return null;

      this.persistTokens(token, newRefresh);
      return token;
    } catch {
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const { auth, headers, ...restOptions } = options;
    const token = auth ? this.getStoredToken() : null;
    const isFormData =
      typeof FormData !== 'undefined' &&
      restOptions.body instanceof FormData;

    const doFetch = async (maybeToken?: string) => {
      return fetch(url, {
        ...restOptions,
        signal: controller.signal,
        headers: {
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...(maybeToken ? { Authorization: `Bearer ${maybeToken}` } : {}),
          ...headers,
        },
      });
    };

    try {
      let response = await doFetch(token || undefined);

      // Si expira y era una ruta protegida, intenta refrescar una sola vez
      if (response.status === 401 && auth && !endpoint.includes('/auth/refresh')) {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          // reintento con nuevo token
          response = await doFetch(newToken);
        } else {
          this.clearSession();
        }
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        // Si fue abortado, re-lanza el mensaje estándar
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  async get<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  async post<T>(
    endpoint: string,
    data: unknown,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async postForm<T>(
    endpoint: string,
    formData: FormData,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      ...options,
    });
  }

  async put<T>(
    endpoint: string,
    data: unknown,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async putForm<T>(
    endpoint: string,
    formData: FormData,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: formData,
      ...options,
    });
  }

  async patch<T>(
    endpoint: string,
    data: unknown,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async delete<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }
}

export const api = new ApiClient();

