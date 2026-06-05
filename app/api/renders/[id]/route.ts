import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Render from "@/lib/db/models/Render";
import Project from "@/lib/db/models/Project";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getCurrentUser();
        if (!authUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        await connectToDatabase();

        const user = await User.findById(authUser.id).lean();
        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const render = await Render.findById(id);

        if (!render) {
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        // Ownership check — admin can see all, others only their own
        if (render.userId.toString() !== authUser.id && user.role !== 'admin') {
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        return NextResponse.json(render);
    } catch (error) {
        console.log("[RENDER_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getCurrentUser();
        if (!authUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        await connectToDatabase();

        const user = await User.findById(authUser.id).lean();
        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Fetch first to verify ownership before deleting
        const existing = await Render.findById(id);
        if (!existing) {
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        if (existing.userId.toString() !== authUser.id && user.role !== 'admin') {
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        const render = await Render.findByIdAndDelete(id);

        // Remove from project if associated
        if (render?.projectId) {
            await Project.findByIdAndUpdate(render.projectId, {
                $pull: { renders: id }
            });
        }

        return NextResponse.json(render);
    } catch (error) {
        console.log("[RENDER_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
