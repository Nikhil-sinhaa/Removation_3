import { NextResponse } from 'next/server';
import { startModelUpload, isUploadRunning, getUploadProgress } from '@/src/lib/googleDrive';

export const runtime = 'nodejs';

export async function POST() {
  try {
    if (isUploadRunning()) {
      return NextResponse.json({ error: 'Upload already in progress' }, { status: 409 });
    }
    await startModelUpload();
    return NextResponse.json({ success: true, message: 'Upload started in background' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** SSE endpoint — stream progress updates every second. */
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastSent = '';

      const sendUpdate = () => {
        const progress = getUploadProgress();
        const running  = isUploadRunning();

        const payload = JSON.stringify({
          running,
          progress: progress?.map(p => ({
            file:    p.file,
            folder:  p.folder,
            percent: p.percent,
            done:    p.done,
            error:   p.error,
          })) ?? [],
          summary: progress
            ? (() => {
                const total   = progress.length;
                const done    = progress.filter(p => p.done).length;
                const errors  = progress.filter(p => p.done && p.error).length;
                const sentGB  = progress.reduce((s, p) => s + p.bytesSent,  0) / 1e9;
                const totalGB = progress.reduce((s, p) => s + p.totalBytes, 0) / 1e9;
                return {
                  total, done, errors,
                  sentGB:  +sentGB.toFixed(2),
                  totalGB: +totalGB.toFixed(2),
                  percent: total > 0 ? Math.round((done / total) * 100) : 0,
                };
              })()
            : null,
        });

        if (payload !== lastSent) {
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          lastSent = payload;
        }

        if (!running && progress !== null && progress.every(p => p.done)) {
          controller.close();
          return;
        }
      };

      // Send initial state
      sendUpdate();

      const interval = setInterval(sendUpdate, 1000);

      // Stop after 3 hours max
      setTimeout(() => {
        clearInterval(interval);
        controller.close();
      }, 3 * 60 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection:      'keep-alive',
    },
  });
}
