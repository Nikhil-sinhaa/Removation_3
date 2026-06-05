import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';
import WorkflowTransition, { IWorkflowTransition } from '@/lib/db/models/WorkflowTransition';
import WorkflowEvent from '@/lib/db/models/WorkflowEvent';
import type { BookingStateId } from '@/lib/db/models/WorkflowState';
import type { NextRequest } from 'next/server';

export interface TransitionContext {
  bookingId: string;
  transitionId: string;
  triggeredById: string;
  triggeredByRole: string;
  triggeredByEmail?: string;
  triggeredByName?: string;
  message?: string;
  rating?: number;
  metadata?: Record<string, unknown>;
  req?: NextRequest;
}

export interface TransitionResult {
  success: boolean;
  booking?: Record<string, unknown>;
  error?: string;
  newState?: BookingStateId;
  effects?: string[];
}

/**
 * The core workflow engine.
 * Validates, executes, and logs booking state transitions.
 */
export async function executeTransition(ctx: TransitionContext): Promise<TransitionResult> {
  await connectToDatabase();

  const BookingModel = mongoose.models['Booking'];
  if (!BookingModel) return { success: false, error: 'Booking model not found' };

  const booking = await BookingModel.findById(ctx.bookingId);
  if (!booking) return { success: false, error: 'Booking not found' };

  const currentState = booking.status as BookingStateId;

  const transition = await WorkflowTransition.findOne({
    transitionId: ctx.transitionId,
    enabled: true,
  });

  if (!transition) {
    return { success: false, error: `Transition '${ctx.transitionId}' not found or disabled` };
  }

  // Validate: is this transition valid from current state?
  if (!transition.fromStates.includes(currentState)) {
    return {
      success: false,
      error: `Cannot '${transition.label}' a booking in state '${currentState}'. ` +
        `Valid from: ${transition.fromStates.join(', ')}`,
    };
  }

  // Validate: role permission
  if (
    transition.allowedRoles.length > 0 &&
    !transition.allowedRoles.includes(ctx.triggeredByRole)
  ) {
    return {
      success: false,
      error: `Role '${ctx.triggeredByRole}' cannot perform '${transition.label}'`,
    };
  }

  // Check conditions
  const conditionError = checkConditions(transition, ctx, booking);
  if (conditionError) return { success: false, error: conditionError };

  // Execute — update booking status (bypass enum validation using findByIdAndUpdate)
  const previousState = booking.status as BookingStateId;
  await BookingModel.findByIdAndUpdate(
    ctx.bookingId,
    { $set: { status: transition.toState, updatedAt: new Date() } },
    { runValidators: false }
  );

  // Reload updated booking
  const updatedBooking = await BookingModel.findById(ctx.bookingId).lean();

  // Log workflow event
  await WorkflowEvent.create({
    bookingId: new mongoose.Types.ObjectId(ctx.bookingId),
    transitionId: ctx.transitionId,
    fromState: previousState,
    toState: transition.toState,
    triggeredBy: new mongoose.Types.ObjectId(ctx.triggeredById),
    triggeredByRole: ctx.triggeredByRole,
    message: ctx.message,
    metadata: ctx.metadata,
    createdAt: new Date(),
  });

  // Fire side effects (all non-blocking)
  const firedEffects: string[] = [];
  await fireEffects(transition, ctx, updatedBooking as Record<string, unknown>, firedEffects);

  return {
    success: true,
    booking: updatedBooking as Record<string, unknown>,
    newState: transition.toState,
    effects: firedEffects,
  };
}

// ─── Condition checker ────────────────────────────────────────────────────────

function checkConditions(
  transition: IWorkflowTransition,
  ctx: TransitionContext,
  booking: Record<string, unknown>
): string | null {
  const { conditions } = transition;

  if (conditions.requiresMessage && !ctx.message?.trim()) {
    return `A reason is required for '${transition.label}'`;
  }

  if (conditions.requiresRating && !ctx.rating) {
    return 'A rating is required to complete this booking';
  }

  if (conditions.requiresPayment && !(booking as { razorpayPaymentId?: string }).razorpayPaymentId) {
    return 'Payment must be verified before this action';
  }

  if (conditions.minDaysSinceStart > 0) {
    const startedAt = (booking as { designerAcceptedAt?: Date }).designerAcceptedAt;
    if (startedAt) {
      const daysSince = (Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < conditions.minDaysSinceStart) {
        return `Must wait ${conditions.minDaysSinceStart} days before this action`;
      }
    }
  }

  return null;
}

// ─── Effects executor ─────────────────────────────────────────────────────────

