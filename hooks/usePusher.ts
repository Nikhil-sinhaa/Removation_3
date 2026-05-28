'use client';
import PusherClient from 'pusher-js';
import { useEffect, useRef } from 'react';

let pusherClient: PusherClient | null = null;

function getPusherClient(): PusherClient {
  if (!pusherClient) {
    pusherClient = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! }
    );
  }
  return pusherClient;
}

export function useBookingChannel(
  bookingId: string | null,
  onMessage: (message: IMessagePayload) => void
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!bookingId) return;
    const client = getPusherClient();
    const channel = client.subscribe(`booking-${bookingId}`);
    channel.bind('new-message', (data: IMessagePayload) => {
      onMessageRef.current(data);
    });
    return () => {
      channel.unbind_all();
      client.unsubscribe(`booking-${bookingId}`);
    };
  }, [bookingId]);
}

export interface IMessagePayload {
  _id: string;
  bookingId: string;
  senderId: string;
  senderRole: string;
  senderName: string;
  text: string;
  readAt: string | null;
  isSystem: boolean;
  createdAt: string;
}
