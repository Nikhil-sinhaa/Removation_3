import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'AI Dream Room Designer',
  description: 'Upload a photo of your room and instantly redesign it with AI. Choose from 400+ design styles including Modern, Japandi, Traditional Indian and more.',
  openGraph: {
    title:       'AI Dream Room Designer — Removation.ai',
    description: 'Redesign your room in any style with AI. 400+ styles, instant results.',
    url:         'https://removation.ai/dream-room',
  },
};

export default function DreamRoomLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
