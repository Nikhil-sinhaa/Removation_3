// app/api/contractor/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Contractor } from '@/lib/db/models/Contractor';

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireRole(req, ['customer', 'contractor', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { user } = authResult;
        const userId = user._id;

        await connectToDatabase();

        const contractor = await Contractor.findOne({ userId });

        if (!contractor) {
            return NextResponse.json({ message: 'Contractor profile not found' }, { status: 404 });
        }

        return NextResponse.json({ contractor }, { status: 200 });
    } catch (error) {
        console.error('Get contractor profile error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

const MIN_FEE_PAISE = 0;
const MAX_FEE_PAISE = 10_000_000;
const MIN_DURATION_MINUTES = 15;
const MAX_DURATION_MINUTES = 240;

export async function PATCH(req: NextRequest) {
    try {
        const authResult = await requireRole(req, ['contractor']);
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        let body: Record<string, unknown>;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
        }

        await connectToDatabase();

        const contractor = await Contractor.findOne({ userId: user._id });
        if (!contractor) {
            return NextResponse.json({ message: 'Contractor profile not found' }, { status: 404 });
        }

        const errors: string[] = [];

        // consultationFee.amount
        if (body.consultationFee !== undefined) {
            const cf = body.consultationFee as any;
            if (typeof cf?.amount !== 'number') {
                errors.push('consultationFee.amount must be a number');
            } else if (cf.amount < MIN_FEE_PAISE || cf.amount > MAX_FEE_PAISE) {
                errors.push(`consultationFee.amount must be between ${MIN_FEE_PAISE} and ${MAX_FEE_PAISE} paise`);
            } else if (!Number.isInteger(cf.amount)) {
                errors.push('consultationFee.amount must be an integer (paise, no decimals)');
            } else {
                contractor.consultationFee = {
                    amount: cf.amount,
                    currency: 'INR',
                };
            }
        }

        // projectMinFee.amount
        if (body.projectMinFee !== undefined) {
            const pf = body.projectMinFee as any;
            if (typeof pf?.amount !== 'number') {
                errors.push('projectMinFee.amount must be a number');
            } else if (pf.amount < MIN_FEE_PAISE || pf.amount > MAX_FEE_PAISE) {
                errors.push(`projectMinFee.amount must be between ${MIN_FEE_PAISE} and ${MAX_FEE_PAISE} paise`);
            } else if (!Number.isInteger(pf.amount)) {
                errors.push('projectMinFee.amount must be an integer (paise, no decimals)');
            } else {
                contractor.projectMinFee = {
                    amount: pf.amount,
                    currency: 'INR',
                };
            }
        }

        // acceptsConsultations
        if (body.acceptsConsultations !== undefined) {
            if (typeof body.acceptsConsultations !== 'boolean') {
                errors.push('acceptsConsultations must be a boolean');
            } else {
                contractor.acceptsConsultations = body.acceptsConsultations;
            }
        }

        // acceptsProjects
        if (body.acceptsProjects !== undefined) {
            if (typeof body.acceptsProjects !== 'boolean') {
                errors.push('acceptsProjects must be a boolean');
            } else {
                contractor.acceptsProjects = body.acceptsProjects;
            }
        }

        // consultationDurationMinutes
        if (body.consultationDurationMinutes !== undefined) {
            const dur = body.consultationDurationMinutes;
            if (typeof dur !== 'number' || !Number.isInteger(dur)) {
                errors.push('consultationDurationMinutes must be an integer');
            } else if (dur < MIN_DURATION_MINUTES || dur > MAX_DURATION_MINUTES) {
                errors.push(`consultationDurationMinutes must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES}`);
            } else {
                contractor.consultationDurationMinutes = dur;
            }
        }

        if (errors.length > 0) {
            return NextResponse.json({ message: errors[0], errors }, { status: 400 });
        }

        await contractor.save();

        return NextResponse.json({
            success: true,
            contractor: {
                consultationFee: contractor.consultationFee,
                projectMinFee: contractor.projectMinFee,
                acceptsConsultations: contractor.acceptsConsultations,
                acceptsProjects: contractor.acceptsProjects,
                consultationDurationMinutes: contractor.consultationDurationMinutes,
            },
        });
    } catch (error) {
        console.error('[contractor/me] PATCH error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
