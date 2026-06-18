import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  api,
  TokenManager,
  decodeJwt,
  isTokenExpired,
  registerUnauthorizedHandler,
  unregisterUnauthorizedHandler,
} from '@/services/api';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserLink {
  id: string;
  title: string;
  url: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  gender?: string;
  pronouns?: string;
  showPronounsToFollowers?: boolean;
  links?: UserLink[];
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isOnboarded: boolean;
  onboardingStep: string;
  phone?: string;
  birthday?: string;
  isPrivate?: boolean;
}

/**
 * Maps the backend onboardingStep value to the correct frontend route.
 */
export const ONBOARDING_STEP_ROUTES: Record<string, string> = {
  PERMISSIONS: '/(auth)/permissions',
  PROFILE_PICTURE: '/(auth)/profile-picture',
  ADD_CONTACT: '/(auth)/add-contact',
  FOLLOW: '/(auth)/follow-suggestions',
  COMPLETED: '/(tabs)',
};

export function getOnboardingRoute(step: string): string {
  return ONBOARDING_STEP_ROUTES[step] ?? '/(auth)/permissions';
}

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<User | null>;
  registerComplete: (
    signupToken: string,
    password: string,
    birthday: string,
    name: string,
    username: string,
  ) => Promise<User | null>;
  logout: () => Promise<void>;
  updateProfile: (
    name: string,
    bio: string,
    avatar: string,
    isOnboarded?: boolean,
    onboardingStep?: string,
    username?: string,
    gender?: string,
    pronouns?: string,
    links?: UserLink[],
    showPronounsToFollowers?: boolean,
  ) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  updateBirthday: (birthday: string) => Promise<boolean>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// ─── Mapper — raw API user → local User shape ─────────────────────────────────

