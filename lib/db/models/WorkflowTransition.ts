import mongoose, { Schema, Document, Model } from 'mongoose';
import type { BookingStateId } from './WorkflowState';

export interface INotificationConfig {
  enabled:    boolean;
  recipients: ('customer' | 'provider' | 'admin')[];
  subject:    string;
  template:   string;
}

export interface IWorkflowTransition extends Document {
  transitionId:  string;
  label:         string;
  description:   string;
  fromStates:    BookingStateId[];
  toState:       BookingStateId;
  allowedRoles:  string[];
  conditions: {
    requiresPayment:   boolean;
    requiresMessage:   boolean;
    requiresRating:    boolean;
    minDaysSinceStart: number;
  };
  effects: {
    sendNotification:       boolean;
    notification:           INotificationConfig;
    createAuditLog:         boolean;
    releasePayment:         boolean;
    holdPayment:            boolean;
    refundPayment:          boolean;
    deductCredits:          boolean;
    incrementProviderStats: boolean;
  };
  enabled:   boolean;
  order:     number;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationConfigSchema = new Schema({
  enabled:    { type: Boolean, default: true },
  recipients: { type: [String], default: ['customer', 'provider'] },
  subject:    { type: String, default: '' },
  template:   { type: String, default: '' },
}, { _id: false });

const WorkflowTransitionSchema = new Schema<IWorkflowTransition>({
  transitionId:  { type: String, required: true, unique: true },
  label:         { type: String, required: true },
  description:   { type: String, required: true },
  fromStates:    { type: [String], required: true },
  toState:       { type: String, required: true },
  allowedRoles:  { type: [String], default: [] },
  conditions: {
    requiresPayment:   { type: Boolean, default: false },
    requiresMessage:   { type: Boolean, default: false },
    requiresRating:    { type: Boolean, default: false },
    minDaysSinceStart: { type: Number,  default: 0 },
  },
  effects: {
    sendNotification:       { type: Boolean, default: true },
    notification:           { type: NotificationConfigSchema },
    createAuditLog:         { type: Boolean, default: true },
    releasePayment:         { type: Boolean, default: false },
    holdPayment:            { type: Boolean, default: false },
    refundPayment:          { type: Boolean, default: false },
    deductCredits:          { type: Boolean, default: false },
    incrementProviderStats: { type: Boolean, default: false },
  },
  enabled: { type: Boolean, default: true },
  order:   { type: Number,  default: 0 },
}, { timestamps: true });

const WorkflowTransition: Model<IWorkflowTransition> =
  mongoose.models.WorkflowTransition ||
  mongoose.model<IWorkflowTransition>('WorkflowTransition', WorkflowTransitionSchema);

export default WorkflowTransition;
