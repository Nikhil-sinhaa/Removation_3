'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Transition {
  _id:          string;
  transitionId: string;
  label:        string;
  description:  string;
  toState:      string;
  conditions: {
    requiresMessage: boolean;
    requiresRating:  boolean;
  };
}

interface TransitionButtonsProps {
  bookingId:  string;
  onSuccess?: (newState: string) => void;
}

export function TransitionButtons({ bookingId, onSuccess }: TransitionButtonsProps) {
  const [transitions,      setTransitions]      = useState<Transition[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [executing,        setExecuting]        = useState<string | null>(null);
  const [activeTransition, setActiveTransition] = useState<Transition | null>(null);
  const [message,          setMessage]          = useState('');
  const [rating,           setRating]           = useState(0);
  const [error,            setError]            = useState('');

  const fetchTransitions = async () => {
    try {
      const res  = await fetch(`/api/bookings/${bookingId}/transition`);
      const data = await res.json();
      setTransitions(data.transitions || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransitions(); }, [bookingId]);

  const handleTransition = async () => {
    if (!activeTransition) return;
    setExecuting(activeTransition.transitionId);
    setError('');

    try {
      const res = await fetch(`/api/bookings/${bookingId}/transition`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          transitionId: activeTransition.transitionId,
          message:      message || undefined,
          rating:       rating  || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Transition failed');
        return;
      }

      setActiveTransition(null);
      setMessage('');
      setRating(0);
      onSuccess?.(data.newState);
      await fetchTransitions();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setExecuting(null);
    }
  };

  if (loading || !transitions.length) return null;

  const getVariant = (t: Transition): 'default' | 'destructive' | 'outline' => {
    if (['reject','cancel','raise_dispute'].includes(t.transitionId)) return 'destructive';
    if (['approve','resolve_dispute'].includes(t.transitionId))       return 'default';
    return 'outline';
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {transitions.map(t => (
          <Button
            key={t.transitionId}
            variant={getVariant(t)}
            size="sm"
            disabled={!!executing}
            onClick={() => { setActiveTransition(t); setMessage(''); setRating(0); setError(''); }}
          >
            {executing === t.transitionId && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
            {t.label}
          </Button>
        ))}
      </div>

      <Dialog open={!!activeTransition} onOpenChange={open => !open && setActiveTransition(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeTransition?.label}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {activeTransition?.description}
            </p>

            {(activeTransition?.conditions.requiresMessage ||
              ['cancel','reject','request_revision','raise_dispute'].includes(activeTransition?.transitionId || '')) && (
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">
                  {activeTransition?.conditions.requiresMessage ? 'Reason (required)' : 'Message (optional)'}
                </label>
                <Textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Enter a message..."
                  rows={3}
                />
              </div>
            )}

            {activeTransition?.conditions.requiresRating && (
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                  Rate this booking (required)
                </label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-neutral-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveTransition(null)} disabled={!!executing}>
              Cancel
            </Button>
            <Button
              onClick={handleTransition}
              disabled={
                !!executing ||
                (activeTransition?.conditions.requiresMessage && !message.trim()) ||
                (activeTransition?.conditions.requiresRating  && !rating)
              }
            >
              {executing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : (activeTransition?.label || 'Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
