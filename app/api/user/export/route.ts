// app/api/user/export/route.ts
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Render from "@/lib/db/models/Render";
import Project from "@/lib/db/models/Project";

/**
 * POST /api/user/export
 * Assembles the user's full account data (profile, projects, renders, credit history)
 * into a JSON response delivered as a downloadable file.
 */
export async function POST() {
    try {
        const { userId } = await auth();
        const clerkUser = await currentUser();

        if (!userId || !clerkUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await connectToDatabase();

        const [dbUser, projects, renders] = await Promise.all([
            User.findOne({ clerkId: userId }).lean(),
            Project.find({ userId }).lean(),
            Render.find({ userId }).lean(),
        ]);

        const exportData = {
            exportedAt: new Date().toISOString(),
            profile: {
                id: userId,
                email: clerkUser.emailAddresses[0]?.emailAddress,
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName,
                createdAt: clerkUser.createdAt,
            },
            subscription: (dbUser as any)?.subscription ?? null,
            credits: (dbUser as any)?.credits ?? 0,
            creditHistory: (dbUser as any)?.creditHistory ?? [],
            projects: projects.map((p: any) => ({
                id: p._id,
                name: p.name,
                roomType: p.roomType,
                style: p.style,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
            })),
            renders: renders.map((r: any) => ({
                id: r._id,
                projectId: r.projectId,
                status: r.status,
                outputImage: r.outputImage,
                createdAt: r.createdAt,
            })),
        };

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="removation-export-${Date.now()}.json"`,
            },
        });
    } catch (error) {
        console.error("[USER_EXPORT_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
