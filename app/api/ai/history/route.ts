import { NextResponse } from "next/server";
import { connectDB } from "../../../../src/lib/mongodb.js";
import Project from "../../../../src/models/Project.js";

// Force dynamic route to prevent Next.js from aggressively caching
// since we want newly generated designs to appear instantly
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();

    // In a real multi-user app we would filter by userId and processingType
    // For this demo context, we fetch all 'redesign' projects across the platform
    const projects = await Project.find({ processingType: 'redesign' })
      .sort({ createdAt: -1 })
      .lean();

    // Map the MongoDB schema to what the frontend expects
    const mappedProjects = projects.map(p => ({
      id: p._id.toString(),
      name: p.name,
      thumbnail: p.originalImage,
      resultImage: p.resultImage,
      roomType: p.aiConfig?.roomType || 'Unknown',
      style: p.aiConfig?.style || 'Unknown',
      rendersCount: 1, // we treat each generation as a single render for now
      isFavorite: false,
      isArchived: false,
      vastuScore: p.vastuScore || null,
      estimatedCost: p.estimatedCost || null,
      createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Unknown',
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Unknown',
      lastRenderAt: p.processingCompletedAt ? new Date(p.processingCompletedAt).toLocaleDateString() : 'N/A',
      status: p.status,
      tags: p.aiConfig?.style ? [p.aiConfig.style.toLowerCase(), p.aiConfig.roomType?.toLowerCase()].filter(Boolean) : []
    }));

    return NextResponse.json(mappedProjects);
  } catch (error) {
    console.error("[HISTORY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
