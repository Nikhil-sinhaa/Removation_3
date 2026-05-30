import { NextResponse } from "next/server";
import { getCurrentUser } from '@/lib/auth/jwt';
import connectToDatabase from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";

export async function GET() {
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
        
        const credits = user.subscription ? (user.subscription.credits - (user.subscription.creditsUsed || 0)) : (user.credits || 0);

        return NextResponse.json({ credits });
    } catch (error) {
        console.log("[CREDITS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
