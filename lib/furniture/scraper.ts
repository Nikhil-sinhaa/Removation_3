// lib/furniture/scraper.ts
// Amazon/Flipkart product scraper for furniture reference images
// Server-side only — runs via Next.js API route

import axios from 'axios';
import * as cheerio from 'cheerio'; // npm install cheerio @types/cheerio
import { v4 as uuidv4 } from 'uuid';
import type { FurnitureItem } from '../ai/workflows/types';

// ─── Platform Detection ──────────────────────────────────────────────

const ALLOWED_DOMAINS = [
  'amazon.in', 'amazon.com', 'www.amazon.in', 'www.amazon.com',
  'flipkart.com', 'www.flipkart.com',
];

type Platform = 'amazon' | 'flipkart';

function detectPlatform(url: string): Platform {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes('amazon')) return 'amazon';
  if (hostname.includes('flipkart')) return 'flipkart';
  throw new Error(`Unsupported platform: ${hostname}. Only Amazon and Flipkart are supported.`);
}

function validateUrl(url: string): void {
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();
  if (!ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
    throw new Error(`Domain not allowed: ${hostname}`);
  }
}

// ─── Category Detection ──────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<FurnitureItem['category'], string[]> = {
  sofa: ['sofa', 'couch', 'settee', 'loveseat', 'sectional', 'futon'],
  table: ['table', 'desk', 'console', 'coffee table', 'dining table', 'side table', 'end table'],
  chair: ['chair', 'armchair', 'recliner', 'accent chair', 'office chair', 'stool', 'barstool'],
  bed: ['bed', 'cot', 'divan', 'headboard', 'bedframe', 'mattress'],
  shelf: ['shelf', 'bookshelf', 'bookcase', 'rack', 'cabinet', 'wardrobe', 'cupboard', 'storage'],
  lamp: ['lamp', 'light', 'chandelier', 'pendant', 'sconce', 'lantern', 'spotlight'],
  other: [],
};

function detectCategory(title: string): FurnitureItem['category'] {
  const lower = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'other') continue;
    if (keywords.some(kw => lower.includes(kw))) {
      return category as FurnitureItem['category'];
    }
  }
  return 'other';
}

// ─── Scraper Headers ─────────────────────────────────────────────────

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Cache-Control': 'max-age=0',
};

// ─── Amazon Scraper ──────────────────────────────────────────────────

async function scrapeAmazon(url: string): Promise<Partial<FurnitureItem>> {
  const { data: html } = await axios.get(url, {
    headers: BROWSER_HEADERS,
    timeout: 15_000,
  });

  const $ = cheerio.load(html);

  // Title
  const title = $('#productTitle').text().trim() ||
                $('h1.a-size-large span').text().trim() ||
                'Unknown Product';

  // Primary image — try multiple selectors
  let imageUrl =
    $('#imgTagWrapperId img').attr('data-old-hires') ||
    $('#imgTagWrapperId img').attr('src') ||
    $('#landingImage').attr('data-old-hires') ||
    $('#landingImage').attr('src') ||
    $('.imgTagWrapper img').first().attr('src') ||
    '';

  // Amazon sometimes embeds hi-res in data attributes
  if (!imageUrl) {
    const imgJson = $('#imageBlock script').text();
    const hiResMatch = imgJson.match(/"hiRes":"([^"]+)"/);
    if (hiResMatch) imageUrl = hiResMatch[1];
  }

  // Price
  const priceText =
    $('.a-price-whole').first().text().trim() ||
    $('#priceblock_ourprice').text().trim() ||
    '';
  const price = parseFloat(priceText.replace(/[₹,\s]/g, '')) || undefined;

  // Dimensions (from product info table)
  let dimensions: FurnitureItem['dimensions'] | undefined;
  $('table.prodDetTable tr, #productDetails_techSpec_section_1 tr').each((_: number, row: cheerio.Element) => {
    const label = $(row).find('th, td:first-child').text().toLowerCase();
    const value = $(row).find('td:last-child, td:nth-child(2)').text().trim();
    if (label.includes('dimension') || label.includes('size')) {
      const match = value.match(/(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*x\s*(\d+\.?\d*)/i);
      if (match) {
        dimensions = {
          w: parseFloat(match[1]),
          h: parseFloat(match[2]),
          d: parseFloat(match[3]),
        };
      }
    }
  });

  return {
    title,
    imageUrl: imageUrl || '',
    price,
    currency: 'INR',
    dimensions,
    category: detectCategory(title),
  };
}

