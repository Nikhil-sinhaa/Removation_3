import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';

export type SearchResultType =
  | 'project'
  | 'render'
  | 'designer'
  | 'blog'
  | 'style'
  | 'page';

export interface SearchResult {
  id:           string;
  type:         SearchResultType;
  title:        string;
  subtitle?:    string;
  description?: string;
  imageUrl?:    string;
  url:          string;
  score:        number;
  metadata?:    Record<string, unknown>;
}

export interface SearchResponse {
  results: SearchResult[];
  total:   number;
  query:   string;
  took:    number;
  grouped: Record<string, SearchResult[]>;
}

/**
 * Unified search across all content types.
 * Personal content (projects, renders) is always filtered to the requesting user.
 * Public content (designers) has no user filter.
 */
export async function unifiedSearch(
  query:  string,
  userId: string,
  types:  SearchResultType[] = [],
  limit:  number = 5
): Promise<SearchResponse> {
  const start = Date.now();
  await connectToDatabase();

  if (!query || query.trim().length < 2) {
    return { results: [], total: 0, query, took: 0, grouped: {} };
  }

  const uid = new mongoose.Types.ObjectId(userId);
  const q   = query.trim();

  const shouldSearch = (type: SearchResultType) =>
    types.length === 0 || types.includes(type);

  const searches: Promise<SearchResult[]>[] = [];

  if (shouldSearch('project'))  searches.push(searchProjects(q, uid, limit));
  if (shouldSearch('render'))   searches.push(searchRenders(q, uid, limit));
  if (shouldSearch('designer')) searches.push(searchDesigners(q, limit));
  if (shouldSearch('style'))    searches.push(searchStylePresets(q, limit));
  if (shouldSearch('page'))     searches.push(searchPages(q, limit));

  const allResults = (await Promise.all(searches)).flat();
  allResults.sort((a, b) => b.score - a.score);

  const grouped = allResults.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  return {
    results: allResults.slice(0, 20),
    total:   allResults.length,
    query,
    took:    Date.now() - start,
    grouped,
  };
}

// ─── Per-type search functions ────────────────────────────────────────────────

type LeanDoc = Record<string, unknown> & { _id: unknown; score?: number };

async function searchProjects(
  query:  string,
  userId: mongoose.Types.ObjectId,
  limit:  number
): Promise<SearchResult[]> {
  try {
    const Project = mongoose.models['Project'];
    if (!Project) return [];

    const docs = await Project.find(
      { $text: { $search: query }, userId },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(limit).lean() as LeanDoc[];

    return docs.map(d => ({
      id:       String(d._id),
      type:     'project' as SearchResultType,
      title:    String(d.name || 'Untitled Project'),
      subtitle: 'Project',
      imageUrl: String(d.currentImage || d.originalImage || ''),
      url:      `/projects/${String(d._id)}`,
      score:    d.score ?? 1,
      metadata: { updatedAt: d.updatedAt },
    }));
  } catch { return []; }
}

async function searchRenders(
  query:  string,
  userId: mongoose.Types.ObjectId,
  limit:  number
): Promise<SearchResult[]> {
  try {
    const Render = mongoose.models['Render'];
    if (!Render) return [];

    const docs = await Render.find(
      { $text: { $search: query }, userId },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(limit).lean() as LeanDoc[];

    return docs.map(d => ({
      id:       String(d._id),
      type:     'render' as SearchResultType,
      title:    String(d.mode || 'Render'),
      subtitle: String(d.style || d.roomType || ''),
      imageUrl: String(d.resultUrl || d.outputImage || ''),
      url:      `/history?render=${String(d._id)}`,
      score:    d.score ?? 1,
      metadata: { mode: d.mode, createdAt: d.createdAt },
    }));
  } catch { return []; }
}

async function searchDesigners(query: string, limit: number): Promise<SearchResult[]> {
  try {
    const Designer = mongoose.models['Designer'];
    if (!Designer) return [];

    const docs = await Designer.find(
      { $text: { $search: query }, isVerified: true },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(limit).lean() as LeanDoc[];

    return docs.map(d => ({
      id:       String(d._id),
      type:     'designer' as SearchResultType,
      title:    String(d.displayName || 'Designer'),
      subtitle: Array.isArray(d.specialties)
                  ? (d.specialties as string[]).slice(0, 2).join(', ')
                  : String(d.city || ''),
      imageUrl: Array.isArray(d.portfolioImages)
                  ? String((d.portfolioImages as string[])[0] || '')
                  : '',
      url:      `/designers/${String(d._id)}`,
      score:    d.score ?? 1,
      metadata: { city: d.city },
    }));
  } catch { return []; }
}

async function searchStylePresets(query: string, limit: number): Promise<SearchResult[]> {
  try {
    const { STYLE_PRESETS } = await import('@/config/style-presets');
    if (!STYLE_PRESETS) return [];

    const q = query.toLowerCase();
    return STYLE_PRESETS
      .filter(p =>
        p.label?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      )
      .slice(0, limit)
      .map(p => ({
        id:          p.id,
        type:        'style' as SearchResultType,
        title:       p.label,
        subtitle:    'Style preset',
        description: p.description,
        imageUrl:    p.references?.[0]?.imageUrl || '',
        url:         `/style-transfer?preset=${p.id}`,
        score:       p.label.toLowerCase().includes(q) ? 0.9 : 0.7,
      }));
  } catch { return []; }
}

async function searchPages(query: string, limit: number): Promise<SearchResult[]> {
  const PAGES = [
    { title: 'Room Changer',        url: '/room-changer',        keywords: ['room','changer','style','transform'] },
    { title: 'Furniture Remover',   url: '/furniture-remover',   keywords: ['furniture','remove','remover','clean'] },
    { title: 'Furniture Placement', url: '/furniture-placement', keywords: ['furniture','place','placement','add'] },
    { title: 'Ceiling Changer',     url: '/ceiling-changer',     keywords: ['ceiling','changer','roof'] },
    { title: 'Style Transfer',      url: '/style-transfer',      keywords: ['style','transfer','preset'] },
    { title: 'Floor Plan',          url: '/floor-plan',          keywords: ['floor','plan','layout','blueprint'] },
    { title: '3D Room View',        url: '/room-3d',             keywords: ['3d','three','dimension','view'] },
    { title: 'Lighting Studio',     url: '/lighting',            keywords: ['light','lighting','lamp','bright'] },
    { title: 'AI Design Studio',    url: '/studio',              keywords: ['studio','ai','design','advanced'] },
    { title: 'Dashboard',           url: '/dashboard',           keywords: ['dashboard','home','projects'] },
    { title: 'Browse Designers',    url: '/designers',           keywords: ['designer','interior','professional','browse'] },
    { title: 'My Bookings',         url: '/my-bookings',         keywords: ['booking','appointment','schedule'] },
    { title: 'History',             url: '/history',             keywords: ['history','past','previous','renders'] },
    { title: 'Billing & Plans',     url: '/billing',             keywords: ['billing','plan','credits','upgrade','pro'] },
    { title: 'Settings',            url: '/settings',            keywords: ['settings','account','profile'] },
    { title: 'Marketplace',         url: '/marketplace',         keywords: ['marketplace','vendors','contractors'] },
  ];

  const q = query.toLowerCase();
  return PAGES
    .filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.keywords.some(k => k.includes(q) || q.includes(k))
    )
    .slice(0, limit)
    .map(p => ({
      id:       p.url,
      type:     'page' as SearchResultType,
      title:    p.title,
      subtitle: 'Page',
      url:      p.url,
      score:    p.title.toLowerCase().includes(q) ? 0.9 : 0.6,
    }));
}
