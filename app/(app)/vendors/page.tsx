import { redirect } from 'next/navigation';

// /vendors is surfaced as a tab inside the unified marketplace page.
// This server-side redirect is instant (no client-side flash).
export default function VendorsPage() {
  redirect('/marketplace?tab=vendors');
}
