import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim() || 'https://instagram-clone-backend-web.vercel.app/api';
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  
  if (__DEV__) {
    console.log(`[API] Initializing with base URL: ${cleanUrl}`);
  }
  return cleanUrl;
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const TokenManager = {
  async saveToken(token: string) {
    try {
      await SecureStore.setItemAsync('accessToken', token);
    } catch (err) {
      console.error('Failed to save access token:', err);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('accessToken');
    } catch (err) {
      console.error('Failed to get access token:', err);
      return null;
    }
  },

  async clearToken() {
    try {
      await SecureStore.deleteItemAsync('accessToken');
    } catch (err) {
      console.error('Failed to clear access token:', err);
    }
  },
};

// Request Interceptor to attach the token
api.interceptors.request.use(
  async (config) => {
    const token = await TokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
