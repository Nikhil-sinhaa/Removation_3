'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import type { BookingStateId } from '@/lib/db/models/WorkflowState';

const STATE_COLORS: Record<string, string> = {
  draft:                '#9CA3AF',
  pending:              '#F59E0B',
  pending_designer:     '#F59E0B',
  pending_payment:      '#9CA3AF',
  accepted:             '#3B82F6',
  confirmed:            '#3B82F6',
  in_progress:          '#8B5CF6',
  review:               '#06B6D4',
  completed:            '#10B981',
  rejected:             '#EF4444',
  cancelled:            '#6B7280',
  cancelled_by_customer:'#6B7280',
  disputed:             '#DC2626',
  refunded:             '#7C3AED',
  expired:              '#9CA3AF',
};

const STATE_ICONS: Record<string, typeof CheckCircle2> = {
  completed:   CheckCircle2,
  rejected:    XCircle,
  cancelled:   XCircle,
  cancelled_by_customer: XCircle,
  disputed:    AlertCircle,
};

interface WorkflowEvent {
  _id:         string;
  fromState:   string;
  toState:     string;
  transitionId:string;
  message?:    string;
  createdAt:   string;
  triggeredBy?: { firstName?: string; lastName?: string; email?: string };
  triggeredByRole: string;
}

interface WorkflowTimelineProps {
  bookingId: string;
}

export function WorkflowTimeline({ bookingId }: WorkflowTimelineProps) {
  const [events,  setEvents]  = useState<WorkflowEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}/history`)
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [bookingId]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1,2,3].map(i => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 shrink-0" />
            <div className="flex-1 space-y-1 pt-1">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-40" />
              <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events.length) {
    return <p className="text-sm text-neutral-500 text-center py-4">No history yet</p>;
  }

  return (
    <div className="space-y-0">
      {events.map((event, idx) => {
        const isLast    = idx === events.length - 1;
        const Icon      = STATE_ICONS[event.toState] || Clock;
        const color     = STATE_COLORS[event.toState]   || '#6B7280';
        const fromColor = STATE_COLORS[event.fromState] || '#6B7280';
        const name      = event.triggeredBy
          ? [event.triggeredBy.firstName, event.triggeredBy.lastName].filter(Boolean).join(' ') || event.triggeredBy.email || event.triggeredByRole
          : event.triggeredByRole;

        return (
          <div key={event._id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2"
                style={{ borderColor: color, backgroundColor: `${color}20` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-neutral-200 dark:bg-neutral-700 my-1" />
              )}
            </div>

            <div className="pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: `${fromColor}20`, color: fromColor }}
                >
                  {event.fromState.replace(/_/g, ' ')}
                </span>
                <ArrowRight className="w-3 h-3 text-neutral-400" />
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {event.toState.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {name}
                {' · '}
                {new Date(event.createdAt).toLocaleString()}
              </p>
              {event.message && (
                <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1 bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2">
                  &ldquo;{event.message}&rdquo;
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
