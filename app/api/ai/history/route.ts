import { NextResponse } from "next/server";
import { connectDB } from "../../../../src/lib/mongodb.js";
import Project from "../../../../src/models/Project.js";
import { existsSync } from 'fs';
import path from 'path';

// Force dynamic route to prevent Next.js from aggressively caching
// since we want newly generated designs to appear instantly
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();

    // Only fetch completed projects that have a result image
    const projects = await Project.find({
      processingType: 'redesign',
      status: 'completed',
      resultImage: { $ne: null },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Filter out projects whose result image doesn't exist on disk
    const cwd = process.cwd();
    const validProjects = projects.filter((p: any) => {
      if (!p.resultImage) return false;
      const resultPath = path.join(cwd, 'public', p.resultImage);
      return existsSync(resultPath);
    });

    // Build a human-readable description from aiConfig
    function buildDescription(cfg: any): string {
      if (!cfg) return 'AI-generated redesign';
      const parts: string[] = [];

      if (cfg.masterSelector && cfg.masterToggles) {
        const t = cfg.masterToggles;
        const s = cfg.masterSelector;
        if (t.walls && s.wallColor && s.wallColor !== 'keep_original') parts.push(`${s.wallColor} walls`);
        if (t.ceiling && s.ceiling && s.ceiling !== 'keep_original') parts.push(`${s.ceiling} ceiling`);
        if (t.furniture && s.furnitureStyle && s.furnitureStyle !== 'keep_original') parts.push(`${s.furnitureStyle} furniture`);
        if (t.floor && s.floorType && s.floorType !== 'keep_original') parts.push(`${s.floorType} flooring`);
        if (t.lighting && s.lighting && s.lighting !== 'keep_original') parts.push(`${s.lighting} lighting`);
        if (t.decor && s.decorStyle && s.decorStyle !== 'keep_original') parts.push(`${s.decorStyle} decor`);
      }

      if (parts.length === 0) {
        if (cfg.style) parts.push(`${cfg.style} style`);
        if (cfg.colorPalette) parts.push(`${cfg.colorPalette} palette`);
      }

      if (cfg.roomType) parts.unshift(`${cfg.roomType} →`);
      return parts.length > 0 ? parts.join(', ') : 'AI-generated redesign';
    }

    // Map the MongoDB schema to what the frontend expects
    const mappedProjects = validProjects.map((p: any) => ({
      id: p._id.toString(),
      name: p.name,
      thumbnail: p.originalImage && existsSync(path.join(cwd, 'public', p.originalImage)) ? p.originalImage : p.resultImage,
      resultImage: p.resultImage,
      description: buildDescription(p.aiConfig),
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
