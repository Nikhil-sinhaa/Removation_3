// app/(marketing)/pricing/layout.tsx
// Server component to export metadata for the "use client" pricing page
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Plans for Every Home & Team',
  description:
    'Start free with 3 AI renders/month. Upgrade to Pro (₹2,399/mo) for unlimited renders, Vastu analysis, cost calculator & marketplace access. Teams plan for design agencies.',
  openGraph: {
    title: 'Pricing | Removation.ai',
    description:
      'Free plan available. Pro from ₹2,399/mo — unlimited AI renders, Vastu analysis, real-time ₹ cost calculator.',
    url: 'https://removation.ai/pricing',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
