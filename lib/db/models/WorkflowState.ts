import mongoose, { Schema, Document, Model } from 'mongoose';

export type BookingStateId =
  // New workflow states
  | 'draft'
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'disputed'
  | 'refunded'
  // Existing Booking model status values (for backward compat)
  | 'pending_payment'
  | 'pending_designer'
  | 'confirmed'
  | 'cancelled_by_customer'
  | 'expired';

export interface IWorkflowState extends Document {
  stateId:      BookingStateId;
  label:        string;
  description:  string;
  color:        string;
  isInitial:    boolean;
  isFinal:      boolean;
  allowedRoles: string[];
  createdAt:    Date;
  updatedAt:    Date;
}

const WorkflowStateSchema = new Schema<IWorkflowState>({
  stateId:      { type: String, required: true, unique: true },
  label:        { type: String, required: true },
  description:  { type: String, required: true },
  color:        { type: String, default: '#6B7280' },
  isInitial:    { type: Boolean, default: false },
  isFinal:      { type: Boolean, default: false },
  allowedRoles: { type: [String], default: ['customer','designer','contractor','admin'] },
}, { timestamps: true });

const WorkflowState: Model<IWorkflowState> =
  mongoose.models.WorkflowState ||
  mongoose.model<IWorkflowState>('WorkflowState', WorkflowStateSchema);

export default WorkflowState;
