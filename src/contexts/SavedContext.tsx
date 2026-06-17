/**
 * SavedContext — manages post save/bookmark state globally.
 * Provides optimistic toggle with API sync and initial hydration.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from './AuthContext';

interface SavedContextType {
  savedPostIds: Set<string>;
  isSaved: (postId: string) => boolean;
  toggleSave: (postId: string) => Promise<void>;
  isLoading: boolean;
}

const SavedContext = createContext<SavedContextType | undefined>(undefined);

export const SavedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Hydrate saved post IDs on login
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    (async () => {
      try {
        const res = await api.get('/posts/saved', { params: { limit: 100 } });
        const ids: string[] = (res.data?.data ?? []).map((p: any) => p.id);
        setSavedPostIds(new Set(ids));
      } catch {
        // Graceful failure — start with empty set
      }
    })();
  }, [isAuthenticated, user]);

  const isSaved = useCallback((postId: string) => savedPostIds.has(postId), [savedPostIds]);

  const toggleSave = useCallback(async (postId: string) => {
    // Optimistic update
    setSavedPostIds(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });

    try {
      await api.post(`/posts/${postId}/save`);
    } catch {
      // Rollback on failure
      setSavedPostIds(prev => {
        const next = new Set(prev);
        if (next.has(postId)) {
          next.delete(postId);
        } else {
          next.add(postId);
        }
        return next;
      });
    }
  }, []);

  return (
    <SavedContext.Provider value={{ savedPostIds, isSaved, toggleSave, isLoading }}>
      {children}
    </SavedContext.Provider>
  );
};

export const useSaved = () => {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved must be used within SavedProvider');
  return ctx;
};
