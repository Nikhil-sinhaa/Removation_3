import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Project from "@/lib/db/models/Project";
import Render from "@/lib/db/models/Render";

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

        const project = await Project.findById(id);

        if (!project) {
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        // Ownership check — admin can see all, others only their own
        if (project.userId.toString() !== authUser.id && user.role !== 'admin') {
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        return NextResponse.json(project);
    } catch (error) {
        console.log("[PROJECT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getCurrentUser();
        if (!authUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        await connectToDatabase();

        const user = await User.findById(authUser.id).lean();
        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Fetch first to verify ownership before updating
        const existing = await Project.findById(id);
        if (!existing) {
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        if (existing.userId.toString() !== authUser.id && user.role !== 'admin') {
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        const project = await Project.findByIdAndUpdate(
            id,
            { ...body, updatedAt: new Date() },
            { new: true }
        );

        return NextResponse.json(project);
    } catch (error) {
        console.log("[PROJECT_PATCH]", error);
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
        const existing = await Project.findById(id);
        if (!existing) {
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        if (existing.userId.toString() !== authUser.id && user.role !== 'admin') {
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        const project = await Project.findByIdAndDelete(id);

        // Cleanup associated renders
        await Render.deleteMany({ projectId: id });

        return NextResponse.json(project);
    } catch (error) {
        console.log("[PROJECT_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
