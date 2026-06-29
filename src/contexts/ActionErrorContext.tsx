/**
 * ActionErrorContext — Provides a global mechanism for displaying
 * transient per-action failure banners (e.g., "Like failed").
 *
 * Distinct from OfflineBanner (persistent network state indicator).
 * This is for brief, auto-dismissing feedback after a failed optimistic action.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActionError {
  id: string;
  message: string;
  icon?: string; // emoji or icon name
  onRetry?: () => void;
}

interface ActionErrorContextType {
  /** Currently visible error (only one at a time). */
  currentError: ActionError | null;
  /**
   * Show an action error banner. Auto-dismisses after `durationMs` (default 3000ms).
   * Returns the error ID so the caller can dismiss it early if needed.
   */
  showActionError: (
    message: string,
    options?: { icon?: string; onRetry?: () => void; durationMs?: number }
  ) => string;
  /** Dismiss the current error immediately. */
  dismissError: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ActionErrorContext = createContext<ActionErrorContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ActionErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentError, setCurrentError] = useState<ActionError | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissError = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setCurrentError(null);
  }, []);

  const showActionError = useCallback(
    (
      message: string,
      options?: { icon?: string; onRetry?: () => void; durationMs?: number }
    ): string => {
      // Clear any in-flight timer from previous error
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }

      const id = `ae_${Date.now()}`;
      const error: ActionError = {
        id,
        message,
        icon: options?.icon,
        onRetry: options?.onRetry,
      };

      setCurrentError(error);

      // Auto-dismiss after durationMs
      const duration = options?.durationMs ?? 3000;
      dismissTimerRef.current = setTimeout(() => {
        setCurrentError((prev) => (prev?.id === id ? null : prev));
        dismissTimerRef.current = null;
      }, duration);

      return id;
    },
    []
  );

  return (
    <ActionErrorContext.Provider value={{ currentError, showActionError, dismissError }}>
      {children}
    </ActionErrorContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useActionError = (): ActionErrorContextType => {
  const ctx = useContext(ActionErrorContext);
  if (!ctx) throw new Error('useActionError must be used within ActionErrorProvider');
  return ctx;
};
