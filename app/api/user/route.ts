import { NextResponse } from "next/server";
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";

export async function GET(req: Request) {
    try {
        const authUser = await getCurrentUser();
  const userId = authUser?.id;
        const user = await currentUser();

        if (!userId || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await connectToDatabase();

        const dbUser = await User.findOne({ clerkId: userId });

        if (!dbUser) {
            // Sync user if not found
            const newUser = await User.create({
                clerkId: userId,
                email: user.emailAddresses[0].emailAddress,
                firstName: user.firstName,
                lastName: user.lastName,
                imageUrl: user.imageUrl,
                credits: 10,
                subscription: {
                    plan: 'free',
                    status: 'active',
                    credits: 10,
                    creditsUsed: 0,
                }
            });
            return NextResponse.json(newUser);
        }

        return NextResponse.json(dbUser);
    } catch (error) {
        console.log("[USER_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
