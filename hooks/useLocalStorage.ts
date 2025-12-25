// hooks/useLocalStorage.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type SetValue<T> = T | ((prevValue: T) => T);

interface UseLocalStorageOptions<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  syncTabs?: boolean;
  onError?: (error: Error) => void;
}

/**
 * Hook to persist state in localStorage with SSR support
 * @param key - localStorage key
 * @param initialValue - Initial value if no stored value exists
 * @param options - Configuration options
 * @returns [storedValue, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): [T, (value: SetValue<T>) => void, () => void] {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    syncTabs = true,
    onError = console.error,
  } = options;

  // Use ref to track if component is mounted
  const isMounted = useRef(false);

  // Read from localStorage
  const readValue = useCallback((): T => {
    // SSR check
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? deserializer(item) : initialValue;
    } catch (error) {
      onError(error as Error);
      return initialValue;
    }
  }, [key, initialValue, deserializer, onError]);

  // State to store the value
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Initialize value from localStorage on mount
  useEffect(() => {
    isMounted.current = true;
    setStoredValue(readValue());
    
    return () => {
      isMounted.current = false;
    };
  }, [readValue]);

  // Set value to localStorage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      // SSR check
      if (typeof window === 'undefined') {
        console.warn(
          `Tried to set localStorage key "${key}" during server-side rendering.`
        );
        return;
      }

      try {
        // Allow value to be a function for prev state pattern
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Save to local storage
        window.localStorage.setItem(key, serializer(valueToStore));

        // Save to state
        setStoredValue(valueToStore);

        // Dispatch custom event for cross-tab sync
        window.dispatchEvent(
          new StorageEvent('storage', {
            key,
            newValue: serializer(valueToStore),
          })
        );
      } catch (error) {
        onError(error as Error);
      }
    },
    [key, storedValue, serializer, onError]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);

      window.dispatchEvent(
        new StorageEvent('storage', {
          key,
          newValue: null,
        })
      );
    } catch (error) {
      onError(error as Error);
    }
  }, [key, initialValue, onError]);

  // Listen for changes in other tabs
  useEffect(() => {
    if (!syncTabs || typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null && isMounted.current) {
        try {
          setStoredValue(deserializer(event.newValue));
        } catch (error) {
          onError(error as Error);
        }
      } else if (event.key === key && event.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue, syncTabs, deserializer, onError]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for session storage with same API as useLocalStorage
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options: Omit<UseLocalStorageOptions<T>, 'syncTabs'> = {}
): [T, (value: SetValue<T>) => void, () => void] {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    onError = console.error,
  } = options;

  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      return item ? deserializer(item) : initialValue;
    } catch (error) {
      onError(error as Error);
      return initialValue;
    }
  }, [key, initialValue, deserializer, onError]);

  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  const setValue = useCallback(
    (value: SetValue<T>) => {
      if (typeof window === 'undefined') {
        return;
      }

      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        window.sessionStorage.setItem(key, serializer(valueToStore));
        setStoredValue(valueToStore);
      } catch (error) {
        onError(error as Error);
      }
    },
    [key, storedValue, serializer, onError]
  );

  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.sessionStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      onError(error as Error);
    }
  }, [key, initialValue, onError]);

  return [storedValue, setValue, removeValue];
}

/**
 * Check if localStorage is available
 */
export function useLocalStorageAvailable(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      setAvailable(true);
    } catch {
      setAvailable(false);
    }
  }, []);

  return available;
}

/**
 * Get all localStorage keys
 */
export function useLocalStorageKeys(): string[] {
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const getAllKeys = () => {
      const allKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) allKeys.push(key);
      }
      return allKeys;
    };

    setKeys(getAllKeys());

    const handleStorageChange = () => {
      setKeys(getAllKeys());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return keys;
}

/**
 * Clear all items with a prefix from localStorage
 */
export function useClearLocalStorageByPrefix(): (prefix: string) => void {
  return useCallback((prefix: string) => {
    if (typeof window === 'undefined') return;

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }, []);
}

/**
 * Hook for localStorage with expiry
 */
export function useLocalStorageWithExpiry<T>(
  key: string,
  initialValue: T,
  ttlMs: number // Time to live in milliseconds
): [T, (value: T) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const item = localStorage.getItem(key);
      if (item) {
        const { value, expiry } = JSON.parse(item);
        if (expiry && Date.now() > expiry) {
          localStorage.removeItem(key);
          setStoredValue(initialValue);
        } else {
          setStoredValue(value);
        }
      }
    } catch {
      setStoredValue(initialValue);
    }
  }, [key, initialValue]);

  const setValue = useCallback(
    (value: T) => {
      if (typeof window === 'undefined') return;

      const item = {
        value,
        expiry: Date.now() + ttlMs,
      };
      localStorage.setItem(key, JSON.stringify(item));
      setStoredValue(value);
    },
    [key, ttlMs]
  );

  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Typed localStorage hook for specific app data
 */
interface AppStorageData {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'hi';
  currency: 'INR' | 'USD';
  lastProject: string | null;
  editorSettings: {
    brushSize: number;
    showGrid: boolean;
    autoSave: boolean;
  };
  recentStyles: string[];
  favoriteStyles: string[];
}

const defaultAppStorage: AppStorageData = {
  theme: 'system',
  language: 'en',
  currency: 'INR',
  lastProject: null,
  editorSettings: {
    brushSize: 20,
    showGrid: true,
    autoSave: true,
  },
  recentStyles: [],
  favoriteStyles: [],
};

export function useAppStorage(): [
  AppStorageData,
  <K extends keyof AppStorageData>(key: K, value: AppStorageData[K]) => void,
  () => void
] {
  const [data, setData, removeData] = useLocalStorage<AppStorageData>(
    'removation-app-data',
    defaultAppStorage
  );

  const updateValue = useCallback(
    <K extends keyof AppStorageData>(key: K, value: AppStorageData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    },
    [setData]
  );

  const reset = useCallback(() => {
    setData(defaultAppStorage);
  }, [setData]);

  return [data, updateValue, reset];
}

export default useLocalStorage;