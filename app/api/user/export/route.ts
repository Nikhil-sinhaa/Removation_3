// app/api/user/export/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Render from "@/lib/db/models/Render";
import Project from "@/lib/db/models/Project";
import { getCurrentUser } from "@/lib/auth/jwt";

/**
 * POST /api/user/export
 * Assembles the user's full account data (profile, projects, renders, credit history)
 * into a JSON response delivered as a downloadable file.
 */
export async function POST() {
    try {
        const authUser = await getCurrentUser();
        if (!authUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const userId = authUser.id;

        await connectToDatabase();

        const [dbUser, projects, renders] = await Promise.all([
            User.findOne({ clerkId: userId }).lean(),
            Project.find({ userId }).lean(),
            Render.find({ userId }).lean(),
        ]);

        if (!dbUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        const exportData = {
            exportedAt: new Date().toISOString(),
            profile: {
                id: userId,
                email: (dbUser as any).email,
                firstName: (dbUser as any).firstName,
                lastName: (dbUser as any).lastName,
                createdAt: (dbUser as any).createdAt,
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
