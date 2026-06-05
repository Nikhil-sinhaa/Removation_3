import { connectToDatabase } from '@/lib/db/mongodb';
import WorkflowState from '@/lib/db/models/WorkflowState';
import WorkflowTransition from '@/lib/db/models/WorkflowTransition';

let seeded = false;

export async function seedWorkflow() {
  if (seeded) return;
  seeded = true;

  await connectToDatabase();

  // ── States ────────────────────────────────────────────────────────────────
  const states = [
    { stateId: 'draft',         label: 'Draft',         description: 'Booking created but not yet submitted',          color: '#9CA3AF', isInitial: true,  isFinal: false, allowedRoles: ['customer','admin'] },
    { stateId: 'pending',       label: 'Pending',       description: 'Awaiting provider response',                     color: '#F59E0B', isInitial: false, isFinal: false, allowedRoles: ['customer','designer','contractor','admin'] },
    { stateId: 'accepted',      label: 'Accepted',      description: 'Provider has accepted the booking',              color: '#3B82F6', isInitial: false, isFinal: false, allowedRoles: ['customer','designer','contractor','admin'] },
    { stateId: 'in_progress',   label: 'In Progress',   description: 'Work is underway',                               color: '#8B5CF6', isInitial: false, isFinal: false, allowedRoles: ['customer','designer','contractor','admin'] },
    { stateId: 'review',        label: 'Under Review',  description: 'Work submitted, awaiting customer approval',     color: '#06B6D4', isInitial: false, isFinal: false, allowedRoles: ['customer','designer','contractor','admin'] },
    { stateId: 'completed',     label: 'Completed',     description: 'Booking completed and payment released',         color: '#10B981', isInitial: false, isFinal: true,  allowedRoles: ['customer','designer','contractor','admin'] },
    { stateId: 'rejected',      label: 'Rejected',      description: 'Provider declined the booking',                 color: '#EF4444', isInitial: false, isFinal: true,  allowedRoles: ['customer','designer','contractor','admin'] },
    { stateId: 'cancelled',     label: 'Cancelled',     description: 'Booking cancelled by customer or admin',        color: '#6B7280', isInitial: false, isFinal: true,  allowedRoles: ['customer','designer','contractor','admin'] },
    { stateId: 'disputed',      label: 'Disputed',      description: 'Payment or quality dispute in progress',        color: '#DC2626', isInitial: false, isFinal: false, allowedRoles: ['customer','designer','contractor','admin'] },
    { stateId: 'refunded',      label: 'Refunded',      description: 'Payment has been refunded',                     color: '#7C3AED', isInitial: false, isFinal: true,  allowedRoles: ['customer','designer','contractor','admin'] },
    // Existing status values
    { stateId: 'pending_designer', label: 'Pending Designer', description: 'Waiting for designer acceptance', color: '#F59E0B', isInitial: false, isFinal: false, allowedRoles: ['customer','designer','contractor','admin'] },
    { stateId: 'confirmed',     label: 'Confirmed',     description: 'Designer confirmed the booking',                color: '#3B82F6', isInitial: false, isFinal: false, allowedRoles: ['customer','designer','contractor','admin'] },
  ];

  for (const state of states) {
    await WorkflowState.findOneAndUpdate(
      { stateId: state.stateId },
      { $setOnInsert: state },
      { upsert: true, new: true }
    );
  }

  // ── Transitions ───────────────────────────────────────────────────────────
  const transitions = [
    {
      transitionId: 'submit',
      label: 'Submit Booking',
      description: 'Customer submits booking to provider',
      fromStates: ['draft', 'pending_payment'],
      toState: 'pending_designer',
      allowedRoles: ['customer', 'admin'],
      order: 1,
      conditions: { requiresPayment: false, requiresMessage: false, requiresRating: false, minDaysSinceStart: 0 },
      effects: { sendNotification: true, notification: { enabled: true, recipients: ['provider', 'customer'], subject: 'New booking request received', template: 'booking.submitted' }, createAuditLog: true, releasePayment: false, holdPayment: true, refundPayment: false, deductCredits: false, incrementProviderStats: false },
    },
    {
      transitionId: 'accept',
      label: 'Accept Booking',
      description: 'Provider accepts the booking request',
      fromStates: ['pending_designer', 'pending'],
      toState: 'confirmed',
      allowedRoles: ['designer', 'contractor', 'admin'],
      order: 2,
      conditions: { requiresPayment: false, requiresMessage: false, requiresRating: false, minDaysSinceStart: 0 },
      effects: { sendNotification: true, notification: { enabled: true, recipients: ['customer'], subject: 'Your booking has been accepted! 🎉', template: 'booking.accepted' }, createAuditLog: true, releasePayment: false, holdPayment: false, refundPayment: false, deductCredits: false, incrementProviderStats: false },
    },
    {
      transitionId: 'reject',
      label: 'Reject Booking',
      description: 'Provider rejects the booking request',
      fromStates: ['pending_designer', 'pending'],
      toState: 'rejected',
      allowedRoles: ['designer', 'contractor', 'admin'],
      order: 3,
      conditions: { requiresPayment: false, requiresMessage: true, requiresRating: false, minDaysSinceStart: 0 },
      effects: { sendNotification: true, notification: { enabled: true, recipients: ['customer'], subject: 'Update on your booking request', template: 'booking.rejected' }, createAuditLog: true, releasePayment: false, holdPayment: false, refundPayment: true, deductCredits: false, incrementProviderStats: false },
    },
    {
      transitionId: 'start_work',
      label: 'Start Work',
      description: 'Provider starts working on the project',
      fromStates: ['confirmed', 'accepted'],
      toState: 'in_progress',
      allowedRoles: ['designer', 'contractor', 'admin'],
      order: 4,
      conditions: { requiresPayment: false, requiresMessage: false, requiresRating: false, minDaysSinceStart: 0 },
      effects: { sendNotification: true, notification: { enabled: true, recipients: ['customer'], subject: 'Work has started on your project', template: 'booking.started' }, createAuditLog: true, releasePayment: false, holdPayment: false, refundPayment: false, deductCredits: false, incrementProviderStats: false },
    },
    {
      transitionId: 'submit_for_review',
      label: 'Submit for Review',
      description: 'Provider submits completed work for customer review',
      fromStates: ['in_progress'],
      toState: 'review',
      allowedRoles: ['designer', 'contractor', 'admin'],
      order: 5,
      conditions: { requiresPayment: false, requiresMessage: false, requiresRating: false, minDaysSinceStart: 0 },
      effects: { sendNotification: true, notification: { enabled: true, recipients: ['customer'], subject: 'Your project is ready for review', template: 'booking.review' }, createAuditLog: true, releasePayment: false, holdPayment: false, refundPayment: false, deductCredits: false, incrementProviderStats: false },
    },
    {
      transitionId: 'approve',
      label: 'Approve & Complete',
      description: 'Customer approves the work and releases payment',
      fromStates: ['review', 'confirmed'],
      toState: 'completed',
      allowedRoles: ['customer', 'admin'],
      order: 6,
      conditions: { requiresPayment: false, requiresMessage: false, requiresRating: false, minDaysSinceStart: 0 },
      effects: { sendNotification: true, notification: { enabled: true, recipients: ['provider', 'customer'], subject: 'Booking completed — payment released', template: 'booking.completed' }, createAuditLog: true, releasePayment: true, holdPayment: false, refundPayment: false, deductCredits: false, incrementProviderStats: true },
    },
    {
      transitionId: 'request_revision',
      label: 'Request Revision',
      description: 'Customer requests changes before approving',
      fromStates: ['review'],
      toState: 'in_progress',
      allowedRoles: ['customer', 'admin'],
      order: 7,
      conditions: { requiresPayment: false, requiresMessage: true, requiresRating: false, minDaysSinceStart: 0 },
      effects: { sendNotification: true, notification: { enabled: true, recipients: ['provider'], subject: 'Revision requested on your project', template: 'booking.revision_requested' }, createAuditLog: true, releasePayment: false, holdPayment: false, refundPayment: false, deductCredits: false, incrementProviderStats: false },
    },
    {
      transitionId: 'cancel',
      label: 'Cancel Booking',
      description: 'Customer or admin cancels the booking',
      fromStates: ['pending_designer', 'pending', 'confirmed', 'accepted', 'in_progress'],
      toState: 'cancelled_by_customer',
      allowedRoles: ['customer', 'admin'],
      order: 8,
      conditions: { requiresPayment: false, requiresMessage: true, requiresRating: false, minDaysSinceStart: 0 },
      effects: { sendNotification: true, notification: { enabled: true, recipients: ['provider', 'customer'], subject: 'Booking has been cancelled', template: 'booking.cancelled' }, createAuditLog: true, releasePayment: false, holdPayment: false, refundPayment: true, deductCredits: false, incrementProviderStats: false },
    },
    {
      transitionId: 'raise_dispute',
      label: 'Raise Dispute',
      description: 'Customer raises a quality or payment dispute',
      fromStates: ['review', 'completed'],
      toState: 'disputed',
      allowedRoles: ['customer', 'admin'],
      order: 9,
      conditions: { requiresPayment: false, requiresMessage: true, requiresRating: false, minDaysSinceStart: 0 },
      effects: { sendNotification: true, notification: { enabled: true, recipients: ['provider', 'customer', 'admin'], subject: 'Dispute raised — admin review required', template: 'booking.disputed' }, createAuditLog: true, releasePayment: false, holdPayment: false, refundPayment: false, deductCredits: false, incrementProviderStats: false },
    },
    {
      transitionId: 'resolve_dispute',
      label: 'Resolve Dispute',
      description: 'Admin resolves the dispute',
      fromStates: ['disputed'],
      toState: 'completed',
      allowedRoles: ['admin'],
      order: 10,
      conditions: { requiresPayment: false, requiresMessage: true, requiresRating: false, minDaysSinceStart: 0 },
      effects: { sendNotification: true, notification: { enabled: true, recipients: ['provider', 'customer'], subject: 'Your dispute has been resolved', template: 'booking.dispute_resolved' }, createAuditLog: true, releasePayment: true, holdPayment: false, refundPayment: false, deductCredits: false, incrementProviderStats: false },
    },
    {
      transitionId: 'refund',
      label: 'Issue Refund',
      description: 'Admin issues a refund and closes booking',
      fromStates: ['disputed', 'cancelled_by_customer', 'rejected'],
      toState: 'refunded',
      allowedRoles: ['admin'],
      order: 11,
      conditions: { requiresPayment: false, requiresMessage: true, requiresRating: false, minDaysSinceStart: 0 },
      effects: { sendNotification: true, notification: { enabled: true, recipients: ['customer'], subject: 'Your refund has been processed', template: 'booking.refunded' }, createAuditLog: true, releasePayment: false, holdPayment: false, refundPayment: true, deductCredits: false, incrementProviderStats: false },
    },
  ];

  for (const transition of transitions) {
    await WorkflowTransition.findOneAndUpdate(
      { transitionId: transition.transitionId },
      { $setOnInsert: transition },
      { upsert: true, new: true }
    );
  }

  console.log('[Workflow] States and transitions seeded');
}
