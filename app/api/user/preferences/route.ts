// app/api/user/preferences/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";

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
 * Persists user UI preferences to MongoDB.
 */
export async function PATCH(req: NextRequest) {
    try {
        const authUser = await getCurrentUser();
        const userId = authUser?.id;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const data = preferencesSchema.parse(body);

        await connectToDatabase();

        const dbUser = await User.findById(userId);
        if (!dbUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Initialize preferences if they don't exist
        if (!dbUser.preferences) {
            dbUser.preferences = {};
        }

        // Update preferences fields
        if (data.theme) dbUser.preferences.theme = data.theme;
        if (data.currency) dbUser.preferences.currency = data.currency;
        if (data.measurementUnit) dbUser.preferences.measurementUnit = data.measurementUnit;
        if (data.defaultStyle) dbUser.preferences.defaultStyle = data.defaultStyle;
        if (data.autoVastu !== undefined) dbUser.preferences.autoVastu = data.autoVastu;
        if (data.autoCost !== undefined) dbUser.preferences.autoCost = data.autoCost;
        if (data.language) dbUser.preferences.language = data.language;

        if (data.notifications) {
            if (data.notifications.emailRenders !== undefined) dbUser.preferences.emailNotifications = data.notifications.emailRenders;
            if (data.notifications.emailNewsletter !== undefined) dbUser.preferences.marketingEmails = data.notifications.emailNewsletter;
            if (data.notifications.emailTips !== undefined) dbUser.preferences.showTips = data.notifications.emailTips;
        }

        // Save updated document to database
        dbUser.markModified("preferences");
        await dbUser.save();

        return NextResponse.json({ success: true, preferences: dbUser.preferences });
    } catch (error: any) {
        console.error("[USER_PREFERENCES_PATCH]", error);
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}
