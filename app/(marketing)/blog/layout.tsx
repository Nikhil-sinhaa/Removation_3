// app/(marketing)/blog/layout.tsx
// Server component wrapper to provide metadata for the "use client" blog page
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — Interior Design Tips & Inspiration for Indian Homes',
  description:
    'Vastu Shastra guides, interior design trends, renovation tips, and AI design inspiration — all written for Indian homeowners and design professionals.',
  openGraph: {
    title: 'Blog — Interior Design Tips & Inspiration | Removation.ai',
    description:
      'Vastu guides, design trends, and renovation tips for Indian homes.',
    url: 'https://removation.ai/blog',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
