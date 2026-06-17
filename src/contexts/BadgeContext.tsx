/**
 * BadgeContext
 *
 * Provides live unread counts for:
 *   - Notifications  (badge on the tab bar notification dot)
 *   - Chat / DMs     (badge on the messenger icon)
 *
 * Strategy:
 *   - On mount (after login) fetch both counts once from the API.
 *   - Listen on the Socket.IO connection for real-time increments.
 *   - Expose helpers to clear counts when the user visits the relevant screen.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { api } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BadgeContextProps {
  /** Total unread notification count (capped at 99 for display) */
  notificationCount: number;
  /** Total unread chat messages across all conversations */
  chatCount: number;
  /** Call this when the user opens the Notifications screen */
  clearNotifications: () => void;
  /** Call this when the user opens the Chat inbox */
  clearChat: () => void;
  /** Manually refresh both counts from the API */
  refreshCounts: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const BadgeContext = createContext<BadgeContextProps | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const BadgeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [notificationCount, setNotificationCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);

  // Prevent concurrent fetches
  const fetchingRef = useRef(false);

  // ── Fetch both counts from API ──────────────────────────────────────────────

  const refreshCounts = useCallback(async () => {
    if (!user || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const [notifRes, chatRes] = await Promise.allSettled([
        api.get('/notifications/unread-count'),
        api.get('/chat/unread-count'),
      ]);

      if (notifRes.status === 'fulfilled') {
        const count = notifRes.value?.data?.count ?? notifRes.value?.data?.data?.count ?? 0;
        setNotificationCount(Math.min(Number(count), 99));
      }

      if (chatRes.status === 'fulfilled') {
        const count = chatRes.value?.data?.count ?? chatRes.value?.data?.data?.count ?? 0;
        setChatCount(Math.min(Number(count), 99));
      }
    } catch (err) {
      // Fail silently — badges are non-critical
    } finally {
      fetchingRef.current = false;
    }
  }, [user]);

  // ── Fetch on login ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (user) {
      refreshCounts();
    } else {
      setNotificationCount(0);
      setChatCount(0);
    }
  }, [user]);

  // ── Socket listeners ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!socket) return;

    const handleNotification = () => {
      setNotificationCount((c) => Math.min(c + 1, 99));
    };

    const handleInboxUpdated = () => {
      setChatCount((c) => Math.min(c + 1, 99));
    };

    socket.on('notificationReceived', handleNotification);
    socket.on('inboxUpdated', handleInboxUpdated);

    return () => {
      socket.off('notificationReceived', handleNotification);
      socket.off('inboxUpdated', handleInboxUpdated);
    };
  }, [socket]);

  // ── Clear helpers ───────────────────────────────────────────────────────────

  const clearNotifications = useCallback(() => {
    setNotificationCount(0);
  }, []);

  const clearChat = useCallback(() => {
    setChatCount(0);
  }, []);

  return (
    <BadgeContext.Provider
      value={{
        notificationCount,
        chatCount,
        clearNotifications,
        clearChat,
        refreshCounts,
      }}
    >
      {children}
    </BadgeContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useBadge = (): BadgeContextProps => {
  const ctx = useContext(BadgeContext);
  if (!ctx) throw new Error('useBadge must be used within BadgeProvider');
  return ctx;
};
