import { NextResponse } from "next/server";
import { getApiLimitCount } from "@/lib/api-limit";

export async function GET() {
    try {
        const credits = await getApiLimitCount();
        return NextResponse.json({ credits });
    } catch (error) {
        console.log("[CREDITS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
