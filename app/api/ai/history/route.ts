import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db/mongodb";
// AIRun is the AI render tracking model (collection: 'projects')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AIRun = require("../../../../src/models/AIRun.js").default;
import { getCurrentUser } from '@/lib/auth/jwt';
import { existsSync } from 'fs';
import path from 'path';

// Force dynamic route to prevent Next.js from aggressively caching
// since we want newly generated designs to appear instantly
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    // Only fetch completed projects belonging to the authenticated user
    const projects = await AIRun.find({
      userId: authUser.id,
      processingType: { $in: ['redesign', 'room-changer', 'furniture-remover', 'ceiling-changer', 'floor-plan', 'multi-room-3d', 'furniture-placement', 'lighting', 'tool-style-transfer'] },
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .lean();

    // Filter out projects whose result image doesn't exist on disk.
    // multi-room-3d projects are exempt — their thumbnail may be a URL or empty.
    const cwd = process.cwd();
    const validProjects = projects.filter((p: any) => {
      if (p.processingType === 'multi-room-3d') return true; // always include
      if (p.processingType === 'furniture-placement') return true; // resultImage may be in /renders/
      if (!p.resultImage) return false;
      const resultPath = path.join(cwd, 'public', p.resultImage);
      return existsSync(resultPath);
    });

    // Build a human-readable description from aiConfig
    function buildDescription(cfg: any, processingType?: string): string {
      if (processingType === 'tool-style-transfer') {
        const styleName = cfg?.styleName || 'Custom';
        return `Style Transfer — ${styleName}`;
      }

      if (processingType === 'lighting') {
        const scene = cfg?.scene || 'Custom';
        // Make it Title Case
        const formattedScene = scene.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        return `Lighting — ${formattedScene}`;
      }

      if (processingType === 'room-changer') {
        const colorName = cfg?.colorName || 'Custom';
        return `${colorName} wall color`;
      }

      if (processingType === 'furniture-remover') {
        return 'Furniture removed';
      }

      if (processingType === 'ceiling-changer') {
        const colorName = cfg?.colorName || 'Custom';
        return `${colorName} ceiling color`;
      }

      if (processingType === 'floor-plan') {
        return '3D Floor Plan reconstruction';
      }

      if (processingType === 'multi-room-3d') {
        const colorName = cfg?.colorName || 'Custom';
        const roomName = cfg?.roomName || '';
        return `3D Room View — ${colorName}${roomName ? ` — ${roomName}` : ''}`;
      }

      if (processingType === 'furniture-placement') {
        return 'Furniture Placement — AI blended';
      }

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
    const mappedProjects = validProjects.map((p: any) => {
      // For multi-room-3d: thumbnail is the marble preview or first painted photo
      let thumbnail: string | null;
      let resultImage: string | null;

      if (p.processingType === 'multi-room-3d') {
        thumbnail = p.aiConfig?.marbleThumbnail || p.resultImage || null;
        resultImage = p.aiConfig?.marbleThumbnail || p.resultImage || null;
      } else {
        thumbnail = p.originalImage && existsSync(path.join(cwd, 'public', p.originalImage))
          ? p.originalImage
          : p.resultImage;
        resultImage = p.resultImage;
      }

      return {
        id: p._id.toString(),
        name: p.name,
        thumbnail,
        resultImage,
        description: buildDescription(p.aiConfig, p.processingType),
        roomType: p.aiConfig?.roomType || 'Unknown',
        style: p.aiConfig?.style || p.aiConfig?.colorName || 'Unknown',
        rendersCount: 1,
        isFavorite: false,
        isArchived: false,
        vastuScore: p.vastuScore || null,
        estimatedCost: p.estimatedCost || null,
        createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Unknown',
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Unknown',
        lastRenderAt: p.processingCompletedAt ? new Date(p.processingCompletedAt).toLocaleDateString() : 'N/A',
        status: p.status,
        processingType: p.processingType,
        tags: p.aiConfig?.style ? [p.aiConfig.style.toLowerCase(), p.aiConfig.roomType?.toLowerCase()].filter(Boolean) : [],
      };
    });

    return NextResponse.json(mappedProjects);
  } catch (error) {
    console.error("[HISTORY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
