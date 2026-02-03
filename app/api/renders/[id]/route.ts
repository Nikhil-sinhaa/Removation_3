import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Render from "@/lib/db/models/Render";
import Project from "@/lib/db/models/Project";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        const { id } = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await connectToDatabase();

        const render = await Render.findOne({ _id: id });

        if (!render) {
            return new NextResponse("Render not found", { status: 404 });
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
        const { userId } = await auth();
        const { id } = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await connectToDatabase();

        const render = await Render.findOneAndDelete({ _id: id });

        if (!render) {
            return new NextResponse("Render not found", { status: 404 });
        }

        // Remove from project if associated
        if (render.projectId) {
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
