import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'AI Room Changer',
  description: 'Transform your room into any interior design style instantly. Upload a photo, pick a style, and see results in seconds.',
  openGraph: {
    title:       'AI Room Changer — Removation.ai',
    description: 'Transform your room into any design style with AI. Instant results.',
    url:         'https://removation.ai/room-changer',
  },
};

export default function RoomChangerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
