import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';
import Tag, { ITag, TagCategory } from '@/lib/db/models/Tag';
import Tagging, { TaggableType } from '@/lib/db/models/Tagging';

export function labelToSlug(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

export function generateTagColor(slug: string): string {
  const colors = [
    '#8B5CF6', '#6366F1', '#3B82F6', '#0EA5E9',
    '#10B981', '#F59E0B', '#EF4444', '#EC4899',
    '#14B8A6', '#F97316', '#84CC16', '#A855F7',
  ];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

export async function getOrCreateTag(
  label:    string,
  userId:   string,
  category: TagCategory = 'custom',
  color?:   string
): Promise<ITag> {
  await connectToDatabase();
  const slug = labelToSlug(label);

  const globalTag = await Tag.findOne({ slug, isGlobal: true });
  if (globalTag) return globalTag as ITag;

  const uid = new mongoose.Types.ObjectId(userId);
  const existing = await Tag.findOne({ slug, userId: uid });
  if (existing) return existing as ITag;

  return Tag.create({
    slug,
    label:      label.trim(),
    color:      color || generateTagColor(slug),
    userId:     uid,
    isGlobal:   false,
    category,
    usageCount: 0,
    path:       slug,
  }) as Promise<ITag>;
}

export async function addTag(
  tagId:        string,
  taggableType: TaggableType,
  taggableId:   string,
  userId:       string
): Promise<void> {
  await connectToDatabase();

  const tid = new mongoose.Types.ObjectId(tagId);
  const iid = new mongoose.Types.ObjectId(taggableId);
  const uid = new mongoose.Types.ObjectId(userId);

  try {
    await Tagging.create({ tagId: tid, taggableType, taggableId: iid, userId: uid });
    await Tag.findByIdAndUpdate(tid, { $inc: { usageCount: 1 } });
  } catch (err: unknown) {
    if ((err as { code?: number }).code !== 11000) throw err;
  }
}

export async function removeTag(
  tagId:        string,
  taggableType: TaggableType,
  taggableId:   string
): Promise<void> {
  await connectToDatabase();

  const result = await Tagging.findOneAndDelete({
    tagId:        new mongoose.Types.ObjectId(tagId),
    taggableType,
    taggableId:   new mongoose.Types.ObjectId(taggableId),
  });

  if (result) {
    await Tag.findByIdAndUpdate(tagId, { $inc: { usageCount: -1 } });
  }
}

export async function getTagsForItem(
  taggableType: TaggableType,
  taggableId:   string
): Promise<ITag[]> {
  await connectToDatabase();

  const taggings = await Tagging.find({
    taggableType,
    taggableId: new mongoose.Types.ObjectId(taggableId),
  }).lean();

  if (!taggings.length) return [];

  const tagIds = taggings.map(t => t.tagId);
  return Tag.find({ _id: { $in: tagIds } }).lean() as unknown as Promise<ITag[]>;
}

export async function getItemsByTag(
  tagId:        string,
  taggableType: TaggableType,
  userId:       string
): Promise<string[]> {
  await connectToDatabase();

  const taggings = await Tagging.find({
    tagId:        new mongoose.Types.ObjectId(tagId),
    taggableType,
    userId:       new mongoose.Types.ObjectId(userId),
  }).lean();

  return taggings.map(t => String(t.taggableId));
}

export async function getUserTags(userId: string): Promise<ITag[]> {
  await connectToDatabase();

  return Tag.find({
    $or: [
      { isGlobal: true },
      { userId: new mongoose.Types.ObjectId(userId) },
    ],
  })
  .sort({ usageCount: -1, label: 1 })
  .limit(200)
  .lean() as unknown as Promise<ITag[]>;
}
