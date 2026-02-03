import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Render from "@/lib/db/models/Render";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const body = await req.json();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await connectToDatabase();

        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const render = await Render.create({
            userId: user._id,
            clerkId: userId,
            ...body,
            status: 'queued',
            createdAt: new Date(),
        });

        return NextResponse.json(render);
    } catch (error) {
        console.log("[RENDERS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await connectToDatabase();

        const renders = await Render.find({ clerkId: userId })
            .sort({ createdAt: -1 });

        return NextResponse.json(renders);
    } catch (error) {
        console.log("[RENDERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
