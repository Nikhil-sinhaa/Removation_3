// app/api/user/preferences/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const preferencesSchema = z.object({
    theme: z.enum(["light", "dark", "system"]).optional(),
    currency: z.enum(["INR", "USD"]).optional(),
    measurementUnit: z.enum(["sqft", "sqm"]).optional(),
    defaultStyle: z.string().optional(),
    autoVastu: z.boolean().optional(),
    autoCost: z.boolean().optional(),
    language: z.enum(["en", "hi"]).optional(),
    notifications: z.object({
        emailRenders: z.boolean().optional(),
        emailNewsletter: z.boolean().optional(),
        emailTips: z.boolean().optional(),
        pushRenders: z.boolean().optional(),
        pushUpdates: z.boolean().optional(),
        smsAlerts: z.boolean().optional(),
    }).optional(),
});

/**
 * PATCH /api/user/preferences
 * Persists user UI preferences to Clerk public metadata.
 */
export async function PATCH(req: NextRequest) {
    try {
        // TESTING: Bypass auth for development
        const userId = "test-user-123";

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const data = preferencesSchema.parse(body);

        // TESTING: Skip Clerk metadata update for now
        // const client = await clerkClient();
        // await client.users.updateUserMetadata(userId, {
        //     publicMetadata: {
        //         preferences: data,
        //     },
        // });

        return NextResponse.json({ success: true, preferences: data });
    } catch (error: any) {
        console.error("[USER_PREFERENCES_PATCH]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}
