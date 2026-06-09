import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, TokenManager } from '@/services/api';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
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
  updateProfile: (name: string, bio: string, avatar: string) => void;
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
            setUser({
              id: payload.sub,
              username: payload.username,
              name: payload.username.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              email: payload.email,
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
              bio: 'Welcome back to Instagram Clone!',
              followersCount: 124,
              followingCount: 256,
              postsCount: 0,
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
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          bio: 'Welcome to Instagram Clone!',
          followersCount: 154,
          followingCount: 302,
          postsCount: 0,
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
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      bio: 'New user joined!',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
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
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          bio: 'Welcome to Instagram Clone!',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
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

  const logout = async () => {
    setIsLoading(true);
    await TokenManager.clearToken();
    setUser(null);
    setIsLoading(false);
  };

  const updateProfile = (name: string, bio: string, avatar: string) => {
    if (user) {
      setUser({
        ...user,
        name,
        bio,
        avatar: avatar || user.avatar,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, registerComplete, logout, updateProfile }}>
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
