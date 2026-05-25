import { NextResponse } from "next/server";
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";

export async function GET(req: Request) {
    try {
        const authUser = await getCurrentUser();
        const userId = authUser?.id;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await connectToDatabase();

        const dbUser = await User.findById(userId);

        if (!dbUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        return NextResponse.json(dbUser);
    } catch (error) {
        console.log("[USER_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
