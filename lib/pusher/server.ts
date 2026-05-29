import Pusher from 'pusher';

const hasPusherConfig = 
  process.env.PUSHER_APP_ID &&
  process.env.PUSHER_KEY &&
  process.env.PUSHER_SECRET &&
  process.env.PUSHER_CLUSTER;

if (!hasPusherConfig) {
  console.warn('[Pusher Server] Pusher environment variables are missing. Real-time updates will be disabled.');
}

export const pusherServer = hasPusherConfig
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    })
  : null;