async function fireEffects(
  transition: IWorkflowTransition,
  ctx: TransitionContext,
  booking: Record<string, unknown>,
  fired: string[]
): Promise<void> {
  const { effects } = transition;

  // Email notification
  if (effects.sendNotification && effects.notification?.enabled) {
    try {
      await sendWorkflowNotification(transition, ctx, booking);
      fired.push('notification');
    } catch (err) {
      console.error('[Workflow] Notification failed:', err);
    }
  }

  // Payment effects
  if (effects.releasePayment) {
    try {
      console.log(`[Workflow] Payment release for booking ${ctx.bookingId} — TODO: integrate Razorpay`);
      fired.push('payment_release_logged');
    } catch (err) {
      console.error('[Workflow] Payment release failed:', err);
    }
  }

  if (effects.refundPayment) {
    try {
      console.log(`[Workflow] Refund for booking ${ctx.bookingId} — TODO: integrate Razorpay`);
      fired.push('refund_logged');
    } catch (err) {
      console.error('[Workflow] Refund failed:', err);
    }
  }

  // Provider stats
  if (effects.incrementProviderStats) {
    try {
      const bid = booking as { designerId?: string; contractorId?: string };
      const providerId = bid.designerId || bid.contractorId;
      if (providerId) {
        const Designer = mongoose.models['Designer'];
        const Contractor = mongoose.models['Contractor'];
        const model = bid.designerId ? Designer : Contractor;
        if (model) {
          await model.findByIdAndUpdate(providerId, { $inc: { completedBookings: 1 } });
          fired.push('provider_stats_updated');
        }
      }
    } catch { /* non-blocking */ }
  }
}

// ─── Notification ────────────────────────────────────────────────────────────

async function sendWorkflowNotification(
  transition: IWorkflowTransition,
  ctx: TransitionContext,
  booking: Record<string, unknown>
): Promise<void> {
  const { notification } = transition.effects;
  const UserModel = mongoose.models['User'];
  if (!UserModel) return;

  const bid = booking as {
    customerId?: string;
    designerId?: string;
    contractorId?: string;
  };

  const recipients: { email: string; name: string }[] = [];

  if (notification.recipients.includes('customer') && bid.customerId) {
    const u = await UserModel.findById(bid.customerId).lean() as { email?: string; firstName?: string; lastName?: string } | null;
    if (u?.email) recipients.push({ email: u.email, name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Customer' });
  }

  if (notification.recipients.includes('provider')) {
    const providerId = bid.designerId || bid.contractorId;
    if (providerId) {
      const u = await UserModel.findOne({
        $or: [
          { 'designerProfile._id': providerId },
          { '_id': providerId },
        ]
      }).lean() as { email?: string; firstName?: string; lastName?: string } | null;
      if (u?.email) recipients.push({ email: u.email, name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Provider' });
    }
  }

  const html = buildEmailHtml(notification.template, ctx, booking);

  for (const r of recipients) {
    await sendEmail({ to: r.email, subject: notification.subject, html });
  }
}

async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Removation.ai <noreply@removation.ai>',
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      return;
    } catch (err) {
      console.error('[Workflow Email] Resend failed:', err);
    }
  }
  // Fallback
  console.log(`[Workflow Email] To: ${params.to} | Subject: ${params.subject}`);
}

function buildEmailHtml(template: string, ctx: TransitionContext, booking: Record<string, unknown>): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const bodies: Record<string, string> = {
    'booking.submitted': `A new booking request has been received. Booking ID: ${ctx.bookingId}`,
    'booking.accepted': `Great news! Your booking has been accepted. The provider will start work soon.`,
    'booking.rejected': `Your booking was declined.${ctx.message ? ` Reason: ${ctx.message}` : ''} Any payment will be refunded.`,
    'booking.started': `Work has started on your project. You will be notified when it is ready for review.`,
    'booking.review': `Your project is ready for review! Please log in to approve or request revisions.`,
    'booking.completed': `The booking has been completed and payment has been released. Thank you!`,
    'booking.cancelled': `Your booking has been cancelled.${ctx.message ? ` Reason: ${ctx.message}` : ''}`,
    'booking.disputed': `A dispute has been raised on booking ${ctx.bookingId}. Our team will review within 24 hours.`,
    'booking.dispute_resolved': `The dispute on your booking has been resolved.${ctx.message ? ` ${ctx.message}` : ''}`,
    'booking.refunded': `Your refund has been processed. It may take 3–5 business days to appear.`,
    'booking.revision_requested': `The customer has requested revisions.${ctx.message ? ` Message: ${ctx.message}` : ''}`,
  };

  const body = bodies[template] || `Booking ${ctx.bookingId} updated.`;

  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <div style="background:#6B21A8;padding:20px;border-radius:8px 8px 0 0">
      <h1 style="color:white;margin:0;font-size:20px">Removation.ai</h1>
    </div>
    <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
      <p style="color:#374151;line-height:1.6">${body}</p>
      <a href="${appUrl}/my-bookings" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#6B21A8;color:white;border-radius:6px;text-decoration:none">View Booking</a>
    </div>
  </body></html>`;
}
