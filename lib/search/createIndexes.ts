import { connectToDatabase } from '@/lib/db/mongodb';
import mongoose from 'mongoose';

/**
 * Create text indexes on all searchable collections.
 * Safe to call multiple times — MongoDB ignores duplicate index creation.
 */
export async function createSearchIndexes() {
  await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) return;

  const indexes = [
    {
      collection: 'projects',
      index:      { name: 'text', description: 'text', tags: 'text' },
      weights:    { name: 10, description: 5, tags: 3 },
      name:       'projects_search',
    },
    {
      collection: 'renders',
      index:      { mode: 'text', prompt: 'text', style: 'text' },
      weights:    { mode: 8, style: 5, prompt: 3 },
      name:       'renders_search',
    },
    {
      collection: 'designers',
      index:      { displayName: 'text', bio: 'text', specialties: 'text', city: 'text' },
      weights:    { displayName: 10, specialties: 8, bio: 4, city: 3 },
      name:       'designers_search',
    },
    {
      collection: 'users',
      index:      { firstName: 'text', lastName: 'text', email: 'text' },
      weights:    { firstName: 8, lastName: 8, email: 5 },
      name:       'users_search',
    },
  ];

  for (const { collection, index, weights, name } of indexes) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.collection(collection).createIndex(index as any, {
        weights,
        name,
        background: true,
      });
      console.log(`[Search] Index created: ${name}`);
    } catch (err: unknown) {
      const code = (err as { code?: number; codeName?: string }).code;
      const codeName = (err as { codeName?: string }).codeName;
      if (code === 85 || code === 86 || codeName === 'IndexOptionsConflict') {
        console.log(`[Search] Index already exists: ${name}`);
      } else {
        console.error(`[Search] Failed to create index ${name}:`, err);
      }
    }
  }
}
