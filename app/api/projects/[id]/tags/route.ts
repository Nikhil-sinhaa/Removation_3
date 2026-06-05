import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/jwt';
import { getTagsForItem, addTag, removeTag, getOrCreateTag } from '@/lib/tags/tagUtils';
import type { TagCategory } from '@/lib/db/models/Tag';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const tags = await getTagsForItem('project', id);
  return NextResponse.json({ tags });
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;
  const { tagId, label, category, color } = await req.json();

  let resolvedTagId = tagId;

  if (!resolvedTagId && label) {
    const tag = await getOrCreateTag(label, user.id, (category as TagCategory) || 'custom', color);
    resolvedTagId = String(tag._id);
  }

  if (!resolvedTagId) {
    return NextResponse.json({ error: 'tagId or label required' }, { status: 400 });
  }

  await addTag(resolvedTagId, 'project', id, user.id);

  const tags = await getTagsForItem('project', id);
  return NextResponse.json({ success: true, tags });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { tagId } = await req.json();

  if (!tagId) return NextResponse.json({ error: 'tagId required' }, { status: 400 });

  await removeTag(tagId, 'project', id);

  const tags = await getTagsForItem('project', id);
  return NextResponse.json({ success: true, tags });
}
