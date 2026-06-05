'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Info, AlertTriangle, CheckCircle, Zap, Wrench } from 'lucide-react';
import type { AnnouncementType } from '@/lib/db/models/Announcement';

// Flat client-side representation (after JSON serialization from API)
interface AnnouncementData {
  _id:           string;
  title:         string;
  message:       string;
  ctaLabel?:     string;
  ctaUrl?:       string;
  type:          AnnouncementType;
  icon?:         string;
  isDismissable: boolean;
}

type TypeConfig = {
  bg:          string;
  border:      string;
  text:        string;
  icon:        React.ComponentType<{ className?: string }>;
  defaultIcon: string;
};

const TYPE_CONFIG: Record<AnnouncementType, TypeConfig> = {
  info: {
    bg:          'bg-blue-950/80',
    border:      'border-blue-800',
    text:        'text-blue-100',
    icon:        Info,
    defaultIcon: 'ℹ️',
  },
  warning: {
    bg:          'bg-yellow-950/80',
    border:      'border-yellow-800',
    text:        'text-yellow-100',
    icon:        AlertTriangle,
    defaultIcon: '⚠️',
  },
  success: {
    bg:          'bg-green-950/80',
    border:      'border-green-800',
    text:        'text-green-100',
    icon:        CheckCircle,
    defaultIcon: '✅',
  },
  promotion: {
    bg:          'bg-purple-950/80',
    border:      'border-purple-700',
    text:        'text-purple-100',
    icon:        Zap,
    defaultIcon: '🎉',
  },
  maintenance: {
    bg:          'bg-red-950/80',
    border:      'border-red-800',
    text:        'text-red-100',
    icon:        Wrench,
    defaultIcon: '🔧',
  },
};

interface SingleBannerProps {
  announcement: AnnouncementData;
  onDismiss:    (id: string) => void;
}

function SingleBanner({ announcement, onDismiss }: SingleBannerProps) {
  const config  = TYPE_CONFIG[announcement.type] ?? TYPE_CONFIG.info;
  const [visible, setVisible] = useState(true);

  const handleDismiss = () => {
    setVisible(false);
    fetch(`/api/announcements/${announcement._id}/dismiss`, { method: 'POST' }).catch(() => {});
    setTimeout(() => onDismiss(announcement._id), 300);
  };

  const handleCtaClick = () => {
    fetch(`/api/announcements/${announcement._id}/cta`, { method: 'POST' }).catch(() => {});
  };

  const isExternal = announcement.ctaUrl?.startsWith('http') ?? false;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0,  height: 'auto' }}
          exit={{    opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.2 }}
          className={`w-full border-b ${config.bg} ${config.border} ${config.text}`}
        >
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
            <span className="text-base shrink-0 leading-none">
              {announcement.icon || config.defaultIcon}
            </span>

            <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
              {announcement.title && (
                <span className="font-semibold text-sm shrink-0">
                  {announcement.title}
                </span>
              )}
              <span className="text-sm opacity-90 truncate">
                {announcement.message}
              </span>
            </div>

            {announcement.ctaLabel && announcement.ctaUrl && (
              <a
                href={announcement.ctaUrl}
                onClick={handleCtaClick}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/25 transition-colors whitespace-nowrap"
              >
                {announcement.ctaLabel}
                {isExternal && <ExternalLink className="w-3 h-3" />}
              </a>
            )}

            {announcement.isDismissable && (
              <button
                onClick={handleDismiss}
                className="shrink-0 p-1 rounded-full opacity-60 hover:opacity-100 hover:bg-white/10 transition-all"
                aria-label="Dismiss announcement"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [loaded,        setLoaded]        = useState(false);

  useEffect(() => {
    fetch('/api/announcements')
      .then(r => r.json())
      .then(data => {
        setAnnouncements(data.announcements || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handleDismiss = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a._id !== id));
  };

  if (!loaded || !announcements.length) return null;

  return (
    <div className="w-full">
      {announcements.map(announcement => (
        <SingleBanner
          key={announcement._id}
          announcement={announcement}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
}
