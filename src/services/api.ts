import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ─── Base URL ─────────────────────────────────────────────────────────────────

const getBaseUrl = () => {
  const url =
    process.env.EXPO_PUBLIC_API_URL?.trim() ||
    'https://instagram-clone-backend-web.vercel.app/api';
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  if (__DEV__) {
    console.log(`[API] Base URL: ${cleanUrl}`);
  }
  return cleanUrl;
};

// ─── Axios Instance ───────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Token Manager ────────────────────────────────────────────────────────────

export const TokenManager = {
  async saveToken(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('accessToken', accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync('refreshToken', refreshToken);
      }
    } catch (err) {
      console.error('[TokenManager] Failed to save tokens:', err);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('accessToken');
    } catch (err) {
      console.error('[TokenManager] Failed to get accessToken:', err);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('refreshToken');
    } catch (err) {
      console.error('[TokenManager] Failed to get refreshToken:', err);
      return null;
    }
  },

  async clearToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    } catch (err) {
      console.error('[TokenManager] Failed to clear tokens:', err);
    }
  },
};

// ─── JWT Utilities ────────────────────────────────────────────────────────────

export function decodeJwt(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Returns true if the JWT is expired or will expire within the next 60 seconds.
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return true;
  // Add a 60-second buffer — treat "expiring soon" as expired
  return payload.exp * 1000 < Date.now() + 60_000;
}

// ─── 401 Logout Callback ──────────────────────────────────────────────────────
// AuthContext registers this so the interceptor can trigger a logout without
// creating a circular import.

type LogoutCallback = () => void;
let _onUnauthorized: LogoutCallback | null = null;

export function registerUnauthorizedHandler(cb: LogoutCallback): void {
  _onUnauthorized = cb;
}

export function unregisterUnauthorizedHandler(): void {
  _onUnauthorized = null;
}

// ─── Token Refresh Queuing State ──────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const performTokenRefresh = async (): Promise<string | null> => {
  try {
    const refreshToken = await TokenManager.getRefreshToken();
    if (!refreshToken) return null;

    const url = getBaseUrl();
    const res = await axios.post(`${url}/auth/refresh`, { refreshToken });
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data;

    if (newAccessToken) {
      await TokenManager.saveToken(newAccessToken, newRefreshToken);
      return newAccessToken;
    }
    return null;
  } catch (err) {
    console.error('[API] Token refresh request failed:', err);
    return null;
  }
};

// ─── Request Interceptor — Attach Bearer Token & Preemptive Refresh ───────────

api.interceptors.request.use(
  async (config) => {
    let token = await TokenManager.getToken();

    if (token && isTokenExpired(token)) {
      const refreshToken = await TokenManager.getRefreshToken();
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          const newToken = await performTokenRefresh();
          isRefreshing = false;
          if (newToken) {
            token = newToken;
            processQueue(null, newToken);
          } else {
            const err = new Error('Refresh failed');
            processQueue(err, null);
            await TokenManager.clearToken();
            if (_onUnauthorized) {
              _onUnauthorized();
            }
          }
        } else {
          try {
            token = await new Promise<string>((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            });
          } catch (e) {
            token = null;
          }
        }
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor — Handle 401 / 429 / 5xx & Auto Retry ───────────────

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status: number | undefined = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await TokenManager.getRefreshToken();
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          const newToken = await performTokenRefresh();
          isRefreshing = false;

          if (newToken) {
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          } else {
            processQueue(error, null);
            await TokenManager.clearToken();
            if (_onUnauthorized) {
              _onUnauthorized();
            }
            return Promise.reject(error);
          }
        } else {
          try {
            const newToken = await new Promise<string>((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            });
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          } catch (e) {
            return Promise.reject(error);
          }
        }
      } else {
        await TokenManager.clearToken();
        if (_onUnauthorized) {
          _onUnauthorized();
        }
      }
    }

    return Promise.reject(error);
  },
);
