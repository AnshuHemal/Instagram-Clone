import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { NotificationBanner, BannerNotification } from '@/components/NotificationBanner';

interface NotificationBannerContextType {
  showBanner: (notification: BannerNotification) => void;
  dismissBanner: () => void;
}

const NotificationBannerContext = createContext<NotificationBannerContextType | undefined>(undefined);

export const NotificationBannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentNotification, setCurrentNotification] = useState<BannerNotification | null>(null);
  const queueRef = useRef<BannerNotification[]>([]);
  const isShowingRef = useRef(false);

  const showNext = useCallback(() => {
    if (queueRef.current.length > 0 && !isShowingRef.current) {
      isShowingRef.current = true;
      const next = queueRef.current.shift()!;
      setCurrentNotification(next);
    }
  }, []);

  const showBanner = useCallback((notification: BannerNotification) => {
    queueRef.current.push(notification);
    if (!isShowingRef.current) {
      showNext();
    }
  }, [showNext]);

  const dismissBanner = useCallback(() => {
    isShowingRef.current = false;
    setCurrentNotification(null);
    // Show next in queue after a brief delay
    setTimeout(() => showNext(), 500);
  }, [showNext]);

  return (
    <NotificationBannerContext.Provider value={{ showBanner, dismissBanner }}>
      {children}
      <NotificationBanner
        notification={currentNotification}
        onDismiss={dismissBanner}
      />
    </NotificationBannerContext.Provider>
  );
};

export const useNotificationBanner = (): NotificationBannerContextType => {
  const context = useContext(NotificationBannerContext);
  if (!context) {
    throw new Error('useNotificationBanner must be used within a NotificationBannerProvider');
  }
  return context;
};