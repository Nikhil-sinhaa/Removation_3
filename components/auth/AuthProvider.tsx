'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserStore } from '@/stores/user-store';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  _id?: string;
  clerkId?: string;
  name?: string;
  plan?: string;
  createdAt?: string | Date;
  credits: number;
  role?: 'customer' | 'designer' | 'admin';
  subscription?: any;
  preferences?: any;
  onboardingCompleted?: boolean;
  completedTours?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user) {
          const store = useUserStore.getState();
          store.setUser(data.user);
          if (data.user.preferences) {
            store.setPreferences(data.user.preferences);
          }
        }
      } else {
        setUser(null);
        useUserStore.getState().setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user session:', error);
      setUser(null);
      useUserStore.getState().setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      // ALWAYS try real session first
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include', // sends auth_token cookie
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (data.user) {
            const store = useUserStore.getState();
            store.setUser(data.user);
            if (data.user.preferences) {
              store.setPreferences(data.user.preferences);
            }
          }
          setIsLoading(false);
          return;
        }
      } catch (err) {
        // Network error or server down — fall through
      }

      // Only use mock bypass if explicitly enabled
      if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
        console.warn('[Auth] Using mock bypass — NEXT_PUBLIC_SKIP_AUTH=true');
        const mockUser = {
          _id: 'test-user-123',
          clerkId: 'test-user-123',
          email: 'dev@test.com',
          name: 'Dev User',
          plan: 'free',
          credits: 100,
        };
        setUser(mockUser as any);
        useUserStore.getState().setUser(mockUser as any);
        setIsLoading(false);
        return;
      }

      // No session, no bypass — user is logged out
      setUser(null);
      useUserStore.getState().setUser(null);
      setIsLoading(false);
    };

    loadSession();
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    const store = useUserStore.getState();
    store.setUser(newUser as any);
    if ((newUser as any).preferences) {
      store.setPreferences((newUser as any).preferences);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      useUserStore.getState().setUser(null);
      window.location.href = '/sign-in';
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isSignedIn: !!user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
