import { headers } from 'next/headers';
import Link from 'next/link';

export default async function NotFound() {
  const headersList = await headers();
  const url      = headersList.get('x-url') || '';
  const referrer = headersList.get('referer') || '';

  // Fire-and-forget 404 logging — never blocks page render
  if (url && !url.startsWith('/api/') && !url.includes('.')) {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    fetch(`${base}/api/internal/log-404`, {
      method:  'POST',
      headers: {
        'Content-Type':     'application/json',
        'x-internal-secret': process.env.INTERNAL_SECRET || '',
      },
      body: JSON.stringify({ url, referrer }),
    }).catch(() => {});
  }

  return (
    <div
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        minHeight:      '100vh',
        textAlign:      'center',
        padding:        '0 1rem',
        background:     '#0a0a0a',
        color:          '#fff',
      }}
    >
      <h1 style={{ fontSize: '6rem', fontWeight: 700, margin: 0, color: '#7c3aed' }}>404</h1>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 500, margin: '0.5rem 0', color: '#f0f0ff' }}>
        Page not found
      </h2>
      <p style={{ color: '#71717a', marginBottom: '2rem', maxWidth: 400 }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        style={{
          padding:         '0.75rem 1.5rem',
          background:      '#7c3aed',
          color:           '#fff',
          borderRadius:    '0.5rem',
          textDecoration:  'none',
          fontWeight:      500,
          transition:      'background 150ms',
        }}
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
