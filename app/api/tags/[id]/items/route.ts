import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/jwt';
import { getItemsByTag } from '@/lib/tags/tagUtils';
import type { TaggableType } from '@/lib/db/models/Tagging';
import mongoose from 'mongoose';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;
  const type = (req.nextUrl.searchParams.get('type') || 'project') as TaggableType;

  const itemIds = await getItemsByTag(id, type, user.id);
  if (!itemIds.length) return NextResponse.json({ items: [], itemIds: [] });

  const modelName = type === 'project' ? 'Project' : type === 'render' ? 'Render' : 'Designer';
  const Model = mongoose.models[modelName];
  if (!Model) return NextResponse.json({ items: [], itemIds });

  const items = await Model.find({
    _id: { $in: itemIds.map(iid => new mongoose.Types.ObjectId(iid)) },
  }).lean();

  return NextResponse.json({ items, itemIds });
}
