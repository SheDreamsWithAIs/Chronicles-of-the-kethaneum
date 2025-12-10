/**
 * Hook for managing page loading state
 * Tracks multiple loading conditions and resolves when all are complete
 */

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';

interface UsePageLoaderOptions {
  minDisplayTime?: number; // Minimum time to show loader (prevents flash)
  dependencies?: any[]; // Dependencies that should reset loading state
}

interface LoadingCondition {
  id: string;
  isLoading: boolean;
}

export function usePageLoader(options: UsePageLoaderOptions = {}) {
  const { minDisplayTime = 300, dependencies = [] } = options;
  
  const [conditions, setConditions] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const startTimeRef = useRef<number>(Date.now());
  const minTimeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);

  // Ensure loader shows immediately on mount
  useEffect(() => {
    isMountedRef.current = true;
    startTimeRef.current = Date.now();
    setIsLoading(true);
    
    // Clear any existing timeout
    if (minTimeTimeoutRef.current) {
      clearTimeout(minTimeTimeoutRef.current);
      minTimeTimeoutRef.current = null;
    }
  }, []);

  // Reset start time when dependencies change
  useEffect(() => {
    if (!isMountedRef.current) return;
    startTimeRef.current = Date.now();
    setIsLoading(true);
    
    // Clear any existing timeout
    if (minTimeTimeoutRef.current) {
      clearTimeout(minTimeTimeoutRef.current);
      minTimeTimeoutRef.current = null;
    }
  }, dependencies);

  // Check if all conditions are met
  useEffect(() => {
    const allLoaded = Array.from(conditions.values()).every(loaded => !loaded);
    
    // Debug logging (can be removed later)
    if (process.env.NODE_ENV === 'development') {
      const conditionEntries = Array.from(conditions.entries()).map(([id, loading]) => `${id}: ${loading ? 'loading' : 'ready'}`);
      console.log(`[usePageLoader] size=${conditions.size}, allLoaded=${allLoaded}, isLoading=${isLoading}, conditions:`, conditionEntries.join(', '));
    }
    
    if (allLoaded && conditions.size > 0) {
      const elapsed = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);
      
      if (remainingTime > 0) {
        // Wait for minimum display time
        minTimeTimeoutRef.current = setTimeout(() => {
          setIsLoading(false);
          minTimeTimeoutRef.current = null;
        }, remainingTime);
      } else {
        // Minimum time already elapsed
        setIsLoading(false);
      }
    } else if (conditions.size === 0) {
      // No conditions set yet, keep loading
      setIsLoading(true);
    }
  }, [conditions, minDisplayTime]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (minTimeTimeoutRef.current) {
        clearTimeout(minTimeTimeoutRef.current);
      }
    };
  }, []);

  const setLoading = useCallback((id: string, isLoading: boolean) => {
    setConditions(prev => {
      const next = new Map(prev);
      next.set(id, isLoading);
      return next;
    });
  }, []);

  const addCondition = useCallback((id: string, isLoading: boolean) => {
    setLoading(id, isLoading);
  }, [setLoading]);

  const removeCondition = useCallback((id: string) => {
    setConditions(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return {
    isLoading,
    setLoading,
    addCondition,
    removeCondition,
  };
}
