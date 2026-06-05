'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCircle2, XCircle, Calendar, CreditCard,
  X, Check, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import Link from 'next/link';

// ── Time helper ───────────────────────────────────────────────────────────────
function getTimeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (diff < 60_000) return 'just now';
  if (hours < 1)     return `${mins} min ago`;
  if (days < 1)      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7)      return `${days} day${days !== 1 ? 's' : ''} ago`;

  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function isYesterday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const n = new Date();
  n.setDate(n.getDate() - 1);
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function isThisWeek(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 7 * 86_400_000;
}

function groupLabel(dateStr: string): 'Today' | 'Yesterday' | 'This week' | 'Earlier' {
  if (isToday(dateStr))     return 'Today';
  if (isYesterday(dateStr)) return 'Yesterday';
  if (isThisWeek(dateStr))  return 'This week';
  return 'Earlier';
}

// ── Icon + color by type ──────────────────────────────────────────────────────
function NotifIcon({ type }: { type: Notification['type'] }) {
  if (type === 'render_ready' || type === 'booking_completed') {
    return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  }
  if (type === 'render_failed') {
    return <XCircle className="w-5 h-5 text-red-500" />;
  }
  if (type.startsWith('booking_')) {
    return <Calendar className="w-5 h-5 text-blue-400" />;
  }
  if (type.startsWith('credits_')) {
    return <CreditCard className="w-5 h-5 text-yellow-400" />;
  }
  return <Bell className="w-5 h-5 text-gray-400" />;
}

function iconBg(type: Notification['type']): string {
  if (type === 'render_ready' || type === 'booking_completed') return 'bg-green-500/10';
  if (type === 'render_failed')                                 return 'bg-red-500/10';
  if (type.startsWith('booking_'))                             return 'bg-blue-500/10';
  if (type.startsWith('credits_'))                             return 'bg-yellow-500/10';
  return 'bg-gray-500/10';
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex gap-4 p-4 animate-pulse">
      <div className="w-11 h-11 rounded-full bg-white/5 flex-shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="h-3.5 bg-white/5 rounded w-2/5" />
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-2.5 bg-white/5 rounded w-1/4" />
      </div>
    </div>
  );
}

// ── Notification row ──────────────────────────────────────────────────────────
function NotifRow({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    onRead(notification._id);
    if (notification.link) router.push(notification.link);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -80 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative flex gap-4 p-4 rounded-xl cursor-pointer group transition-all duration-200',
        !notification.read
          ? 'border-l-[3px] border-purple-500 bg-purple-500/8 pl-[13px]'
          : 'border-l-[3px] border-transparent hover:bg-white/4',
      )}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: !notification.read
          ? 'rgba(124,58,237,0.06)'
          : hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
      }}
    >
      {/* Icon */}
      <div className={cn(
        'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0',
        iconBg(notification.type)
      )}>
        <NotifIcon type={notification.type} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-8">
        <div className="flex items-center gap-2">
          <p className={cn(
            'text-sm',
            !notification.read ? 'font-semibold text-white' : 'font-medium text-gray-200'
          )}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">
          {notification.body}
        </p>
        <p className="text-xs text-gray-600 mt-1">{getTimeAgo(notification.createdAt)}</p>
      </div>

      {/* Delete on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.1 }}
            className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            onClick={(e) => { e.stopPropagation(); onDelete(notification._id); }}
            aria-label="Delete"
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const {
    notifications, unreadCount, isLoading,
    markRead, markAllRead, deleteNotification,
  } = useNotifications();

  // Group by date label
  const groups = useMemo(() => {
    const order: Array<'Today' | 'Yesterday' | 'This week' | 'Earlier'> = [
      'Today', 'Yesterday', 'This week', 'Earlier',
    ];
    const map = new Map<string, Notification[]>();
    for (const n of notifications) {
      const label = groupLabel(n.createdAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(n);
    }
    return order.filter(l => map.has(l)).map(l => ({ label: l, items: map.get(l)! }));
  }, [notifications]);

  const handleRead = (id: string) => markRead([id]);

  return (
    <div className="max-w-2xl mx-auto py-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Check className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Loading skeletons */}
      {isLoading && notifications.length === 0 && (
        <div className="space-y-1">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            <Bell className="w-9 h-9 text-purple-400/60" />
          </div>
          <div>
            <p className="text-white font-medium text-lg">No notifications yet</p>
            <p className="text-gray-500 text-sm mt-1">
              You'll see render results, booking updates, and more here.
            </p>
          </div>
          <Link
            href="/ai-design"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white mt-2"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
            }}
          >
            <Sparkles className="w-4 h-4" />
            Start generating
          </Link>
        </div>
      )}

      {/* Grouped list */}
      <div className="space-y-6">
        {groups.map(({ label, items }) => (
          <div key={label}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
              {label}
            </p>
            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {items.map(n => (
                  <NotifRow
                    key={n._id}
                    notification={n}
                    onRead={handleRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
