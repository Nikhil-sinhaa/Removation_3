// app/(marketing)/about/layout.tsx
// Server component wrapper to provide metadata for the "use client" about page
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us — Our Mission to Redefine Indian Home Design',
  description:
    'Removation.ai is building the future of interior design in India — combining AI technology with Vastu Shastra wisdom to help every Indian homeowner design their dream space.',
  openGraph: {
    title: 'About Us | Removation.ai',
    description:
      'Building the future of interior design in India — AI meets Vastu Shastra.',
    url: 'https://removation.ai/about',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
