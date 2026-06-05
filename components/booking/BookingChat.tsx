'use client';

// BookingChat — premium slide-in chat panel for a single booking.
// Uses Pusher public channels for real-time delivery and read receipts.

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, AlertCircle, MessageSquare, Check, CheckCheck, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPusherClient } from '@/lib/pusherClient';
import { useLanguage } from '@/hooks/useLanguage';

interface ChatMessage {
    _id: string;
    bookingId: string;
    senderId: string | { _id: string; firstName?: string; lastName?: string; imageUrl?: string } | null;
    senderName?: string;
    senderRole: 'customer' | 'designer' | 'contractor' | 'admin';
    text: string;
    readAt: string | null;
    isSystem: boolean;
    createdAt: string;
}

interface BookingChatProps {
    open: boolean;
    onClose: () => void;
    bookingId: string;
    currentUserId: string;
    providerName?: string;
}

const getSenderIdString = (msg: ChatMessage): string => {
    if (!msg.senderId) return '';
    if (typeof msg.senderId === 'string') return msg.senderId;
    return msg.senderId._id;
};

const getSenderName = (msg: ChatMessage): string => {
    if (msg.isSystem) return 'System';
    if (msg.senderName) return msg.senderName;
    if (msg.senderId && typeof msg.senderId === 'object') {
        return `${msg.senderId.firstName || ''} ${msg.senderId.lastName || ''}`.trim() || 'User';
    }
    return 'User';
};

const getSenderAvatar = (msg: ChatMessage): string | null => {
    if (msg.senderId && typeof msg.senderId === 'object') {
        return msg.senderId.imageUrl || null;
    }
    return null;
};

