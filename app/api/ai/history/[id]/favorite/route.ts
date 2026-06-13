import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AIRun = require("../../../../../../src/models/AIRun.js").default;
import { getCurrentUser } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;

    await connectDB();

    // Ownership check — only the owning user may toggle their render's favorite
    const run = await AIRun.findOne({ _id: id, userId: authUser.id }).lean();
    if (!run) return new NextResponse("Not Found", { status: 404 });

    const newValue = !((run as any).isFavorite ?? false);
    await AIRun.updateOne({ _id: id }, { $set: { isFavorite: newValue } });

    return NextResponse.json({ isFavorite: newValue });
  } catch (error) {
    console.error("[HISTORY_FAVORITE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
