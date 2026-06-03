import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/jwt';
import Tag from '@/lib/db/models/Tag';
import Tagging from '@/lib/db/models/Tagging';
import mongoose from 'mongoose';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  let tagObjectId: mongoose.Types.ObjectId;
  try {
    tagObjectId = new mongoose.Types.ObjectId(id);
  } catch {
    return NextResponse.json({ error: 'Invalid tag ID' }, { status: 400 });
  }

  const tag = await Tag.findOne({
    _id:      tagObjectId,
    userId:   new mongoose.Types.ObjectId(user.id),
    isGlobal: false,
  });

  if (!tag) return NextResponse.json({ error: 'Tag not found' }, { status: 404 });

  await Tagging.deleteMany({ tagId: tagObjectId });
  await Tag.findByIdAndDelete(tagObjectId);

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;
  const { label, color } = await req.json();

  const update: Record<string, string> = {};
  if (label) update.label = label;
  if (color) update.color = color;

  const tag = await Tag.findOneAndUpdate(
    {
      _id:      new mongoose.Types.ObjectId(id),
      userId:   new mongoose.Types.ObjectId(user.id),
      isGlobal: false,
    },
    update,
    { new: true }
  );

  if (!tag) return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  return NextResponse.json({ success: true, tag });
}