export function BookingChat({ open, onClose, bookingId, currentUserId, providerName }: BookingChatProps) {
    const { t } = useLanguage();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<ReturnType<ReturnType<typeof getPusherClient>['subscribe']> | null>(null);

    const scrollToBottom = useCallback((behavior: 'auto' | 'smooth' = 'smooth') => {
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
        }, 80);
    }, []);

    // Mark thread as read
    const markThreadAsRead = useCallback(async () => {
        if (!bookingId) return;
        try {
            await fetch(`/api/bookings/${bookingId}/messages/read`, { method: 'POST' });
        } catch (err) {
            console.error('[markThreadAsRead] Failed:', err);
        }
    }, [bookingId]);

    // Load message history when chat opens
    useEffect(() => {
        if (!open || !bookingId) return;

        setLoading(true);
        setLoadError(null);

        fetch(`/api/bookings/${bookingId}/messages`)
            .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.message || 'Failed to load')))
            .then(data => {
                setMessages(data.messages ?? []);
                scrollToBottom('auto');
            })
            .catch((err: string) => {
                setLoadError(typeof err === 'string' ? err : 'Failed to load messages');
            })
            .finally(() => setLoading(false));
    }, [open, bookingId, scrollToBottom]);

    // Mark read when open status or messages load changes
    useEffect(() => {
        if (open && bookingId && messages.length > 0) {
            // Check if there are any unread messages from other user
            const hasUnread = messages.some(m => getSenderIdString(m) !== currentUserId && !m.readAt);
            if (hasUnread) {
                markThreadAsRead();
            }
        }
    }, [open, bookingId, messages, currentUserId, markThreadAsRead]);

    // Subscribe to Pusher channel for real-time messages and read events
    useEffect(() => {
        if (!open || !bookingId) return;

        const pusher = getPusherClient();
        if (!pusher) return;

        const channelName = `booking-${bookingId}`;
        const channel = pusher.subscribe(channelName);
        channelRef.current = channel;

        // Bind incoming messages
        channel.bind('new-message', (data: ChatMessage) => {
            setMessages(prev => {
                if (prev.some(m => m._id === data._id)) return prev;
                return [...prev, data];
            });
            scrollToBottom('smooth');

            // If the panel is open and message is from the other party, auto-read it
            const senderIdStr = getSenderIdString(data);
            if (senderIdStr !== currentUserId) {
                markThreadAsRead();
            }
        });

        // Bind read receipts
        channel.bind('messages-read', (data: { readBy: string; readAt: string }) => {
            setMessages(prev =>
                prev.map(m => {
                    const senderIdStr = getSenderIdString(m);
                    // Mark mine as read
                    if (senderIdStr === currentUserId && !m.readAt) {
                        return { ...m, readAt: data.readAt };
                    }
                    return m;
                })
            );
        });

        return () => {
            channel.unbind_all();
            pusher.unsubscribe(channelName);
            channelRef.current = null;
        };
    }, [open, bookingId, currentUserId, markThreadAsRead, scrollToBottom]);

    // Send text message
    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || sending) return;

        setSending(true);
        setSendError(null);
        setText('');

        try {
            const res = await fetch(`/api/bookings/${bookingId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: trimmed }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to send');

            // Add locally to state immediately if not already there
            setMessages(prev => {
                if (prev.some(m => m._id === data.message._id)) return prev;
                return [...prev, data.message];
            });
            scrollToBottom('smooth');
        } catch (err: any) {
            setSendError(err.message);
            setText(trimmed); // Restore text so they can retry
        } finally {
            setSending(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e as any);
        }
    }

    return (
        <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
            <SheetContent
                side="right"
                className="w-full sm:w-[440px] p-0 flex flex-col bg-zinc-950 border-l border-zinc-800 text-white shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            >
                {/* Header */}
                <SheetHeader className="px-5 py-4 border-b border-zinc-850 flex-shrink-0 bg-zinc-950/80 backdrop-blur-md">
                    <SheetTitle className="flex items-center gap-2.5 text-base text-zinc-100 font-semibold">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/30">
                            <MessageSquare className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-zinc-100">
                                {providerName ? t('chat_with', { name: providerName }) : t('chat_booking')}
                            </span>
                            <span className="text-[10px] font-normal text-zinc-400">{t('chat_realtime')}</span>
                        </div>
                    </SheetTitle>
                </SheetHeader>

                {/* Messages Body */}
                <div className="flex-1 overflow-hidden relative bg-zinc-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(124,58,237,0.08),rgba(255,255,255,0))]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
                            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                            <span className="text-xs tracking-wide">{t('chat_loading')}</span>
                        </div>
                    ) : loadError ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-950/40 flex items-center justify-center border border-red-900/30">
                                <AlertCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <p className="text-sm font-semibold text-red-400">{loadError}</p>
                            <p className="text-xs text-zinc-400 max-w-[280px]">
                                {t('chat_err_verify')}
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="h-full px-4 py-4" id="chat-messages-container">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
                                    <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                        <MessageSquare className="w-5 h-5 text-zinc-400 opacity-60" />
                                    </div>
                                    <p className="text-sm font-medium">{t('chat_booking_no_messages')}</p>
                                    <p className="text-xs text-zinc-600 text-center max-w-[240px]">
                                        {t('chat_booking_no_messages_desc')}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4 pr-1">
                                <AnimatePresence initial={false}>
                                    {messages.map((msg, index) => {
                                        const isMine = getSenderIdString(msg) === currentUserId;
                                        const senderName = getSenderName(msg);
                                        const avatarUrl = getSenderAvatar(msg);

                                        // Render system message
                                        if (msg.isSystem) {
                                            return (
                                                <motion.div
                                                    key={msg._id || index}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="flex justify-center my-3"
                                                >
                                                    <div className="flex items-center gap-2 bg-violet-950/30 text-violet-300 border border-violet-900/30 text-xs px-3.5 py-2 rounded-xl max-w-[90%] shadow-[0_0_12px_rgba(124,58,237,0.03)] text-center">
                                                        <Info className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                                                        <span className="leading-relaxed">{msg.text}</span>
                                                    </div>
                                                </motion.div>
                                            );
                                        }

                                        return (
                                            <motion.div
                                                key={msg._id || index}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.18 }}
                                                className={cn('flex items-start gap-2.5', isMine ? 'justify-end' : 'justify-start')}
                                            >
                                                {/* Left party avatar */}
                                                {!isMine && (
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {avatarUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={avatarUrl}
                                                                alt={senderName}
                                                                className="w-7 h-7 rounded-lg object-cover border border-zinc-800"
                                                            />
                                                        ) : (
                                                            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 text-[10px] font-bold border border-zinc-700">
                                                                {senderName[0]?.toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className={cn('flex flex-col max-w-[76%]', isMine ? 'items-end' : 'items-start')}>
                                                    {/* Name & Role */}
                                                    {!isMine && (
                                                        <span className="text-[10px] text-zinc-500 font-semibold mb-0.5 ml-1 flex items-center gap-1">
                                                            {senderName}
                                                            <span className="text-[9px] font-normal text-zinc-650 bg-zinc-900 px-1 py-0.2 rounded border border-zinc-850">
                                                                {t('chat_role_' + msg.senderRole) || msg.senderRole}
                                                            </span>
                                                        </span>
                                                    )}

                                                    {/* Bubble */}
                                                    <div
                                                        className={cn(
                                                            'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm',
                                                            isMine
                                                                ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-none shadow-violet-950/20'
                                                                : 'bg-zinc-900 text-zinc-100 border border-zinc-850 rounded-tl-none'
                                                        )}
                                                    >
                                                        {msg.text}
                                                    </div>

                                                    {/* Timestamp & Read Receipt */}
                                                    <div className="flex items-center gap-1 mt-1 px-1">
                                                        <span className="text-[9px] text-zinc-500">
                                                            {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true,
                                                            })}
                                                        </span>
                                                        {isMine && (
                                                            <span>
                                                                {msg.readAt ? (
                                                                    <CheckCheck className="w-3.5 h-3.5 text-violet-400" />
                                                                ) : (
                                                                    <Check className="w-3.5 h-3.5 text-zinc-600" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                                <div ref={bottomRef} />
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {/* Input Section */}
                <div className="border-t border-zinc-850 px-4 py-3.5 bg-zinc-950 flex-shrink-0 relative">
                    {sendError && (
                        <div className="absolute -top-7 left-4 right-4 bg-red-950/90 border border-red-900/40 text-red-300 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 backdrop-blur">
                            <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                            <span className="truncate">{sendError}</span>
                        </div>
                    )}
                    <form onSubmit={handleSend} className="flex gap-2 items-end">
                        <textarea
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t('chat_type_placeholder')}
                            rows={2}
                            disabled={sending || !!loadError}
                            className={cn(
                                'flex-1 resize-none bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none transition-all duration-150',
                                'placeholder:text-zinc-500 focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed',
                                'scrollbar-none'
                            )}
                            maxLength={2000}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!text.trim() || sending || !!loadError}
                            className={cn(
                                'h-10 w-10 flex-shrink-0 rounded-xl transition-all duration-150',
                                text.trim()
                                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-950/30'
                                    : 'bg-zinc-800 text-zinc-500 border border-zinc-750 cursor-not-allowed'
                            )}
                        >
                            {sending ? (
                                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
