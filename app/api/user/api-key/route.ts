// app/api/user/api-key/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { randomBytes, createHash } from "crypto";

/**
 * POST /api/user/api-key
 * Generates a new API key for the authenticated user, stores its hash in the DB,
 * and returns the raw key (shown once only).
 */
export async function POST() {
    try {
        // TESTING: Bypass auth for development
        const userId = "test-user-123";

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Generate a cryptographically random key
        const rawKey = `rmvt_sk_live_${randomBytes(24).toString("hex")}`;
        const keyHash = createHash("sha256").update(rawKey).digest("hex");

        await connectToDatabase();

        await User.findOneAndUpdate(
            { clerkId: userId },
            {
                apiKey: keyHash,
                apiKeyCreatedAt: new Date(),
            }
        );

        // Return raw key — this is the ONLY time it is visible
        return NextResponse.json({ key: rawKey, createdAt: new Date() });
    } catch (error) {
        console.error("[USER_API_KEY_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
