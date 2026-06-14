'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { useUserStore } from '@/stores/user-store';

export interface Notification {
  _id: string;
  userId: string;
  type:
    | 'render_ready'
    | 'render_failed'
    | 'booking_accepted'
    | 'booking_rejected'
    | 'booking_completed'
    | 'booking_cancelled'
    | 'booking_message'
    | 'credits_low'
    | 'credits_purchased'
    | 'subscription_expiring'
    | 'system';
  title: string;
  body: string;
  link?: string;
  imageUrl?: string;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markRead: (ids: string[]) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => void;
}

const POLL_INTERVAL_MS = 30_000;

function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    
    // First note: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    // Second note: A5 (880.00 Hz) slightly delayed for chime effect
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.08);
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.5);
    
    osc2.start(now + 0.08);
    osc2.stop(now + 0.7);
  } catch (e) {
    console.warn('Notification sound failed to play:', e);
  }
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [isLoading, setIsLoading]         = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstFetchRef = useRef(true);
  const prevNotificationsRef = useRef<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      const newNotifications: Notification[] = data.notifications ?? [];
      const newUnreadCount = data.unreadCount ?? 0;

      // Identify new unread notifications that were not in the previous list
      if (!isFirstFetchRef.current && prevNotificationsRef.current.length > 0) {
        const prevIds = prevNotificationsRef.current.map(n => n._id);
        const newlyAddedUnread = newNotifications.filter(n => !n.read && !prevIds.includes(n._id));
        
        if (newlyAddedUnread.length > 0) {
          const prefs = useUserStore.getState().preferences;
          const soundEnabled = prefs.soundEnabled ?? true;
          const browserEnabled = prefs.browserNotificationsEnabled ?? false;
          
          newlyAddedUnread.forEach(notif => {
            // Check if we already played this notification in another tab
            const lastPlayedId = localStorage.getItem('last_played_notification_id');
            if (lastPlayedId !== notif._id) {
              localStorage.setItem('last_played_notification_id', notif._id);
              
              // 1. Play sound
              if (soundEnabled) {
                playNotificationSound();
              }
              
              // 2. Trigger browser desktop notification
              if (browserEnabled && typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
                try {
                  new window.Notification(notif.title, {
                    body: notif.body,
                    icon: '/favicon.ico',
                  });
                } catch (e) {
                  console.warn('Native notification failed:', e);
                }
              }
              
              // 3. Show inside-app toast
              toast({
                title: notif.title,
                description: notif.body,
                variant: notif.type === 'render_failed' ? 'destructive' : 'default',
              });
            }
          });
        }
      }

      if (isFirstFetchRef.current) {
        isFirstFetchRef.current = false;
      }
      
      prevNotificationsRef.current = newNotifications;
      setNotifications(newNotifications);
      setUnreadCount(newUnreadCount);
    } catch {
      // swallow — polling must never crash the app
    }
  }, [user]);

  const refresh = useCallback(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      isFirstFetchRef.current = true;
      prevNotificationsRef.current = [];
      return;
    }

    setIsLoading(true);
    fetchNotifications().finally(() => setIsLoading(false));

    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, fetchNotifications]);

  const markRead = useCallback(async (ids: string[]) => {
    // Count unread among the ids BEFORE optimistic update
    const unreadToMark = notifications.filter(n => ids.includes(n._id) && !n.read).length;

    setNotifications(prev => prev.map(n => ids.includes(n._id) ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - unreadToMark));

    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: ids }),
      });
      if (!res.ok) refresh();
    } catch {
      refresh();
    }
  }, [notifications, refresh]);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) refresh();
    } catch {
      refresh();
    }
  }, [refresh]);

  const deleteNotification = useCallback(async (id: string) => {
    const deleted = notifications.find(n => n._id === id);
    setNotifications(prev => prev.filter(n => n._id !== id));
    if (deleted && !deleted.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) refresh();
    } catch {
      refresh();
    }
  }, [notifications, refresh]);

  return { notifications, unreadCount, isLoading, markRead, markAllRead, deleteNotification, refresh };
}
