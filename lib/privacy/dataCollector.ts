import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';

export interface UserDataExport {
  exportedAt:    string;
  exportVersion: string;
  profile:       Record<string, unknown> | null;
  projects:      unknown[];
  renders:       unknown[];
  bookings:      unknown[];
  reviews:       unknown[];
  subscription:  unknown;
  _meta:         Record<string, number>;
  [key: string]: unknown;
}

/**
 * Collect all data for a user across every model.
 * Each model query is wrapped in try/catch — one failure does not break the export.
 */
export async function collectUserData(userId: string): Promise<UserDataExport> {
  await connectToDatabase();
  const uid = new mongoose.Types.ObjectId(userId);

  const User         = (await import('@/lib/db/models/User')).default;
  const Project      = (await import('@/lib/db/models/Project')).default;
  const Render       = (await import('@/lib/db/models/Render')).default;
  const Booking      = (await import('@/lib/db/models/Booking')).default;
  const Review       = (await import('@/lib/db/models/Review')).default;
  const Subscription = (await import('@/lib/db/models/Subscription')).default;

  const [profile, projects, renders, bookings, reviews, subscription] = await Promise.all([
    User.findById(uid).lean().catch(() => null),
    Project.find({ userId: uid }).lean().catch(() => []),
    Render.find({ userId: uid }).lean().catch(() => []),
    Booking.find({ $or: [{ customerId: uid }, { userId: uid }] }).lean().catch(() => []),
    Review.find({ customerId: uid }).lean().catch(() => []),
    Subscription.findOne({ clerkId: userId }).lean().catch(() => null),
  ]);

  const additionalData: Record<string, unknown[]> = {};

  const optionalModels = [
    { key: 'messages',   model: 'Message',      query: { senderId: uid } },
    { key: 'inquiries',  model: 'VendorInquiry', query: { customerId: uid } },
  ];

  for (const { key, model, query } of optionalModels) {
    try {
      const m = mongoose.models[model];
      if (m) {
        const results = await m.find(query).lean();
        if (results.length > 0) additionalData[key] = results;
      }
    } catch {
      // skip
    }
  }

  return {
    exportedAt:    new Date().toISOString(),
    exportVersion: '1.0',
    profile:       sanitizeProfile(profile as Record<string, unknown> | null),
    projects:      (projects as unknown[]) || [],
    renders:       (renders  as unknown[]) || [],
    bookings:      (bookings as unknown[]) || [],
    reviews:       (reviews  as unknown[]) || [],
    subscription:  subscription || null,
    ...additionalData,
    _meta: {
      totalProjects: ((projects as unknown[]) || []).length,
      totalRenders:  ((renders  as unknown[]) || []).length,
      totalBookings: ((bookings as unknown[]) || []).length,
      totalReviews:  ((reviews  as unknown[]) || []).length,
    },
  };
}

function sanitizeProfile(profile: Record<string, unknown> | null) {
  if (!profile) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, otp, otpSecret, otpExpiry, resetToken, __v, ...safe } =
    profile as Record<string, unknown>;
  return safe;
}
