'use client';

// components/admin/RenderFeedbackThread.tsx
// Staff-only internal notes thread for a single render.
// Never shown to customers. Supports add / delete-own-note.

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, AlertCircle, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminNote {
    _id: string;
    authorId: string;
    authorName: string;
    text: string;
    createdAt: string;
}

interface Props {
    renderId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNoteTimestamp(iso: string): string {
    const d = new Date(iso);
    const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
    return `${date}, ${time}`;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() ?? '')
        .join('');
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RenderFeedbackThread({ renderId }: Props) {
    const { user } = useAuth();
    const { toast } = useToast();

    const [notes, setNotes] = useState<AdminNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [isExpanded, setIsExpanded] = useState(false);
    const [draftText, setDraftText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ── Fetch notes ───────────────────────────────────────────────────────────

    const fetchNotes = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const res = await fetch(`/api/admin/renders/${renderId}/notes`);
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.message || 'Failed to load notes');
            }
            const data = await res.json();
            // Newest first
            setNotes((data.adminNotes ?? []).slice().reverse());
        } catch (err: any) {
            setLoadError(err.message ?? 'Failed to load notes');
        } finally {
            setLoading(false);
        }
    }, [renderId]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    // Auto-focus textarea when expanded
    useEffect(() => {
        if (isExpanded) {
            setTimeout(() => textareaRef.current?.focus(), 60);
        }
    }, [isExpanded]);

    // Escape key collapses edit card
    useEffect(() => {
        if (!isExpanded) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setIsExpanded(false);
                setDraftText('');
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isExpanded]);

    // ── Submit note ───────────────────────────────────────────────────────────

    async function handleSubmit() {
        const text = draftText.trim();
        if (!text || submitting) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/renders/${renderId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to add note');

            // Newest first
            setNotes((data.adminNotes ?? []).slice().reverse());
            setDraftText('');
            setIsExpanded(false);
            toast({ title: 'Note added', description: 'Internal note saved successfully.' });
        } catch (err: any) {
            toast({
                title: 'Failed to add note',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    }

    // ── Delete note ───────────────────────────────────────────────────────────

    async function handleDelete(noteId: string) {
        if (deletingId) return;
        setDeletingId(noteId);
        try {
            const res = await fetch(
                `/api/admin/renders/${renderId}/notes?noteId=${noteId}`,
                { method: 'DELETE' },
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to delete note');

            setNotes((data.adminNotes ?? []).slice().reverse());
            toast({ title: 'Note deleted' });
        } catch (err: any) {
            toast({
                title: 'Failed to delete note',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setDeletingId(null);
        }
    }

    // ── Derived ───────────────────────────────────────────────────────────────

    // user._id is the Mongo ObjectId string from /api/auth/me
    const currentAdminId = (user as any)?._id ?? user?.id ?? '';

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="border-t border-neutral-800 pt-4 space-y-3">
            {/* Section header */}
            <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Admin Notes
                </span>
                <span className="ml-auto text-[10px] text-neutral-500 italic">
                    Staff-only — not visible to customers
                </span>
            </div>

            {/* Compose area */}
            <AnimatePresence mode="wait">
                {isExpanded ? (
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                    >
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                            <Textarea
                                ref={textareaRef}
                                value={draftText}
                                onChange={(e) => setDraftText(e.target.value)}
                                placeholder="Type an internal note… (Esc to cancel)"
                                rows={3}
                                maxLength={2000}
                                disabled={submitting}
                                className="resize-none bg-neutral-900 border-neutral-700 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-amber-500/60"
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-neutral-500">
                                    {draftText.length}/2000
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setIsExpanded(false);
                                            setDraftText('');
                                        }}
                                        disabled={submitting}
                                        className="text-neutral-400 hover:text-white h-7 px-2 text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSubmit}
                                        disabled={!draftText.trim() || submitting}
                                        className="h-7 px-3 text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                                    >
                                        {submitting ? (
                                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                        ) : (
                                            <Send className="w-3 h-3 mr-1" />
                                        )}
                                        Add Note
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        key="collapsed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsExpanded(true)}
                        className="w-full text-left rounded-xl border border-dashed border-neutral-700 hover:border-amber-500/50 bg-neutral-900/40 hover:bg-amber-500/5 px-3 py-2 text-sm text-neutral-500 hover:text-neutral-300 transition-all duration-150"
                    >
                        <MessageSquare className="w-3.5 h-3.5 inline mr-2 opacity-60" />
                        Add an internal note…
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Notes list */}
            <div className="space-y-2">
                {loading ? (
                    <>
                        <Skeleton className="h-16 w-full rounded-xl bg-neutral-800" />
                        <Skeleton className="h-12 w-full rounded-xl bg-neutral-800" />
                    </>
                ) : loadError ? (
                    <div className="flex items-center gap-2 text-xs text-red-400 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{loadError}</span>
                    </div>
                ) : notes.length === 0 ? (
                    <p className="text-xs text-neutral-600 text-center py-2 italic">
                        No admin notes yet
                    </p>
                ) : (
                    <AnimatePresence initial={false}>
                        {notes.map((note) => {
                            const isOwn = note.authorId === currentAdminId;
                            return (
                                <motion.div
                                    key={note._id}
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="group relative rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2.5 space-y-1"
                                >
                                    {/* Author row */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0">
                                            {getInitials(note.authorName)}
                                        </div>
                                        <span className="text-[11px] font-semibold text-neutral-300">
                                            {note.authorName}
                                        </span>
                                        <span className="text-[10px] text-neutral-600 ml-auto pr-5">
                                            {formatNoteTimestamp(note.createdAt)}
                                        </span>
                                    </div>

                                    {/* Note text */}
                                    <p
                                        className="text-sm text-neutral-300 leading-relaxed"
                                        style={{ whiteSpace: 'pre-wrap' }}
                                    >
                                        {note.text}
                                    </p>

                                    {/* Delete — own notes only */}
                                    {isOwn && (
                                        <button
                                            onClick={() => handleDelete(note._id)}
                                            disabled={deletingId === note._id}
                                            aria-label="Delete note"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded-md hover:bg-red-500/20 text-neutral-600 hover:text-red-400 disabled:opacity-40"
                                        >
                                            {deletingId === note._id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <X className="w-3 h-3" />
                                            )}
                                        </button>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
