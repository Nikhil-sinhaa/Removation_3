import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.MARBLE_API_KEY;

  if (!apiKey || apiKey === 'your_worldlabs_api_key_here') {
    return NextResponse.json({
      error: 'MARBLE_API_KEY not set',
      fix: 'Add your key to .env.local and restart server'
    });
  }

  try {
    // Test 1: List worlds using the correct worlds:list endpoint
    const listRes = await fetch(
      'https://api.worldlabs.ai/marble/v1/worlds:list',
      {
        method: 'POST',
        headers: {
          'WLT-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters: {}, page_size: 1 }),
      }
    );

    const listData = await listRes.text();

    return NextResponse.json({
      apiKeyPresent: true,
      apiKeyPrefix: apiKey.substring(0, 8) + '...',
      listWorlds: {
        status: listRes.status,
        body: listData.substring(0, 400),
      },
    });
  } catch (error) {
    return NextResponse.json({
      apiKeyPresent: true,
      error: error.message,
    }, { status: 500 });
  }
}
