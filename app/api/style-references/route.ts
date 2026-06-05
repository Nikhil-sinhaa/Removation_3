import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const preset = searchParams.get('preset');
  const room   = searchParams.get('room');

  if (!preset || !room) {
    return NextResponse.json({ error: 'preset and room are required' }, { status: 400 });
  }

  // Sanitize to prevent path traversal
  const safePreset = preset.replace(/[^a-z0-9-]/gi, '');
  const safeRoom   = room.replace(/[^a-z0-9-]/gi, '');

  const folderPath = path.join(process.cwd(), 'public', 'style-references', safePreset, safeRoom);

  if (!fs.existsSync(folderPath)) {
    return NextResponse.json({ images: [] });
  }

  const files = fs.readdirSync(folderPath)
    .filter(f => /\.(jpg|jpeg)$/i.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] ?? '0', 10);
      const numB = parseInt(b.match(/\d+/)?.[0] ?? '0', 10);
      return numA - numB;
    });

  const images = files.map(f => `/style-references/${safePreset}/${safeRoom}/${f}`);
  return NextResponse.json({ images });
}
