import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { requireRole } from '@/lib/auth/requireRole';
import WorkflowState from '@/lib/db/models/WorkflowState';
import WorkflowTransition from '@/lib/db/models/WorkflowTransition';
import WorkflowEvent from '@/lib/db/models/WorkflowEvent';
import { seedWorkflow } from '@/lib/workflow/defaultWorkflow';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  await seedWorkflow();
  await connectToDatabase();

  const [states, transitions, totalEvents] = await Promise.all([
    WorkflowState.find().sort({ isInitial: -1, isFinal: 1, stateId: 1 }).lean(),
    WorkflowTransition.find().sort({ order: 1 }).lean(),
    WorkflowEvent.countDocuments(),
  ]);

  return NextResponse.json({ states, transitions, stats: { totalEvents } });
}
