import { connectToDatabase } from '@/lib/db/mongodb';
import Tag from '@/lib/db/models/Tag';
import { labelToSlug } from './tagUtils';

const DEFAULT_GLOBAL_TAGS = [
  { label: 'Bedroom',           category: 'room_type', color: '#8B5CF6' },
  { label: 'Living Room',       category: 'room_type', color: '#6366F1' },
  { label: 'Kitchen',           category: 'room_type', color: '#F59E0B' },
  { label: 'Bathroom',          category: 'room_type', color: '#0EA5E9' },
  { label: 'Dining Room',       category: 'room_type', color: '#10B981' },
  { label: 'Home Office',       category: 'room_type', color: '#3B82F6' },
  { label: 'Balcony',           category: 'room_type', color: '#84CC16' },
  { label: 'Exterior',          category: 'room_type', color: '#F97316' },
  { label: 'Modern',            category: 'style',     color: '#6366F1' },
  { label: 'Japandi',           category: 'style',     color: '#8B5CF6' },
  { label: 'Scandinavian',      category: 'style',     color: '#0EA5E9' },
  { label: 'Traditional Indian',category: 'style',     color: '#F59E0B' },
  { label: 'Industrial',        category: 'style',     color: '#6B7280' },
  { label: 'Luxury',            category: 'style',     color: '#EAB308' },
  { label: 'Bohemian',          category: 'style',     color: '#EC4899' },
  { label: 'Minimalist',        category: 'style',     color: '#94A3B8' },
  { label: 'In Progress',       category: 'status',    color: '#F59E0B' },
  { label: 'Complete',          category: 'status',    color: '#10B981' },
  { label: 'Client Work',       category: 'status',    color: '#6366F1' },
  { label: 'Personal',          category: 'status',    color: '#8B5CF6' },
  { label: 'Favourite',         category: 'status',    color: '#EF4444' },
  { label: 'Warm Tones',        category: 'color',     color: '#F97316' },
  { label: 'Cool Palette',      category: 'color',     color: '#0EA5E9' },
  { label: 'Neutral',           category: 'color',     color: '#94A3B8' },
  { label: 'Bold Colors',       category: 'color',     color: '#EC4899' },
] as const;

let seeded = false;

export async function seedDefaultTags() {
  if (seeded) return;
  seeded = true;

  await connectToDatabase();

  for (const tag of DEFAULT_GLOBAL_TAGS) {
    const slug = labelToSlug(tag.label);
    await Tag.findOneAndUpdate(
      { slug, isGlobal: true },
      {
        $setOnInsert: {
          slug,
          label:      tag.label,
          color:      tag.color,
          isGlobal:   true,
          category:   tag.category,
          usageCount: 0,
          path:       slug,
        },
      },
      { upsert: true, new: true }
    );
  }
  console.log('[Tags] Default tags seeded');
}
