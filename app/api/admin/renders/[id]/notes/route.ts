// app/api/admin/renders/[id]/notes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Render } from '@/lib/db/models/Render';
import { Types } from 'mongoose';

// ── helpers ──────────────────────────────────────────────────────────────────

const getAuthorName = (user: { firstName?: string; lastName?: string; email: string }): string => {
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
};

// ── GET /api/admin/renders/[id]/notes ────────────────────────────────────────
// Returns the adminNotes array plus minimal render header context.

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await requireRole(req, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid render ID' }, { status: 400 });
    }

    await connectToDatabase();

    const render = await Render.findById(id)
        .select('adminNotes userId featureType createdAt')
        .lean();

    if (!render) {
        return NextResponse.json({ message: 'Render not found' }, { status: 404 });
    }

    return NextResponse.json({ adminNotes: render.adminNotes ?? [] });
}

// ── POST /api/admin/renders/[id]/notes ───────────────────────────────────────
// Appends a new note. Returns updated adminNotes array.

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await requireRole(req, ['admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid render ID' }, { status: 400 });
    }

    let body: { text?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    const text = (body.text ?? '').trim();
    if (!text) {
        return NextResponse.json({ message: 'Note text must not be empty' }, { status: 400 });
    }
    if (text.length > 2000) {
        return NextResponse.json({ message: 'Note must be 2000 characters or fewer' }, { status: 400 });
    }

    await connectToDatabase();

    const render = await Render.findById(id);
    if (!render) {
        return NextResponse.json({ message: 'Render not found' }, { status: 404 });
    }

    const newNote = {
        _id: new Types.ObjectId(),
        authorId: user._id,
        authorName: getAuthorName(user as any),
        text,
        createdAt: new Date(),
    };

    render.adminNotes = [...(render.adminNotes ?? []), newNote as any];
    await render.save();

    return NextResponse.json({ adminNotes: render.adminNotes }, { status: 201 });
}

// ── DELETE /api/admin/renders/[id]/notes?noteId=<id> ─────────────────────────
// Only the note's original author may delete it.

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await requireRole(req, ['admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid render ID' }, { status: 400 });
    }

    const noteId = req.nextUrl.searchParams.get('noteId');
    if (!noteId || !Types.ObjectId.isValid(noteId)) {
        return NextResponse.json({ message: 'Invalid or missing noteId' }, { status: 400 });
    }

    await connectToDatabase();

    const render = await Render.findById(id);
    if (!render) {
        return NextResponse.json({ message: 'Render not found' }, { status: 404 });
    }

    const noteIndex = (render.adminNotes ?? []).findIndex(
        (n: any) => n._id.toString() === noteId,
    );

    if (noteIndex === -1) {
        return NextResponse.json({ message: 'Note not found' }, { status: 404 });
    }

    const note = (render.adminNotes as any)[noteIndex];

    // Enforce own-note-only deletion — preserves audit trail
    if (note.authorId.toString() !== user._id.toString()) {
        return NextResponse.json(
            { message: 'You can only delete your own notes' },
            { status: 403 },
        );
    }

    (render.adminNotes as any).splice(noteIndex, 1);
    await render.save();

    return NextResponse.json({ adminNotes: render.adminNotes });
}

