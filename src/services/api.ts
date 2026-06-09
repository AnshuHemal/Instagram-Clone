import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  // Allow overriding with environment variables (.env in Expo loaded via EXPO_PUBLIC_ prefix)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }
  // Android emulator points to host loopback via 10.0.2.2
  if (__DEV__) {
    // Automatically detect host IP (for physical devices running via Expo Go on the same Wi-Fi)
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      // If it is a tunnel, it will contain expo-tunnel or exp.direct. Tunnel hostports cannot be swapped to 3000.
      if (!host.includes('expo-tunnel') && !host.includes('exp.direct')) {
        return `http://${host}:3000/api`;
      }
    }

    return Platform.OS === 'android'
      ? 'http://10.0.2.2:3000/api'
      : 'http://localhost:3000/api'; // iOS simulator uses localhost
  }
  return 'https://production-api.instaclone.com/api';
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
