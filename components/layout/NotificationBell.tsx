'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCircle2, XCircle, Calendar, CreditCard, X, Check,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import Link from 'next/link';

// ── Time helper (no external lib) ─────────────────────────────────────────────
function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (diff < 60_000)  return 'just now';
  if (hours < 1)      return `${mins} min ago`;
  if (days < 1)       return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7)       return `${days} day${days !== 1 ? 's' : ''} ago`;

  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Icon + color by type ───────────────────────────────────────────────────────
function NotifIcon({ type }: { type: Notification['type'] }) {
  if (type === 'render_ready' || type === 'booking_completed') {
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  }
  if (type === 'render_failed') {
    return <XCircle className="w-4 h-4 text-red-500" />;
  }
  if (type.startsWith('booking_')) {
    return <Calendar className="w-4 h-4 text-blue-400" />;
  }
  if (type.startsWith('credits_')) {
    return <CreditCard className="w-4 h-4 text-yellow-400" />;
  }
  return <Bell className="w-4 h-4 text-gray-400" />;
}

function iconBg(type: Notification['type']): string {
  if (type === 'render_ready' || type === 'booking_completed') return 'bg-green-500/10';
  if (type === 'render_failed')                                 return 'bg-red-500/10';
  if (type.startsWith('booking_'))                             return 'bg-blue-500/10';
  if (type.startsWith('credits_'))                             return 'bg-yellow-500/10';
  return 'bg-gray-500/10';
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex gap-3 p-4 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-2.5 bg-muted rounded w-full" />
        <div className="h-2 bg-muted rounded w-1/3" />
      </div>
    </div>
  );
}

// ── Notification row ──────────────────────────────────────────────────────────
function NotifRow({
  notification,
  onRead,
  onDelete,
  onClose,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    onRead(notification._id);
    if (notification.link) {
      router.push(notification.link);
      onClose();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -80 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'relative flex gap-3 px-4 py-3 cursor-pointer group transition-colors',
        'hover:bg-muted/50',
        !notification.read && 'border-l-2 border-primary bg-primary/5 pl-[14px]',
        notification.read && 'border-l-2 border-transparent',
      )}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon */}
      <div className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
        iconBg(notification.type)
      )}>
        <NotifIcon type={notification.type} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-5">
        <p className={cn('text-sm leading-tight', !notification.read ? 'font-semibold' : 'font-medium')}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
          {notification.body}
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-1">
          {getTimeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Delete button — shown on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.1 }}
            className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center rounded-full hover:bg-destructive/15 hover:text-destructive text-muted-foreground transition-colors"
            onClick={(e) => { e.stopPropagation(); onDelete(notification._id); }}
            aria-label="Delete notification"
          >
            <X className="w-3 h-3" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const {
    notifications, unreadCount, isLoading,
    markRead, markAllRead, deleteNotification,
  } = useNotifications();

  const handleRead = (id: string) => { markRead([id]); };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors',
            'hover:bg-accent text-muted-foreground hover:text-foreground',
          )}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="w-4 h-4" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 shadow-xl" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Check className="w-3 h-3" />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="max-h-[400px]">
          {isLoading && notifications.length === 0 ? (
            <div className="divide-y">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <Bell className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {notifications.map(n => (
                <NotifRow
                  key={n._id}
                  notification={n}
                  onRead={handleRead}
                  onDelete={deleteNotification}
                  onClose={() => setOpen(false)}
                />
              ))}
            </AnimatePresence>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-4 py-2.5">
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all notifications →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;
