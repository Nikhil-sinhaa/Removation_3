// app/api/furniture/scrape/route.ts
// API endpoint for scraping furniture from Amazon/Flipkart URLs

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { scrapeProductUrl } from '@/lib/furniture/scraper';
import { processProductImage } from '@/lib/furniture/image-processor';
import { z } from 'zod';

const scrapeSchema = z.object({
  url: z.string().url('Please provide a valid product URL'),
  autoProcess: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { url, autoProcess } = scrapeSchema.parse(body);

    // Step 1: Scrape product data
    const scrapeResult = await scrapeProductUrl(url);

    if (!scrapeResult.success || !scrapeResult.item) {
      return NextResponse.json(
        { error: 'Scraping failed', message: scrapeResult.error },
        { status: 422 }
      );
    }

    const item = scrapeResult.item;

    // Step 2: Download & process image (bg removal + resize)
    if (autoProcess && item.imageUrl) {
      const processResult = await processProductImage(item.imageUrl, item.id);

      if (processResult.success) {
        item.processedImagePath = processResult.processedImagePath;
      } else {
        console.warn(`⚠️ Image processing failed: ${processResult.error}`);
        // Non-fatal — item is still usable with raw imageUrl
      }
    }

    return NextResponse.json({
      success: true,
      item,
    });

  } catch (error: any) {
    console.error('Furniture scrape API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Scraping failed', message: error.message },
      { status: 500 }
    );
  }
}
