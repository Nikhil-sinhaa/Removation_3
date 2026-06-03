import { test, expect, type Page } from '@playwright/test';
import { BASE_URL } from '../setup/testHelpers';

/** Extract all JSON-LD objects from the page, including @graph children */
async function extractJsonLd(page: Page): Promise<Record<string, unknown>[]> {
  const raw = await page.$$eval(
    'script[type="application/ld+json"]',
    els => els.map(el => {
      try { return JSON.parse(el.textContent || '{}'); }
      catch { return null; }
    })
  );

  const schemas: Record<string, unknown>[] = [];
  for (const item of raw) {
    if (!item) continue;
    if (Array.isArray((item as Record<string, unknown>)['@graph'])) {
      schemas.push(...(item as { '@graph': Record<string, unknown>[] })['@graph']);
    } else {
      schemas.push(item as Record<string, unknown>);
    }
    // Also push the wrapper itself so we can find FAQPage at top level
    schemas.push(item as Record<string, unknown>);
  }
  return schemas;
}

test.describe('Feature 9: Schema.org SEO', () => {

  test('homepage has Organization schema', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const schemas = await extractJsonLd(page);
    const orgSchema = schemas.find(s => s['@type'] === 'Organization');
    expect(orgSchema, 'Organization schema not found').toBeTruthy();
    expect(orgSchema!.name).toBe('Removation.ai');
    expect(orgSchema!.url).toBeTruthy();
  });

  test('homepage has WebSite schema with SearchAction', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const schemas = await extractJsonLd(page);
    const webSchema = schemas.find(s => s['@type'] === 'WebSite');
    expect(webSchema, 'WebSite schema not found').toBeTruthy();
    const action = webSchema!.potentialAction as Record<string, unknown>;
    expect(action).toBeTruthy();
    expect(action['@type']).toBe('SearchAction');
  });

  test('homepage has SoftwareApplication schema', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const schemas = await extractJsonLd(page);
    const appSchema = schemas.find(s => s['@type'] === 'SoftwareApplication');
    expect(appSchema, 'SoftwareApplication schema not found').toBeTruthy();
    expect(appSchema!.name).toBe('Removation.ai');
    expect(appSchema!.offers).toBeTruthy();
  });

  test('homepage has FAQPage schema', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const schemas = await extractJsonLd(page);
    const faqSchema = schemas.find(s => s['@type'] === 'FAQPage');
    expect(faqSchema, 'FAQPage schema not found on homepage').toBeTruthy();
    expect(Array.isArray(faqSchema!.mainEntity)).toBe(true);
    expect((faqSchema!.mainEntity as unknown[]).length).toBeGreaterThanOrEqual(3);
  });

  test('pricing page has FAQPage schema', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'domcontentloaded' });
    const schemas = await extractJsonLd(page);
    const faqSchema = schemas.find(s => s['@type'] === 'FAQPage');
    expect(faqSchema, 'FAQPage schema not found on pricing page').toBeTruthy();
    expect(Array.isArray(faqSchema!.mainEntity)).toBe(true);
    expect((faqSchema!.mainEntity as unknown[]).length).toBeGreaterThanOrEqual(4);
  });

  test('FAQ schema has correct Question structure', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const schemas = await extractJsonLd(page);
    const faqSchema = schemas.find(s => s['@type'] === 'FAQPage');
    const questions = faqSchema!.mainEntity as Array<Record<string, unknown>>;
    const firstQ = questions[0];
    expect(firstQ['@type']).toBe('Question');
    expect(firstQ.name).toBeTruthy();
    const answer = firstQ.acceptedAnswer as Record<string, unknown>;
    expect(answer['@type']).toBe('Answer');
    expect(answer.text).toBeTruthy();
  });

  test('sitemap.xml is accessible and contains key pages', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/sitemap.xml`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('<?xml');
    expect(body).toContain('<urlset');
    expect(body).toContain('removation.ai/pricing');
    expect(body).toContain('removation.ai/dream-room');
  });

  test('robots.txt is accessible with correct directives', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/robots.txt`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('User-agent: *');
    expect(body).toContain('Disallow: /admin');
    expect(body).toContain('Disallow: /dashboard');
    expect(body).toContain('Sitemap:');
  });

  test('lib/seo/schema.ts buildOrganizationSchema returns valid object', async () => {
    const { buildOrganizationSchema } = await import('../../lib/seo/schema');
    const schema = buildOrganizationSchema();
    expect(schema['@type']).toBe('Organization');
    expect(schema.name).toBe('Removation.ai');
    expect(schema.url).toBeTruthy();
    expect(Array.isArray(schema.sameAs)).toBe(true);
  });

  test('lib/seo/schema.ts buildWebSiteSchema has SearchAction', async () => {
    const { buildWebSiteSchema } = await import('../../lib/seo/schema');
    const schema = buildWebSiteSchema();
    expect(schema['@type']).toBe('WebSite');
    const action = schema.potentialAction as Record<string, unknown>;
    expect(action['@type']).toBe('SearchAction');
  });

  test('lib/seo/schema.ts buildFAQSchema produces valid FAQPage', async () => {
    const { buildFAQSchema } = await import('../../lib/seo/schema');
    const schema = buildFAQSchema([
      { question: 'What is Removation?', answer: 'An AI interior design platform.' },
      { question: 'How does it work?',   answer: 'Upload a photo and apply AI styles.' },
    ]);
    expect(schema['@type']).toBe('FAQPage');
    expect(schema['@context']).toBe('https://schema.org');
    const entities = schema.mainEntity as Array<Record<string, unknown>>;
    expect(entities.length).toBe(2);
    expect(entities[0]['@type']).toBe('Question');
    const answer = entities[0].acceptedAnswer as Record<string, unknown>;
    expect(answer['@type']).toBe('Answer');
  });

  test('lib/seo/schema.ts buildBlogPostSchema produces valid BlogPosting', async () => {
    const { buildBlogPostSchema } = await import('../../lib/seo/schema');
    const schema = buildBlogPostSchema({
      title:         'Test Blog Post',
      description:   'A test post for automated testing',
      image:         'https://removation.ai/images/test.jpg',
      authorName:    'Test Author',
      datePublished: '2024-01-15',
      url:           'https://removation.ai/blog/test-post',
    });
    expect(schema['@type']).toBe('BlogPosting');
    expect(schema.headline).toBe('Test Blog Post');
    expect(schema.author).toBeTruthy();
    expect((schema.author as Record<string, unknown>)['@type']).toBe('Person');
  });

  test('lib/seo/schema.ts buildPersonSchema omits aggregateRating with < 3 reviews', async () => {
    const { buildPersonSchema } = await import('../../lib/seo/schema');

    // Under 3 reviews — no rating
    const noRating = buildPersonSchema({
      name:        'Test Designer',
      ratingValue: 4.5,
      ratingCount: 2,
    });
    expect(noRating['@type']).toBe('Person');
    expect(noRating.aggregateRating).toBeUndefined();

    // 3+ reviews — rating should appear
    const withRating = buildPersonSchema({
      name:        'Test Designer',
      ratingValue: 4.5,
      ratingCount: 10,
    });
    expect(withRating.aggregateRating).toBeTruthy();
    const rating = withRating.aggregateRating as Record<string, unknown>;
    expect(rating['@type']).toBe('AggregateRating');
    expect(rating.ratingValue).toBe('4.5');
  });

  test('lib/seo/schema.ts buildBreadcrumbSchema produces valid BreadcrumbList', async () => {
    const { buildBreadcrumbSchema } = await import('../../lib/seo/schema');
    const schema = buildBreadcrumbSchema([
      { name: 'Home',    item: '/' },
      { name: 'Pricing', item: '/pricing' },
    ]);
    expect(schema['@type']).toBe('BreadcrumbList');
    const items = schema.itemListElement as Array<Record<string, unknown>>;
    expect(items.length).toBe(2);
    expect(items[0].position).toBe(1);
    expect(items[1].position).toBe(2);
    expect(String(items[1].item)).toContain('/pricing');
  });
});
