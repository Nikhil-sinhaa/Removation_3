import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

/**
 * POST /api/test/setup
 * Creates test users, a booking, project, and returns auth tokens.
 * Blocked in production. Protected by TEST_SECRET.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const secret = req.headers.get('x-test-secret');
  if (secret !== (process.env.TEST_SECRET || 'test_secret_local')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();

  // Force-register models by importing them
  const { User }     = await import('@/lib/db/models');
  const { Designer } = await import('@/lib/db/models');
  const { Booking }  = await import('@/lib/db/models');
  const { Project }  = await import('@/lib/db/models');

  const bcrypt = await import('bcryptjs');

  // ── Create test admin ──────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('TestAdmin123!', 10);
  const admin = await User.findOneAndUpdate(
    { email: 'admin@test.removation.ai' },
    {
      $set: {
        firstName:  'Test',
        lastName:   'Admin',
        email:      'admin@test.removation.ai',
        password:   adminHash,
        role:       'admin',
        isVerified: true,
        credits:    1000,
        subscription: { plan: 'pro', status: 'active', credits: 1000, creditsUsed: 0, cancelAtPeriodEnd: false },
      },
    },
    { upsert: true, new: true }
  );

  // ── Create test customer ───────────────────────────────────────────────────
  const userHash = await bcrypt.hash('TestUser123!', 10);
  const user = await User.findOneAndUpdate(
    { email: 'user@test.removation.ai' },
    {
      $set: {
        firstName:  'Test',
        lastName:   'User',
        email:      'user@test.removation.ai',
        password:   userHash,
        role:       'customer',
        isVerified: true,
        credits:    100,
        subscription: { plan: 'free', status: 'active', credits: 100, creditsUsed: 0, cancelAtPeriodEnd: false },
      },
    },
    { upsert: true, new: true }
  );

  // ── Create test designer user ──────────────────────────────────────────────
  const designerHash = await bcrypt.hash('TestDesigner123!', 10);
  const designerUser = await User.findOneAndUpdate(
    { email: 'designer@test.removation.ai' },
    {
      $set: {
        firstName:  'Test',
        lastName:   'Designer',
        email:      'designer@test.removation.ai',
        password:   designerHash,
        role:       'designer',
        isVerified: true,
        credits:    500,
        subscription: { plan: 'pro', status: 'active', credits: 500, creditsUsed: 0, cancelAtPeriodEnd: false },
      },
    },
    { upsert: true, new: true }
  );

  // ── Create designer profile ────────────────────────────────────────────────
  // Designer model requires: userId, displayName, phone, city
  let designerProfileId = String(designerUser._id);
  try {
    const designerProfile = await Designer.findOneAndUpdate(
      { userId: designerUser._id },
      {
        $setOnInsert: {
          userId:      designerUser._id,
          displayName: 'Test Designer',
          phone:       '+919999999999',
          city:        'Bangalore',
          bio:         'Test designer for automated tests.',
          specialties: ['minimalist'],
          isVerified:  true,
          isActive:    true,
          averageRating: 4.5,
          totalReviews:  10,
          consultationFee: { amount: 100000, currency: 'INR' },
          projectMinFee:   { amount: 500000, currency: 'INR' },
          consultationDurationMinutes: 60,
          acceptsConsultations: true,
          acceptsProjects:      true,
        },
      },
      { upsert: true, new: true }
    );
    designerProfileId = String(designerProfile._id);
  } catch (err) {
    console.error('[Test Setup] Designer profile error:', err);
    // Use the user ID as fallback so booking can still be created
  }

  // ── Create test project ────────────────────────────────────────────────────
  let projectId = '';
  try {
    const project = await Project.findOneAndUpdate(
      { userId: user._id, name: 'Test Project' },
      {
        $setOnInsert: {
          userId:      user._id,
          name:        'Test Project',
          description: 'Automated test project',
        },
      },
      { upsert: true, new: true }
    );
    projectId = String(project._id);
  } catch (err) {
    console.error('[Test Setup] Project error:', err);
  }

  // ── Create or reset booking ────────────────────────────────────────────────
  let bookingId = '';
  try {
    const now      = new Date();
    const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Try to find existing test booking
    let booking = await Booking.findOne({
      customerId: user._id,
      designerId: designerProfileId,
    });

    if (booking) {
      // Reset state so workflow tests always start from pending_designer
      await Booking.findByIdAndUpdate(
        booking._id,
        { $set: { status: 'pending_designer', updatedAt: new Date() } },
        { runValidators: false }
      );
      booking = await Booking.findById(booking._id);
    } else {
      booking = await Booking.create({
        customerId:               user._id,
        designerId:               designerProfileId,
        type:                     'project',
        amount:                   400000,
        currency:                 'INR',
        status:                   'pending_designer',
        projectDescription:       'Test booking for workflow engine tests (automated)',
        razorpayOrderId:          `test_order_${Date.now()}`,
        razorpayPaymentId:        `test_pay_${Date.now()}`,
        razorpaySignature:        'test_sig',
        paidAt:                   now,
        designerResponseDeadline: deadline,
        refundedAt:               null,
        refundId:                 null,
        designerAcceptedAt:       null,
        designerRejectedAt:       null,
        designerRejectionReason:  null,
        customerCancelledAt:      null,
        completedAt:              null,
        reviewId:                 null,
      });
    }
    bookingId = String(booking!._id);
  } catch (err) {
    console.error('[Test Setup] Booking error:', err);
  }

  // ── Issue JWT tokens (bypass login + rate limit) ───────────────────────────
  const jwtSecret = process.env.JWT_SECRET!;
  const makeToken = (id: string, email: string) =>
    jwt.sign({ id, email }, jwtSecret, { expiresIn: '1d' as const });

  const adminToken    = makeToken(String(admin._id),        admin.email);
  const userToken     = makeToken(String(user._id),         user.email);
  const designerToken = makeToken(String(designerUser._id), designerUser.email);

  return NextResponse.json({
    adminToken,
    userToken,
    designerToken,
    adminId:    String(admin._id),
    userId:     String(user._id),
    designerId: designerProfileId,
    bookingId,
    projectId,
  });
}
