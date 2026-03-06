import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from "@/lib/db/mongodb";
import Project from "@/lib/db/models/Project";
import Render from "@/lib/db/models/Render";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getCurrentUser();
  const userId = authUser?.id;
        const { id } = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await connectToDatabase();

        const project = await Project.findOne({ _id: id });

        if (!project) {
            return new NextResponse("Project not found", { status: 404 });
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
  const userId = authUser?.id;
        const { id } = await params;
        const body = await request.json();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await connectToDatabase();

        const project = await Project.findOneAndUpdate(
            { _id: id },
            { ...body, updatedAt: new Date() },
            { new: true }
        );

        if (!project) {
            return new NextResponse("Project not found", { status: 404 });
        }

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
  const userId = authUser?.id;
        const { id } = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await connectToDatabase();

        const project = await Project.findOneAndDelete({ _id: id });

        if (!project) {
            return new NextResponse("Project not found", { status: 404 });
        }

        // Cleanup associated renders
        await Render.deleteMany({ projectId: id });

        return NextResponse.json(project);
    } catch (error) {
        console.log("[PROJECT_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
