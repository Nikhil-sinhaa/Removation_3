import mongoose, { Schema, Document, Model } from 'mongoose';
import type { BookingStateId } from './WorkflowState';

export interface IWorkflowEvent extends Document {
  bookingId:       mongoose.Types.ObjectId;
  transitionId:    string;
  fromState:       BookingStateId;
  toState:         BookingStateId;
  triggeredBy:     mongoose.Types.ObjectId;
  triggeredByRole: string;
  message?:        string;
  metadata?:       Record<string, unknown>;
  createdAt:       Date;
}

const WorkflowEventSchema = new Schema<IWorkflowEvent>({
  bookingId:       { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  transitionId:    { type: String, required: true },
  fromState:       { type: String, required: true },
  toState:         { type: String, required: true },
  triggeredBy:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  triggeredByRole: { type: String, required: true },
  message:         { type: String },
  metadata:        { type: Schema.Types.Mixed },
  createdAt:       { type: Date, default: Date.now, index: true },
}, { timestamps: false });

WorkflowEventSchema.index({ bookingId: 1, createdAt: -1 });

const WorkflowEvent: Model<IWorkflowEvent> =
  mongoose.models.WorkflowEvent ||
  mongoose.model<IWorkflowEvent>('WorkflowEvent', WorkflowEventSchema);

export default WorkflowEvent;
