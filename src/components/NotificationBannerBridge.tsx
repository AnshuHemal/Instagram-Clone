import { useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useNotificationBanner } from '@/contexts/NotificationBannerContext';

/**
 * NotificationBannerBridge — sits inside the provider tree and listens
 * for real-time notification events from the socket, then triggers
 * the in-app notification banner.
 *
 * This is a separate component to avoid circular dependencies between
 * SocketContext and NotificationBannerContext.
 */
export const NotificationBannerBridge: React.FC = () => {
  const { socket } = useSocket();
  const { showBanner } = useNotificationBanner();
  const shownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;

    const handleNotificationReceived = (notification: any) => {
      // Deduplicate: avoid showing the same notification twice
      if (shownIdsRef.current.has(notification.id)) return;
      shownIdsRef.current.add(notification.id);

      // Limit dedup set size to avoid memory leak
      if (shownIdsRef.current.size > 100) {
        shownIdsRef.current.clear();
      }

      showBanner({
        id: notification.id,
        type: notification.type,
        actor: {
          id: notification.actor?.id || notification.actorId,
          username: notification.actor?.username || 'Someone',
          displayName: notification.actor?.displayName || '',
          avatarUrl: notification.actor?.avatarUrl || null,
        },
        message: notification.message || '',
        postId: notification.postId,
        reelId: notification.reelId,
      });
    };

    socket.on('notificationReceived', handleNotificationReceived);

    return () => {
      socket.off('notificationReceived', handleNotificationReceived);
    };
  }, [socket, showBanner]);

  return null; // This component renders nothing
};