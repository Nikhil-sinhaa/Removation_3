// app/(marketing)/contact/layout.tsx
// Server component wrapper to provide metadata for the "use client" contact page
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us — Get in Touch',
  description:
    'Have questions about Removation.ai? Reach out to our team for support, partnership inquiries, or enterprise pricing. We respond within 24 hours.',
  openGraph: {
    title: 'Contact Us | Removation.ai',
    description:
      'Have questions? Reach our team for support, partnerships, or enterprise pricing.',
    url: 'https://removation.ai/contact',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
