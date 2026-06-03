import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';

export interface DeletionReport {
  userId:    string;
  deletedAt: string;
  deleted:   Record<string, number | string>;
}

/**
 * Permanently delete all data for a user across every model.
 * Order: dependent records first, user document last.
 */
export async function cascadeDeleteUser(userId: string): Promise<DeletionReport> {
  await connectToDatabase();
  const uid = new mongoose.Types.ObjectId(userId);
  const report: DeletionReport = { userId, deletedAt: new Date().toISOString(), deleted: {} };

  const models = [
    { key: 'renders',      model: 'Render',         query: { userId: uid } },
    { key: 'projects',     model: 'Project',         query: { userId: uid } },
    { key: 'bookings',     model: 'Booking',         query: { customerId: uid } },
    { key: 'reviews',      model: 'Review',          query: { customerId: uid } },
    { key: 'messages',     model: 'Message',         query: { senderId: uid } },
    { key: 'inquiries',    model: 'VendorInquiry',   query: { customerId: uid } },
    { key: 'subscription', model: 'Subscription',    query: { clerkId: userId } },
    { key: 'privacyReqs',  model: 'PrivacyRequest',  query: { userId: uid } },
  ];

  for (const { key, model, query } of models) {
    try {
      const m = mongoose.models[model];
      if (m) {
        const result = await m.deleteMany(query);
        report.deleted[key] = result.deletedCount;
      }
    } catch (err) {
      console.error(`[Privacy] Failed to delete ${key}:`, err);
      report.deleted[key] = 'error';
    }
  }

  const User = (await import('@/lib/db/models/User')).default;
  await User.findByIdAndDelete(uid);
  report.deleted['user'] = 1;

  return report;
}
