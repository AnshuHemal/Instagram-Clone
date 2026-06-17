import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';

interface NetworkContextType {
  isOnline: boolean;
  isConnected: boolean | null;
  pendingActions: Array<{ id: string; action: () => Promise<void>; timestamp: number }>;
  queueAction: (action: () => Promise<void>) => string;
  removeAction: (id: string) => void;
  processQueue: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [pendingActions, setPendingActions] = useState<Array<{ id: string; action: () => Promise<void>; timestamp: number }>>([]);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  // Listen to network state changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      setIsOnline(connected);

      // Process queued actions when coming back online
      if (connected && pendingActions.length > 0) {
        processQueue();
      }
    });

    return () => unsubscribe();
  }, [pendingActions]);

  // Listen to app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);

      // When app comes to foreground, check network and process queue
      if (nextAppState === 'active' && isOnline && pendingActions.length > 0) {
        processQueue();
      }
    });

    return () => subscription.remove();
  }, [isOnline, pendingActions]);

  const queueAction = useCallback((action: () => Promise<void>): string => {
    const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setPendingActions((prev) => [...prev, { id, action, timestamp: Date.now() }]);
    return id;
  }, []);

  const removeAction = useCallback((id: string) => {
    setPendingActions((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const processQueue = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0) return;

    const actions = [...pendingActions];
    setPendingActions([]);

    for (const item of actions) {
      try {
        await item.action();
      } catch (error) {
        console.error(`[NetworkContext] Queued action failed:`, error);
        // Re-queue failed actions (with backoff)
        setPendingActions((prev) => [...prev, { ...item, timestamp: Date.now() }]);
        break; // Stop processing on first failure
      }
    }
  }, [isOnline, pendingActions]);

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        isConnected,
        pendingActions,
        queueAction,
        removeAction,
        processQueue,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};