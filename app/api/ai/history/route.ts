import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db/mongodb";
// AIRun is the AI render tracking model (collection: 'projects')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AIRun = require("../../../../src/models/AIRun.js").default;
import { getCurrentUser } from '@/lib/auth/jwt';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ALLOWED_PROCESSING_TYPES = [
  'redesign', 'room-changer', 'furniture-remover', 'ceiling-changer',
  'floor-plan', 'multi-room-3d', 'furniture-placement', 'lighting', 'tool-style-transfer',
];

function buildDescription(cfg: any, processingType?: string): string {
  if (processingType === 'tool-style-transfer') {
    return `Style Transfer — ${cfg?.styleName || 'Custom'}`;
  }
  if (processingType === 'lighting') {
    const scene = (cfg?.scene || 'Custom').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    return `Lighting — ${scene}`;
  }
  if (processingType === 'room-changer') return `${cfg?.colorName || 'Custom'} wall color`;
  if (processingType === 'furniture-remover') return 'Furniture removed';
  if (processingType === 'ceiling-changer') return `${cfg?.colorName || 'Custom'} ceiling color`;
  if (processingType === 'floor-plan') return '3D Floor Plan reconstruction';
  if (processingType === 'multi-room-3d') {
    const colorName = cfg?.colorName || 'Custom';
    const roomName = cfg?.roomName || '';
    return `3D Room View — ${colorName}${roomName ? ` — ${roomName}` : ''}`;
  }
  if (processingType === 'furniture-placement') return 'Furniture Placement — AI blended';
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

export async function GET(request: Request) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const roomType = searchParams.get('roomType') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    // Base query — always scoped to authUser.id to prevent cross-user leakage
    const query: Record<string, any> = {
      userId: authUser.id,
      processingType: { $in: ALLOWED_PROCESSING_TYPES },
      status: 'completed',
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'aiConfig.style': { $regex: search, $options: 'i' } },
      ];
    }

    // Exact-match type filter maps to processingType
    if (type && type !== 'all') {
      query.processingType = type;
    }

    if (roomType && roomType !== 'all') {
      query['aiConfig.roomType'] = roomType;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {} as Record<string, Date>;
      if (dateFrom) (query.createdAt as Record<string, Date>).$gte = new Date(dateFrom);
      if (dateTo) (query.createdAt as Record<string, Date>).$lte = new Date(dateTo);
    }

    const sortMap: Record<string, Record<string, number>> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name: { name: 1 },
      style: { 'aiConfig.style': 1 },
    };
    const sort = sortMap[sortBy] ?? { createdAt: -1 };

    const skip = (page - 1) * limit;

    // Run query and count in parallel
    const [projects, total] = await Promise.all([
      AIRun.find(query).sort(sort).skip(skip).limit(limit).lean(),
      AIRun.countDocuments(query),
    ]);

    // Filter out renders whose result file doesn't exist on disk.
    // Note: total is pre-filter count — hasMore may remain true longer than strictly needed (known v1 limitation).
    const cwd = process.cwd();
    const validProjects = (projects as any[]).filter((p) => {
      if (p.processingType === 'multi-room-3d') return true;
      if (p.processingType === 'furniture-placement') return true;
      if (!p.resultImage) return false;
      return existsSync(path.join(cwd, 'public', p.resultImage));
    });

    // Map to MockRender-compatible shape so the frontend type stays unchanged
    const mappedProjects = validProjects.map((p: any) => {
      let originalImage: string;
      let renderedImage: string;

      if (p.processingType === 'multi-room-3d') {
        const url = p.aiConfig?.marbleThumbnail || p.resultImage || '';
        originalImage = url;
        renderedImage = url;
      } else {
        originalImage = (p.originalImage && existsSync(path.join(cwd, 'public', p.originalImage)))
          ? p.originalImage
          : (p.resultImage || '');
        renderedImage = p.resultImage || '';
      }

      return {
        id: p._id.toString(),
        projectId: p._id.toString(),
        projectName: p.name,
        originalImage,
        renderedImage,
        type: p.processingType,
        style: p.aiConfig?.style || p.aiConfig?.colorName || 'Unknown',
        roomType: p.aiConfig?.roomType || 'Unknown',
        // ISO string — required for date-fns format() and date filtering in the frontend
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        // Use real value from lean() document; AIRun schema lacks field but $set writes it
        isFavorite: p.isFavorite ?? false,
        hasVastu: p.vastuScore != null && p.vastuScore > 0,
        vastuScore: p.vastuScore || null,
        hasCost: p.estimatedCost != null && p.estimatedCost > 0,
        estimatedCost: p.estimatedCost || null,
        status: p.status,
        rating: null,
        description: buildDescription(p.aiConfig, p.processingType),
        processingType: p.processingType,
      };
    });

    return NextResponse.json({
      projects: mappedProjects,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error("[HISTORY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
