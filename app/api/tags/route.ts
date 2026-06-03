import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/jwt';
import { getUserTags, getOrCreateTag } from '@/lib/tags/tagUtils';
import { seedDefaultTags } from '@/lib/tags/defaultTags';
import type { ITag, TagCategory } from '@/lib/db/models/Tag';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await seedDefaultTags();

  const { searchParams } = req.nextUrl;
  const search   = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';

  let tags: ITag[] = await getUserTags(user.id);

  if (search) {
    const q = search.toLowerCase();
    tags = tags.filter(t =>
      t.label.toLowerCase().includes(q) ||
      t.slug.includes(q)
    );
  }

  if (category) {
    tags = tags.filter(t => t.category === category);
  }

  return NextResponse.json({ tags });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { label, category, color } = await req.json();

  if (!label?.trim()) {
    return NextResponse.json({ error: 'Label is required' }, { status: 400 });
  }

  const tag = await getOrCreateTag(
    label,
    user.id,
    (category as TagCategory) || 'custom',
    color
  );

  return NextResponse.json({ success: true, tag });
}