// ─── Flipkart Scraper ────────────────────────────────────────────────

async function scrapeFlipkart(url: string): Promise<Partial<FurnitureItem>> {
  const { data: html } = await axios.get(url, {
    headers: {
      ...BROWSER_HEADERS,
      // Flipkart sometimes requires this cookie
      'Cookie': 'T=TI169940460050000;',
    },
    timeout: 15_000,
  });

  const $ = cheerio.load(html);

  // Title — Flipkart uses dynamic class names, try several patterns
  const title =
    $('span.VU-ZEz').first().text().trim() ||
    $('h1.yhB1nd span').first().text().trim() ||
    $('h1 span').first().text().trim() ||
    $('._35KyD6').first().text().trim() ||
    'Unknown Product';

  // Primary image
  let imageUrl =
    $('img._396cs4').attr('src') ||
    $('img.DByuf4').attr('src') ||
    $('img._2r_T1I').attr('src') ||
    $('div._3kidJX img').attr('src') ||
    '';

  // Flipkart serves tiny thumbnails — try to get hi-res
  if (imageUrl && imageUrl.includes('/128/128/')) {
    imageUrl = imageUrl.replace('/128/128/', '/832/832/');
  } else if (imageUrl && imageUrl.includes('rukmini')) {
    // Replace size params for higher resolution
    imageUrl = imageUrl.replace(/\/\d+\/\d+\//, '/832/832/');
  }

  // Price
  const priceText =
    $('div.Nx9bqj.CxhGGd').first().text().trim() ||
    $('div._30jeq3._16Jk6d').first().text().trim() ||
    $('._30jeq3').first().text().trim() ||
    '';
  const price = parseFloat(priceText.replace(/[₹,\s]/g, '')) || undefined;

  // Dimensions from specs table
  let dimensions: FurnitureItem['dimensions'] | undefined;
  $('table._14cfVK tr, div._3k_Q8S tr').each((_: number, row: cheerio.Element) => {
    const label = $(row).find('td:first-child').text().toLowerCase();
    const value = $(row).find('td:last-child').text().trim();
    if (label.includes('dimension') || label.includes('size')) {
      const match = value.match(/(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*x\s*(\d+\.?\d*)/i);
      if (match) {
        dimensions = {
          w: parseFloat(match[1]),
          h: parseFloat(match[2]),
          d: parseFloat(match[3]),
        };
      }
    }
  });

  return {
    title,
    imageUrl: imageUrl || '',
    price,
    currency: 'INR',
    dimensions,
    category: detectCategory(title),
  };
}

// ─── Main Scraper Export ─────────────────────────────────────────────

export interface ScrapeResult {
  success: boolean;
  item?: FurnitureItem;
  error?: string;
}

/**
 * Scrape a product URL from Amazon or Flipkart.
 * Returns structured furniture data including the product image URL.
 *
 * The image still needs to be downloaded and processed via
 * `image-processor.ts` before feeding to Stage 3.
 */
export async function scrapeProductUrl(url: string): Promise<ScrapeResult> {
  try {
    validateUrl(url);
    const platform = detectPlatform(url);

    console.log(`🛒 Scraping ${platform}: ${url}`);

    const scraped = platform === 'amazon'
      ? await scrapeAmazon(url)
      : await scrapeFlipkart(url);

    if (!scraped.imageUrl) {
      return {
        success: false,
        error: 'Could not extract product image from the page. The page may require JavaScript rendering.',
      };
    }

    const item: FurnitureItem = {
      id: uuidv4(),
      sourceUrl: url,
      platform,
      title: scraped.title || 'Unknown Product',
      imageUrl: scraped.imageUrl,
      processedImagePath: '', // filled by image-processor.ts
      price: scraped.price,
      currency: scraped.currency || 'INR',
      dimensions: scraped.dimensions,
      category: scraped.category || 'other',
    };

    console.log(`✅ Scraped: "${item.title}" (${item.category}) — ₹${item.price || '?'}`);
    return { success: true, item };

  } catch (error: any) {
    console.error(`❌ Scrape failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}
