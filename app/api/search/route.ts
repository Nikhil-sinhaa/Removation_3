import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { unifiedSearch, type SearchResultType } from '@/lib/search/search';
import { createSearchIndexes } from '@/lib/search/createIndexes';

export const dynamic = 'force-dynamic';

let indexesCreated = false;

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!indexesCreated) {
    indexesCreated = true;
    createSearchIndexes().catch(console.error);
  }

  const { searchParams } = req.nextUrl;
  const query = searchParams.get('q') || '';
  const types = (searchParams.get('types') || '')
    .split(',')
    .filter(Boolean) as SearchResultType[];
  const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 10);

  if (query.length < 2) {
    return NextResponse.json({ results: [], total: 0, query, took: 0, grouped: {} });
  }

  const results = await unifiedSearch(query, user.id, types, limit);
  return NextResponse.json(results);
}
