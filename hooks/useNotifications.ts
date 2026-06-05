'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

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

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [isLoading, setIsLoading]         = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // swallow — polling must never crash the app
    }
  }, [user]);

  const refresh = useCallback(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
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
