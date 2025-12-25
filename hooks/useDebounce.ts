// hooks/useDebounce.ts
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Debounce a value
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a callback function
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  return debouncedCallback;
}

/**
 * Debounce with immediate option (leading edge)
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds
 * @param immediate - Execute on leading edge
 * @returns Debounced function with cancel and flush
 */
export function useDebouncedCallbackAdvanced<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
  options: { immediate?: boolean; maxWait?: number } = {}
): {
  callback: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
  pending: () => boolean;
} {
  const { immediate = false, maxWait } = options;
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  const lastCallTimeRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);
  const pendingRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
    }
    lastArgsRef.current = null;
    lastCallTimeRef.current = null;
    pendingRef.current = false;
  }, []);

  const flush = useCallback(() => {
    if (lastArgsRef.current && pendingRef.current) {
      callbackRef.current(...lastArgsRef.current);
      cancel();
    }
  }, [cancel]);

  const pending = useCallback(() => pendingRef.current, []);

  useEffect(() => {
    return cancel;
  }, [cancel]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const isFirstCall = !lastCallTimeRef.current;
      
      lastArgsRef.current = args;
      lastCallTimeRef.current = now;
      pendingRef.current = true;

      // Execute immediately on first call if immediate option is set
      if (immediate && isFirstCall) {
        callbackRef.current(...args);
        pendingRef.current = false;
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set up trailing edge timeout
      timeoutRef.current = setTimeout(() => {
        if (!immediate || !isFirstCall) {
          if (lastArgsRef.current) {
            callbackRef.current(...lastArgsRef.current);
          }
        }
        cancel();
      }, delay);

      // Set up maxWait timeout if specified
      if (maxWait && !maxWaitTimeoutRef.current) {
        maxWaitTimeoutRef.current = setTimeout(() => {
          flush();
        }, maxWait);
      }
    },
    [delay, immediate, maxWait, cancel, flush]
  );

  return { callback: debouncedCallback, cancel, flush, pending };
}

/**
 * Throttle a callback function
 * @param callback - The function to throttle
 * @param delay - Minimum time between calls
 * @returns Throttled function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const lastCallRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      }
    },
    [delay]
  );

  return throttledCallback;
}

/**
 * Throttle a value
 * @param value - The value to throttle
 * @param delay - Minimum time between updates
 * @returns Throttled value
 */
export function useThrottledValue<T>(value: T, delay: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdateRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (timeSinceLastUpdate >= delay) {
      setThrottledValue(value);
      lastUpdateRef.current = now;
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setThrottledValue(value);
        lastUpdateRef.current = Date.now();
      }, delay - timeSinceLastUpdate);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return throttledValue;
}

/**
 * Debounced state - combines useState with debouncing
 * @param initialValue - Initial state value
 * @param delay - Debounce delay
 * @returns [debouncedValue, setValue, immediateValue]
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 500
): [T, (value: T) => void, T] {
  const [immediateValue, setImmediateValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(immediateValue, delay);

  return [debouncedValue, setImmediateValue, immediateValue];
}

/**
 * Async debounced callback with loading state
 * @param callback - Async function to debounce
 * @param delay - Debounce delay
 * @returns Object with debounced function and loading state
 */
export function useAsyncDebounce<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  delay: number = 500
): {
  callback: (...args: Parameters<T>) => void;
  loading: boolean;
  error: Error | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setError(null);

      timeoutRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          await callbackRef.current(...args);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
          setLoading(false);
        }
      }, delay);
    },
    [delay]
  );

  return { callback: debouncedCallback, loading, error };
}

export default useDebounce;