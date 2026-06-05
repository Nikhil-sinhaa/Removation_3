import { connectToDatabase } from '@/lib/db/mongodb';
import Announcement from '@/lib/db/models/Announcement';
import mongoose from 'mongoose';

let seeded = false;

export async function seedDefaultAnnouncement() {
  if (seeded) return;
  seeded = true;

  await connectToDatabase();

  const count = await Announcement.countDocuments();
  if (count > 0) return;

  const User = mongoose.models['User'];
  if (!User) return;

  const admin = await User.findOne({ role: 'admin' }).lean() as { _id: unknown } | null;
  if (!admin) return;

  await Announcement.create({
    title:         'Welcome to Removation.ai!',
    message:       'AI-powered interior design is now live. Try Dream Room to redesign your space instantly.',
    type:          'success',
    icon:          '🎉',
    target:        'all',
    ctaLabel:      'Try Dream Room',
    ctaUrl:        '/dream-room',
    isDismissable: true,
    isActive:      true,
    startsAt:      new Date(),
    createdBy:     admin._id,
  });

  console.log('[Announcements] Default welcome announcement seeded');
}
