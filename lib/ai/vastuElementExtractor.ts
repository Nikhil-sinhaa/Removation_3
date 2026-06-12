import sharp from 'sharp';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Extracts axis-aligned bounding boxes from a binary mask image.
 *
 * The mask is expected to have non-zero pixels where elements of interest are
 * located (e.g. output from a segmentation model). This function uses a
 * union-find (disjoint-set) connected-component labeling pass over the raw
 * pixel buffer so we can run entirely in-process without spawning Python.
 *
 * Connected-component algorithm (4-connectivity):
 *   1. Threshold: any pixel with value > 0 is "foreground".
 *   2. Scan left-to-right, top-to-bottom; for each foreground pixel check
 *      its left and top neighbours. If both are background → new label.
 *      If one has a label → inherit it. If both have labels → merge via
 *      union-find and inherit the root.
 *   3. Second pass resolves all labels to their roots and collects per-label
 *      bounding boxes.
 *   4. Filter out components whose bounding-box area is below minAreaPercent
 *      of the total image area.
 *
 * Example usage:
 *   const bboxes = await extractBoundingBoxesFromMask(fs.readFileSync('mask.png'));
 *   // [{ x: 120, y: 80, width: 200, height: 150 }, ...]
 */
export async function extractBoundingBoxesFromMask(
  maskImageBuffer: Buffer,
  minAreaPercent = 0.5,
): Promise<BoundingBox[]> {
  const { data, info } = await sharp(maskImageBuffer)
    // Convert to grayscale (1 channel) so the foreground check is simply value > 0.
    // ensureAlpha() would add A=255 to every pixel — including opaque-black background
    // pixels — causing them all to be mistakenly classified as foreground.
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const totalPixels = width * height;
  const minArea = (minAreaPercent / 100) * totalPixels;

  // 1 = foreground (any brightness > 0), 0 = background
  const fg = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    fg[i] = data[i] > 0 ? 1 : 0;
  }

  // Union-Find helpers (path compression + union by rank)
  const parent = new Int32Array(totalPixels + 1);
  const rank   = new Uint8Array(totalPixels + 1);
  for (let i = 0; i <= totalPixels; i++) parent[i] = i;

  function find(x: number): number {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  }
  function union(a: number, b: number): void {
    a = find(a); b = find(b);
    if (a === b) return;
    if (rank[a] < rank[b]) { const t = a; a = b; b = t; }
    parent[b] = a;
    if (rank[a] === rank[b]) rank[a]++;
  }

  // Label array: 0 = background, >0 = label (1-indexed pixel position of
  // the pixel that first introduced the component)
  const label = new Int32Array(totalPixels);
  let nextLabel = 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!fg[idx]) continue;

      const leftIdx = x > 0 ? idx - 1          : -1;
      const topIdx  = y > 0 ? idx - width       : -1;
      const leftLbl = leftIdx >= 0 ? label[leftIdx] : 0;
      const topLbl  = topIdx  >= 0 ? label[topIdx]  : 0;

      if (!leftLbl && !topLbl) {
        label[idx] = nextLabel++;
      } else if (leftLbl && !topLbl) {
        label[idx] = leftLbl;
      } else if (!leftLbl && topLbl) {
        label[idx] = topLbl;
      } else {
        // Both neighbours have labels — merge components
        union(leftLbl, topLbl);
        label[idx] = leftLbl;
      }
    }
  }

  // Collect bounding boxes keyed by root label
  const boxes = new Map<number, { minX: number; minY: number; maxX: number; maxY: number; count: number }>();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!label[idx]) continue;
      const root = find(label[idx]);
      const existing = boxes.get(root);
      if (!existing) {
        boxes.set(root, { minX: x, minY: y, maxX: x, maxY: y, count: 1 });
      } else {
        if (x < existing.minX) existing.minX = x;
        if (x > existing.maxX) existing.maxX = x;
        if (y < existing.minY) existing.minY = y;
        if (y > existing.maxY) existing.maxY = y;
        existing.count++;
      }
    }
  }

  const result: BoundingBox[] = [];
  for (const { minX, minY, maxX, maxY, count } of boxes.values()) {
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    // Filter by pixel count (not bbox area) to avoid noise from scattered pixels
    if (count >= minArea) {
      result.push({ x: minX, y: minY, width: w, height: h });
    }
  }

  // Return largest components first
  return result.sort((a, b) => b.width * b.height - a.width * a.height);
}
