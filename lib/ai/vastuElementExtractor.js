/**
 * vastuElementExtractor.js
 *
 * Plain-JavaScript mirror of lib/ai/vastuElementExtractor.ts.
 * Required because vastuDetectionOrchestrator.js (a .js module) imports this
 * file as '../../lib/ai/vastuElementExtractor.js' — webpack will not resolve
 * a .ts file when the import specifier ends in .js, so a matching .js file is
 * needed.
 *
 * Extracts axis-aligned bounding boxes from a binary mask image using a
 * union-find connected-component labeling algorithm (4-connectivity, in-process,
 * no Python subprocess needed).
 */

import sharp from 'sharp';

/**
 * Extracts axis-aligned bounding boxes from a binary mask image.
 *
 * @param {Buffer} maskImageBuffer  - PNG/JPEG buffer of the segmentation mask
 * @param {number} [minAreaPercent=0.5]  - Minimum component area as a percentage
 *   of the total image area. Components below this threshold are discarded as noise.
 * @returns {Promise<Array<{x:number, y:number, width:number, height:number}>>}
 *   Bounding boxes sorted largest-first.
 */
export async function extractBoundingBoxesFromMask(maskImageBuffer, minAreaPercent = 0.5, maxAreaPercent = 30) {
  const { data, info } = await sharp(maskImageBuffer)
    // Convert to grayscale (1 channel) so foreground check is simply value > 0.
    // ensureAlpha() would add A=255 to every pixel — including opaque-black
    // background pixels — causing them to be mistakenly classified as foreground.
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const totalPixels = width * height;
  const minArea = (minAreaPercent / 100) * totalPixels;
  const maxArea = (maxAreaPercent / 100) * totalPixels;

  // 1 = foreground (any brightness > 0), 0 = background
  const fg = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    fg[i] = data[i] > 0 ? 1 : 0;
  }

  // Union-Find helpers (path compression + union by rank)
  const parent = new Int32Array(totalPixels + 1);
  const rank   = new Uint8Array(totalPixels + 1);
  for (let i = 0; i <= totalPixels; i++) parent[i] = i;

  function find(x) {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  }
  function union(a, b) {
    a = find(a); b = find(b);
    if (a === b) return;
    if (rank[a] < rank[b]) { const t = a; a = b; b = t; }
    parent[b] = a;
    if (rank[a] === rank[b]) rank[a]++;
  }

  // Label array: 0 = background, >0 = label
  const label = new Int32Array(totalPixels);
  let nextLabel = 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!fg[idx]) continue;

      const leftIdx = x > 0 ? idx - 1      : -1;
      const topIdx  = y > 0 ? idx - width  : -1;
      const leftLbl = leftIdx >= 0 ? label[leftIdx] : 0;
      const topLbl  = topIdx  >= 0 ? label[topIdx]  : 0;

      if (!leftLbl && !topLbl) {
        label[idx] = nextLabel++;
      } else if (leftLbl && !topLbl) {
        label[idx] = leftLbl;
      } else if (!leftLbl && topLbl) {
        label[idx] = topLbl;
      } else {
        union(leftLbl, topLbl);
        label[idx] = leftLbl;
      }
    }
  }

  // Collect bounding boxes keyed by root label
  const boxes = new Map();

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

  const result = [];
  for (const { minX, minY, maxX, maxY, count } of boxes.values()) {
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    // Filter by pixel count (not bbox area) to avoid noise and full-room FP blobs
    if (count >= minArea && count <= maxArea) {
      result.push({ x: minX, y: minY, width: w, height: h });
    }
  }

  // Return largest components first
  return result.sort((a, b) => b.width * b.height - a.width * a.height);
}
