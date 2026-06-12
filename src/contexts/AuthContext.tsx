import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, TokenManager } from '@/services/api';

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
}

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<boolean>;
  signup: (username: string, name: string, email: string) => Promise<boolean>;
  registerComplete: (
    signupToken: string,
    password: string,
    birthday: string,
    name: string,
    username: string
  ) => Promise<boolean>;
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
    showPronounsToFollowers?: boolean
  ) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  updateBirthday: (birthday: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Polyfill decode using standard escape/encodeURIComponent mapping
    const jsonPayload = decodeURIComponent(
      // In JS, atob is global (in browser and modern RN)
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as loading to prevent visual flicker before check

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await TokenManager.getToken();
        if (token) {
          const payload = decodeJwt(token);
          if (payload && payload.username) {
            try {
              const res = await api.get('/auth/profile');
              if (res.data && res.data.user) {
                const u = res.data.user;
                setUser({
                  id: u.id,
                  username: u.username,
                  name: u.displayName || u.username,
                  email: u.email,
                  avatar: u.avatarUrl || '',
                  bio: u.bio || 'Welcome back to Instagram Clone!',
                  gender: u.gender || '',
                  pronouns: u.pronouns || '',
                  showPronounsToFollowers: u.showPronounsToFollowers || false,
                  links: u.links || [],
                  followersCount: u.followersCount ?? 0,
                  followingCount: u.followingCount ?? 0,
                  postsCount: u.postsCount ?? 0,
                  isOnboarded: u.isOnboarded,
                  onboardingStep: u.onboardingStep,
                  phone: u.phone || '',
                  birthday: u.birthday || '',
                });
                return;
              }
            } catch (apiErr) {
              console.warn('Failed to fetch fresh user profile from API, falling back to local JWT payload:', apiErr);
            }

            setUser({
              id: payload.sub,
              username: payload.username,
              name: payload.username.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              email: payload.email,
              avatar: '',
              bio: 'Welcome back to Instagram Clone!',
              followersCount: 0,
              followingCount: 0,
              postsCount: 0,
              isOnboarded: false,
              onboardingStep: 'PERMISSIONS',
            });
          }
        }
      } catch (e) {
        console.error('Failed to restore auth session:', e);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (usernameOrEmailOrPhone: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', {
        usernameOrEmailOrPhone,
        password: password || '123456',
      });

      if (res.data && res.data.accessToken) {
        await TokenManager.saveToken(res.data.accessToken);
        
        const userPayload = res.data.user;
        setUser({
          id: userPayload.id,
          username: userPayload.username,
          name: userPayload.displayName || userPayload.username,
          email: userPayload.email,
          avatar: userPayload.avatarUrl || '',
          bio: userPayload.bio || 'Welcome to Instagram Clone!',
          gender: userPayload.gender || '',
          pronouns: userPayload.pronouns || '',
          showPronounsToFollowers: userPayload.showPronounsToFollowers || false,
          links: userPayload.links || [],
          followersCount: userPayload.followersCount ?? 0,
          followingCount: userPayload.followingCount ?? 0,
          postsCount: userPayload.postsCount ?? 0,
          isOnboarded: userPayload.isOnboarded,
          onboardingStep: userPayload.onboardingStep,
          phone: userPayload.phone || '',
          birthday: userPayload.birthday || '',
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, name: string, email: string): Promise<boolean> => {
    // Keep this signature for backward compatibility, but in new flows we use registerComplete
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setUser({
      id: 'mock_user_' + Date.now(),
      username: username.toLowerCase().trim(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      avatar: '',
      bio: 'New user joined!',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isOnboarded: false,
      onboardingStep: 'PERMISSIONS',
    });
    setIsLoading(false);
    return true;
  };

  const registerComplete = async (
    signupToken: string,
    password: string,
    birthday: string,
    name: string,
    username: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register/complete', {
        signupToken,
        password,
        birthday,
        name,
        username,
      });

      if (res.data && res.data.accessToken) {
        await TokenManager.saveToken(res.data.accessToken);

        const userPayload = res.data.user;
        setUser({
          id: userPayload.id,
          username: userPayload.username,
          name: userPayload.displayName || userPayload.username,
          email: userPayload.email,
          avatar: userPayload.avatarUrl || '',
          bio: userPayload.bio || 'Welcome to Instagram Clone!',
          showPronounsToFollowers: userPayload.showPronounsToFollowers || false,
          links: userPayload.links || [],
          followersCount: userPayload.followersCount ?? 0,
          followingCount: userPayload.followingCount ?? 0,
          postsCount: userPayload.postsCount ?? 0,
          isOnboarded: userPayload.isOnboarded,
          onboardingStep: userPayload.onboardingStep,
          phone: userPayload.phone || '',
          birthday: userPayload.birthday || '',
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Registration completion error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      const res = await api.get('/auth/profile');
      if (res.data && res.data.user) {
        const u = res.data.user;
        setUser((prev) => prev ? {
          ...prev,
          name: u.displayName || prev.name,
          username: u.username || prev.username,
          email: u.email || prev.email,
          avatar: u.avatarUrl !== undefined ? (u.avatarUrl || '') : prev.avatar,
          bio: u.bio || prev.bio,
          gender: u.gender !== undefined ? u.gender : prev.gender,
          pronouns: u.pronouns !== undefined ? u.pronouns : prev.pronouns,
          showPronounsToFollowers: u.showPronounsToFollowers !== undefined ? u.showPronounsToFollowers : prev.showPronounsToFollowers,
          links: u.links !== undefined ? u.links : prev.links,
          isOnboarded: u.isOnboarded ?? prev.isOnboarded,
          onboardingStep: u.onboardingStep || prev.onboardingStep,
          followersCount: u.followersCount ?? prev.followersCount,
          followingCount: u.followingCount ?? prev.followingCount,
          postsCount: u.postsCount ?? prev.postsCount,
          phone: u.phone !== undefined ? u.phone : prev.phone,
          birthday: u.birthday !== undefined ? u.birthday : prev.birthday,
        } : prev);
      }
    } catch (err) {
      console.warn('[refreshProfile] Failed to refresh user profile:', err);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await TokenManager.clearToken();
    setUser(null);
    setIsLoading(false);
  };

  const updateProfile = async (
    name: string,
    bio: string,
    avatar: string,
    isOnboarded?: boolean,
    onboardingStep?: string,
    username?: string,
    gender?: string,
    pronouns?: string,
    links?: UserLink[],
    showPronounsToFollowers?: boolean
  ): Promise<boolean> => {
    try {
      const res = await api.patch('/auth/profile', {
        name,
        bio,
        avatarUrl: avatar,
        isOnboarded,
        onboardingStep,
        username,
        gender,
        pronouns,
        links,
        showPronounsToFollowers,
      });
      if (res.data && res.data.user) {
        const u = res.data.user;
        setUser((prev) => prev ? {
          ...prev,
          name: u.displayName || prev.name,
          username: u.username || prev.username,
          bio: u.bio || prev.bio,
          avatar: u.avatarUrl !== undefined ? (u.avatarUrl || '') : prev.avatar,
          gender: u.gender || '',
          pronouns: u.pronouns || '',
          showPronounsToFollowers: u.showPronounsToFollowers || false,
          links: u.links || [],
          isOnboarded: u.isOnboarded,
          onboardingStep: u.onboardingStep,
          followersCount: u.followersCount ?? prev.followersCount,
          followingCount: u.followingCount ?? prev.followingCount,
          postsCount: u.postsCount ?? prev.postsCount,
          phone: u.phone || '',
          birthday: u.birthday || '',
        } : null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update profile:', err);
      // Fallback local update if API fails (offline/mock)
      if (user) {
        setUser({
          ...user,
          name,
          bio,
          avatar: avatar !== undefined ? avatar : (user ? user.avatar : ''),
          ...(username !== undefined && { username }),
          ...(gender !== undefined && { gender }),
          ...(pronouns !== undefined && { pronouns }),
          ...(links !== undefined && { links }),
          ...(showPronounsToFollowers !== undefined && { showPronounsToFollowers }),
          ...(isOnboarded !== undefined && { isOnboarded }),
          ...(onboardingStep !== undefined && { onboardingStep }),
        });
      }
      return false;
    }
  };

  const updateBirthday = async (birthday: string): Promise<boolean> => {
    try {
      const res = await api.patch('/auth/profile', { birthday });
      if (res.data && res.data.user) {
        const u = res.data.user;
        setUser((prev) => prev ? {
          ...prev,
          birthday: u.birthday || birthday,
        } : prev);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update birthday:', err);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, registerComplete, logout, updateProfile, refreshProfile, updateBirthday }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
