import React, { memo, useMemo, useCallback, useRef, DependencyList } from 'react';

/**
 * Performance utilities for React Native optimization.
 */

export const memoWithCustomCompare = <P extends object>(
  component: React.ComponentType<P>,
  areEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
) => memo(component, areEqual);

export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
) => useCallback(callback, deps);

export const useShallowMemo = <T extends unknown>(
  factory: () => T,
  deps: DependencyList
) => useMemo(factory, deps);

export const useDebounce = <T extends unknown>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export const useThrottle = <T extends unknown>(value: T, interval: number): T => {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRef = useRef(Date.now());

  React.useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastRef.current;

    if (elapsed >= interval) {
      lastRef.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastRef.current = Date.now();
        setThrottledValue(value);
      }, interval - elapsed);
      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
};

export const lazyLoad = <P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  placeholder: () => React.ReactNode = () => null
) => {
  const LazyComponent = React.lazy(importFn);
  return (props: P) => (
    <React.Suspense fallback={placeholder()}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

export const batchUpdates = (updates: (() => void)[]) => {
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      updates.forEach(fn => fn());
    });
  } else {
    updates.forEach(fn => fn());
  }
};

export const useExpensiveCalculation = <T extends unknown>(
  calculation: () => T,
  deps: DependencyList
) => useMemo(calculation, deps);

export const usePrevious = <T extends unknown>(value: T): T | undefined => {
  const ref = useRef<T | undefined>(undefined);
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasIntersected, setHasIntersected] = React.useState(false);
  const ref = useRef<any>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, options);

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options, hasIntersected]);

  return { ref, isIntersecting, hasIntersected };
};