function mapApiUser(u: any, fallback?: Partial<User>): User {
  return {
    id: u.id ?? fallback?.id ?? '',
    username: u.username ?? fallback?.username ?? '',
    name: u.displayName ?? u.name ?? fallback?.name ?? u.username ?? '',
    email: u.email ?? fallback?.email ?? '',
    avatar: u.avatarUrl ?? u.avatar ?? fallback?.avatar ?? '',
    bio: u.bio ?? fallback?.bio ?? '',
    gender: u.gender ?? fallback?.gender ?? '',
    pronouns: u.pronouns ?? fallback?.pronouns ?? '',
    showPronounsToFollowers:
      u.showPronounsToFollowers ?? fallback?.showPronounsToFollowers ?? false,
    links: u.links ?? fallback?.links ?? [],
    followersCount: u.followersCount ?? fallback?.followersCount ?? 0,
    followingCount: u.followingCount ?? fallback?.followingCount ?? 0,
    postsCount: u.postsCount ?? fallback?.postsCount ?? 0,
    isOnboarded: u.isOnboarded ?? fallback?.isOnboarded ?? false,
    onboardingStep: u.onboardingStep ?? fallback?.onboardingStep ?? 'PERMISSIONS',
    phone: u.phone ?? fallback?.phone ?? '',
    birthday: u.birthday ?? fallback?.birthday ?? '',
    isPrivate: u.isPrivate ?? fallback?.isPrivate ?? false,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Keep a stable ref to logout so the interceptor callback never becomes stale
  const logoutRef = useRef<() => Promise<void>>(async () => {});

  // ── Session initialisation ─────────────────────────────────────────────────

  useEffect(() => {
    const initSession = async () => {
      try {
        const token = await TokenManager.getToken();

        if (!token) {
          // No stored token → user is logged out
          return;
        }

        if (isTokenExpired(token)) {
          // Token is expired → check if we have a refresh token to attempt auto-recovery
          const refreshToken = await TokenManager.getRefreshToken();
          if (!refreshToken) {
            await TokenManager.clearToken();
            return;
          }
        }

        // Token looks valid — fetch a fresh profile from the server
        try {
          const res = await api.get('/auth/profile');
          const u = res.data?.user ?? res.data;
          if (u?.id) {
            setUser(mapApiUser(u));
            // Register device push token (non-blocking, best-effort)
            registerExpoPushToken();
            return;
          }
        } catch (apiErr: any) {
          // 401 means the token was rejected server-side — already cleared by interceptor
          if (apiErr?.response?.status === 401) return;

          // Network error — fall back to JWT payload so the user isn't unexpectedly logged out
          console.warn(
            '[Auth] Profile fetch failed, falling back to JWT payload:',
            apiErr?.message,
          );
          const payload = decodeJwt(token);
          if (payload?.sub) {
            setUser({
              id: payload.sub,
              username: payload.username ?? '',
              name: payload.username ?? '',
              email: payload.email ?? '',
              avatar: '',
              bio: '',
              followersCount: 0,
              followingCount: 0,
              postsCount: 0,
              isOnboarded: false,
              onboardingStep: 'PERMISSIONS',
            });
          }
        }
      } catch (e) {
        console.error('[Auth] Failed to restore session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  // ── Register the 401 interceptor callback ─────────────────────────────────

  useEffect(() => {
    const handler = () => {
      logoutRef.current();
    };
    registerUnauthorizedHandler(handler);
    return () => unregisterUnauthorizedHandler();
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    setIsLoading(true);
    await TokenManager.clearToken();
    setUser(null);
    setIsLoading(false);
  }, []);

  // Keep the ref in sync
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (identifier: string, password: string): Promise<User | null> => {
      setIsLoading(true);
      try {
        const res = await api.post('/auth/login', {
          usernameOrEmailOrPhone: identifier.trim(),
          password,
        });

        const { accessToken, refreshToken, user: u } = res.data;
        if (!accessToken) return null;

        await TokenManager.saveToken(accessToken, refreshToken);
        const mapped = mapApiUser(u);
        setUser(mapped);
        // Register device push token after login (non-blocking)
        registerExpoPushToken();
        return mapped;
      } catch (err) {
        console.error('[Auth] Login error:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── Complete Registration ──────────────────────────────────────────────────

  const registerComplete = useCallback(
    async (
      signupToken: string,
      password: string,
      birthday: string,
      name: string,
      username: string,
    ): Promise<User | null> => {
      setIsLoading(true);
      try {
        const res = await api.post('/auth/register/complete', {
          signupToken,
          password,
          birthday,
          name,
          username,
        });

        const { accessToken, refreshToken, user: u } = res.data;
        if (!accessToken) return null;

        await TokenManager.saveToken(accessToken, refreshToken);
        const mapped = mapApiUser(u);
        setUser(mapped);
        // Register device push token after registration (non-blocking)
        registerExpoPushToken();
        return mapped;
      } catch (err) {
        console.error('[Auth] Register complete error:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── Refresh Profile ────────────────────────────────────────────────────────

  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      const res = await api.get('/auth/profile');
      const u = res.data?.user ?? res.data;
      if (u?.id) {
        setUser((prev) => mapApiUser(u, prev ?? undefined));
      }
    } catch (err) {
      console.warn('[Auth] refreshProfile failed:', err);
    }
  }, []);

  // ── Update Profile ─────────────────────────────────────────────────────────

  const updateProfile = useCallback(
    async (
      name: string,
      bio: string,
      avatar: string,
      isOnboarded?: boolean,
      onboardingStep?: string,
      username?: string,
      gender?: string,
      pronouns?: string,
      links?: UserLink[],
      showPronounsToFollowers?: boolean,
    ): Promise<boolean> => {
      try {
        const res = await api.patch('/auth/profile', {
          name,
          bio,
          avatarUrl: avatar,
          ...(isOnboarded !== undefined && { isOnboarded }),
          ...(onboardingStep !== undefined && { onboardingStep }),
          ...(username !== undefined && { username }),
          ...(gender !== undefined && { gender }),
          ...(pronouns !== undefined && { pronouns }),
          ...(links !== undefined && { links }),
          ...(showPronounsToFollowers !== undefined && { showPronounsToFollowers }),
        });

        const u = res.data?.user ?? res.data;
        if (u?.id) {
          setUser((prev) => mapApiUser(u, prev ?? undefined));
          return true;
        }
        return false;
      } catch (err) {
        console.error('[Auth] updateProfile error:', err);

        // Optimistic local update so UI doesn't feel broken on network errors
        setUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            name,
            bio,
            avatar,
            ...(username !== undefined && { username }),
            ...(gender !== undefined && { gender }),
            ...(pronouns !== undefined && { pronouns }),
            ...(links !== undefined && { links }),
            ...(showPronounsToFollowers !== undefined && { showPronounsToFollowers }),
            ...(isOnboarded !== undefined && { isOnboarded }),
            ...(onboardingStep !== undefined && { onboardingStep }),
          };
        });
        return false;
      }
    },
    [],
  );

  // ── Update Birthday ────────────────────────────────────────────────────────

  const updateBirthday = useCallback(async (birthday: string): Promise<boolean> => {
    try {
      const res = await api.patch('/auth/profile', { birthday });
      const u = res.data?.user ?? res.data;
      if (u?.id) {
        setUser((prev) => mapApiUser(u, prev ?? undefined));
        return true;
      }
      return false;
    } catch (err) {
      console.error('[Auth] updateBirthday error:', err);
      return false;
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        registerComplete,
        logout,
        updateProfile,
        refreshProfile,
        updateBirthday,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ─── Push Token Registration ─────────────────────────────────────────────────
// Called once after login / session restore on a physical device.
// Silently fails on emulators / web where push tokens are unavailable.

export async function registerExpoPushToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PushToken] Permission not granted — skipping token registration.');
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const pushToken = tokenData.data;

    if (!pushToken) return;

    await api.post('/auth/push-token', { pushToken });
    console.log('[PushToken] Registered:', pushToken);
  } catch (err) {
    // Non-fatal — push is best-effort
    console.warn('[PushToken] Registration failed (non-fatal):', err);
  }
}
