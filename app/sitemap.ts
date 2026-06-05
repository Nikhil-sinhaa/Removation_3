import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://removation.ai';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                                   lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/pricing`,                      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/features`,                     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/about`,                        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/blog`,                         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/designers`,                    lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/dream-room`,                   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/room-changer`,                 lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/furniture-remover`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/furniture-placement`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/style-transfer`,               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/ceiling-changer`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`,                      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.5 },
  ];

  let designerPages: MetadataRoute.Sitemap = [];
  let blogPages:     MetadataRoute.Sitemap = [];

  try {
    const { connectToDatabase } = await import('@/lib/db/mongodb');
    await connectToDatabase();

    const { Designer } = await import('@/lib/db/models/Designer');
    const designers = await Designer.find(
      { isVerified: true, isActive: true },
      { _id: 1, updatedAt: 1 }
    ).lean();

    designerPages = designers.map(d => ({
      url:             `${BASE_URL}/designers/${String(d._id)}`,
      lastModified:    d.updatedAt ? new Date(d.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority:        0.7,
    }));
  } catch { /* DB unavailable — skip designer pages */ }

  // Blog posts are currently static arrays — enumerate known slugs
  const knownBlogSlugs = [
    'ai-interior-design-revolution-2025',
    'vastu-shastra-modern-homes',
    'renovation-cost-guide-india-2025',
    'small-space-design-ideas',
    'sustainable-interior-design-trends',
  ];

  blogPages = knownBlogSlugs.map(slug => ({
    url:             `${BASE_URL}/blog/${slug}`,
    lastModified:    new Date(),
    changeFrequency: 'monthly' as const,
    priority:        0.6,
  }));

  return [...staticPages, ...designerPages, ...blogPages];
}
