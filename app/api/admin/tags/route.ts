import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { requireRole } from '@/lib/auth/requireRole';
import Tag from '@/lib/db/models/Tag';
import Tagging from '@/lib/db/models/Tagging';
import { labelToSlug } from '@/lib/tags/tagUtils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [globalTags, totalTags, totalTaggings, orphaned] = await Promise.all([
    Tag.find({ isGlobal: true }).sort({ usageCount: -1 }).lean(),
    Tag.countDocuments(),
    Tagging.countDocuments(),
    Tag.countDocuments({ usageCount: 0, createdAt: { $lt: cutoff } }),
  ]);

  return NextResponse.json({
    globalTags,
    stats: { totalTags, totalTaggings, orphaned },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();
  const { label, category, color } = await req.json();

  if (!label?.trim()) {
    return NextResponse.json({ error: 'Label is required' }, { status: 400 });
  }

  const slug = labelToSlug(label);
  const tag = await Tag.create({
    slug,
    label: label.trim(),
    color:      color || '#8B5CF6',
    category:   category || 'custom',
    isGlobal:   true,
    usageCount: 0,
    path:       slug,
  });

  return NextResponse.json({ success: true, tag });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await Tag.deleteMany({
    usageCount: 0,
    isGlobal:   false,
    createdAt:  { $lt: cutoff },
  });

  return NextResponse.json({ success: true, deleted: result.deletedCount });
}
