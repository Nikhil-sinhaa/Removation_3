import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'AI Furniture Remover',
  description: 'Remove any furniture or object from your room photo using AI. Perfect for staging, redesign planning, and property listings.',
  openGraph: {
    title:       'AI Furniture Remover — Removation.ai',
    description: 'Remove furniture from room photos with AI. Instant, realistic results.',
    url:         'https://removation.ai/furniture-remover',
  },
};

export default function FurnitureRemoverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
