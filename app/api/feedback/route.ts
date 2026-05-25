import { NextResponse } from 'next/server';
import { connectDB } from '@/src/lib/mongodb';
import mongoose from 'mongoose';

// Inline schema — no separate model file needed
const FeedbackSchema = new mongoose.Schema({
  projectId:  { type: String, required: true },
  feature:    { type: String, required: true },
  rating:     { type: Number, min: 1, max: 5, required: true },
  comment:    { type: String, default: '' },
  createdAt:  { type: Date, default: Date.now },
});

const Feedback = mongoose.models.Feedback ||
  mongoose.model('Feedback', FeedbackSchema);

export async function POST(req: Request) {
  await connectDB();

  try {
    const { projectId, feature, rating, comment } = await req.json();

    if (!projectId || !feature || !rating) {
      return NextResponse.json(
        { error: 'projectId, feature, rating required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be 1-5' },
        { status: 400 }
      );
    }

    const doc = await Feedback.create({ projectId, feature, rating, comment });

    return NextResponse.json({ success: true, feedback: doc });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
