import { NextResponse } from "next/server";
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Project from "@/lib/db/models/Project";

export async function POST(req: Request) {
    try {
        const authUser = await getCurrentUser();
  const userId = authUser?.id;
        const body = await req.json();
        const { name, description, roomType, style } = body;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        await connectToDatabase();

        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const project = await Project.create({
            userId: user._id,
            name,
            description,
            roomType,
            style,
            lastActivity: new Date(),
        });

        return NextResponse.json(project);
    } catch (error) {
        console.log("[PROJECTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const authUser = await getCurrentUser();
  const userId = authUser?.id;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await connectToDatabase();

        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const projects = await Project.find({ userId: user._id })
            .sort({ lastActivity: -1 });

        return NextResponse.json(projects);
    } catch (error) {
        console.log("[PROJECTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
