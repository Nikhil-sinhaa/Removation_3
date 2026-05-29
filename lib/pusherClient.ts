// lib/pusherClient.ts — client-side Pusher singleton
import Pusher from 'pusher-js';

let pusherClient: Pusher | null = null;

export function getPusherClient(): Pusher | null {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
        console.warn('[Pusher Client] Pusher key or cluster is missing. Real-time features will be disabled.');
        return null;
    }

    if (!pusherClient) {
        pusherClient = new Pusher(key, {
            cluster: cluster,
            authEndpoint: '/api/pusher/auth',
        });
    }
    return pusherClient;
}
