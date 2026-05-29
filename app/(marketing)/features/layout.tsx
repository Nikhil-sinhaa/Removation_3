// app/(marketing)/features/layout.tsx
// Server component wrapper to provide metadata for the "use client" features page
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Features — AI Design Tools for Indian Homes',
  description:
    'Explore all AI-powered interior design tools: Room Redesign, Style Transfer, Vastu Shastra analysis, Real-time ₹ Cost Calculator, Smart Inpainting, and Empty Room Furnishing.',
  openGraph: {
    title: 'Features — AI Design Tools | Removation.ai',
    description:
      'Explore all AI-powered interior design tools: Room Redesign, Vastu analysis, real-time ₹ estimates, and 400+ design styles.',
    url: 'https://removation.ai/features',
  },
}

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
