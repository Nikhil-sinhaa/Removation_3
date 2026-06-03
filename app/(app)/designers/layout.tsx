import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'Browse Interior Designers',
  description: 'Find and book verified interior designers in India. Browse portfolios, read reviews, and book consultations directly.',
  openGraph: {
    title:       'Browse Interior Designers — Removation.ai',
    description: 'Find verified interior designers for your home renovation project.',
    url:         'https://removation.ai/designers',
  },
};

export default function DesignersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
