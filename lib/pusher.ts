// lib/pusher.ts — server-side Pusher instance delegating to server config
import Pusher from 'pusher';
import { pusherServer } from './pusher/server';

export function getPusherServer(): Pusher | null {
    return pusherServer;
}
