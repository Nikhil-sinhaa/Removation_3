// app/api/webhooks/razorpay/route.ts
// Safety-net: Redirect plural /api/webhooks/razorpay → singular /api/webhook/razorpay
// The canonical route is at /api/webhook/razorpay (singular).
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  url.pathname = '/api/webhook/razorpay';
  return Response.redirect(url.toString(), 307);
}

export async function GET() {
  return Response.json({ note: 'Razorpay webhook endpoint moved to /api/webhook/razorpay (singular)' }, { status: 301 });
}
