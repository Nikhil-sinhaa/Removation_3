#!/usr/bin/env ts-node
/**
 * CLI tool: print bounding boxes extracted from a mask PNG.
 *
 * Usage:
 *   npx ts-node scripts/test-vastu-bbox-extraction.ts <mask.png> [minAreaPercent]
 *
 * minAreaPercent defaults to 0.5 (a component must cover at least 0.5% of
 * total pixels to be reported). Lower it to surface tiny regions; raise it
 * to suppress noise.
 *
 * Output: JSON array of { x, y, width, height } sorted largest-first.
 */

import fs from 'fs';
import path from 'path';
import { extractBoundingBoxesFromMask } from '../lib/ai/vastuElementExtractor';

async function main() {
  const [, , maskPath, minAreaArg] = process.argv;

  if (!maskPath) {
    console.error('Usage: ts-node scripts/test-vastu-bbox-extraction.ts <mask.png> [minAreaPercent]');
    process.exit(1);
  }

  const resolved = path.resolve(maskPath);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  const minArea = minAreaArg !== undefined ? parseFloat(minAreaArg) : 0.5;
  if (isNaN(minArea) || minArea < 0 || minArea > 100) {
    console.error('minAreaPercent must be a number between 0 and 100');
    process.exit(1);
  }

  const buffer = fs.readFileSync(resolved);
  const boxes = await extractBoundingBoxesFromMask(buffer, minArea);

  console.log(JSON.stringify(boxes, null, 2));
  console.error(`\n${boxes.length} bounding box(es) found (minAreaPercent=${minArea})`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
