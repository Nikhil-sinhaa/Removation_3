/**
 * Marble API (World Labs) — correct implementation
 * API Docs: https://docs.worldlabs.ai/api
 * 
 * Upload flow:
 * 1. POST /marble/v1/media-assets:prepare_upload
 *    → returns { media_asset: { media_asset_id }, upload_info: { upload_url, required_headers } }
 * 2. PUT to upload_url with required_headers + image binary
 * 3. POST /marble/v1/worlds:generate with media_asset_id
 * 4. GET /marble/v1/operations/{operation_id} — poll every 10s
 */

const MARBLE_BASE = 'https://api.worldlabs.ai/marble/v1';

function getApiKey() {
  const key = process.env.MARBLE_API_KEY;
  if (!key || key === 'your_worldlabs_api_key_here') {
    throw new Error(
      'MARBLE_API_KEY not set in .env.local. ' +
      'Get your key from platform.worldlabs.ai/api-keys'
    );
  }
  return key;
}

function marbleHeaders() {
  return {
    'WLT-Api-Key': getApiKey(),
    'Content-Type': 'application/json',
  };
}

/**
 * Upload a single image to Marble media assets.
 * Returns media_asset_id.
 * 
 * IMPORTANT: The correct endpoint is:
 *   POST /marble/v1/media-assets:prepare_upload  (with underscore)
 * NOT:
 *   POST /marble/v1/media-assets:prepareUpload   (camelCase — WRONG)
 */
export async function uploadImageToMarble(imageBuffer, filename) {
  const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

  console.log(`[Marble] Preparing upload for: ${filename}`);

  // Step 1: Prepare upload — get signed URL
  const prepareRes = await fetch(
    `${MARBLE_BASE}/media-assets:prepare_upload`,
    {
      method: 'POST',
      headers: marbleHeaders(),
      body: JSON.stringify({
        file_name: filename,
        extension: extension,
        kind: 'image',
      }),
    }
  );

  if (!prepareRes.ok) {
    const errText = await prepareRes.text();
    throw new Error(
      `Marble prepareUpload failed (${prepareRes.status}): ${errText}`
    );
  }

  const prepareData = await prepareRes.json();
  console.log(`[Marble] prepareUpload response:`,
    JSON.stringify(prepareData, null, 2)
  );

  // Extract from correct response structure
  const mediaAssetId = prepareData.media_asset?.media_asset_id;
  const uploadUrl    = prepareData.upload_info?.upload_url;
  const reqHeaders   = prepareData.upload_info?.required_headers || {};

  if (!mediaAssetId || !uploadUrl) {
    throw new Error(
      `Marble prepareUpload missing fields. Got: ${JSON.stringify(prepareData)}`
    );
  }

  // Step 2: Upload image binary to signed URL
  console.log(`[Marble] Uploading image to signed URL...`);
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      ...reqHeaders,
      'Content-Type': mimeType,
    },
    body: imageBuffer,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(
      `Marble image upload failed (${uploadRes.status}): ${errText}`
    );
  }

  console.log(`[Marble] ✅ Image uploaded. media_asset_id: ${mediaAssetId}`);
  return mediaAssetId;
}

/**
 * Generate a 3D world from multiple image asset IDs.
 * Uses reconstruct_images: true for up to 8 images.
 * Returns operation_id.
 */
export async function generateMarbleWorld(assetIds, displayName) {
  if (!assetIds || assetIds.length === 0) {
    throw new Error('No asset IDs provided for world generation');
  }

  // Use up to 8 images (reconstruct_images mode)
  const selected = assetIds.slice(0, 8);

  console.log(
    `[Marble] Generating world "${displayName}" ` +
    `with ${selected.length} images...`
  );

  // Build multi_image_prompt array
  // Each image needs: content: { source: 'media_asset', media_asset_id }
  const multiImagePrompt = selected.map(assetId => ({
    content: {
      source: 'media_asset',
      media_asset_id: assetId,
    },
  }));

  const requestBody = {
    display_name: displayName?.slice(0, 64) || 'Removation Room',
    model: 'marble-1.1',
    world_prompt: {
      type: 'multi-image',
      multi_image_prompt: multiImagePrompt,
      reconstruct_images: true,  // allows up to 8 images
    },
    permission: { public: false },
  };

  console.log(
    `[Marble] Generate request body:`,
    JSON.stringify(requestBody, null, 2)
  );

  const res = await fetch(
    `${MARBLE_BASE}/worlds:generate`,
    {
      method: 'POST',
      headers: marbleHeaders(),
      body: JSON.stringify(requestBody),
    }
  );

  const resText = await res.text();
  console.log(
    `[Marble] Generate response (${res.status}):`, resText
  );

  if (!res.ok) {
    throw new Error(
      `Marble generate failed (${res.status}): ${resText}`
    );
  }

  const data = JSON.parse(resText);
  const operationId = data.operation_id;

  if (!operationId) {
    throw new Error(
      `Marble generate: no operation_id in response. Got: ${resText}`
    );
  }

  console.log(`[Marble] ✅ Generation started. operation_id: ${operationId}`);
  return operationId;
}

/**
 * Poll operation status.
 * Returns { done, worldUrl, thumbnailUrl, worldId } or { done: false }
 */
export async function pollMarbleOperation(operationId) {
  const res = await fetch(
    `${MARBLE_BASE}/operations/${operationId}`,
    {
      headers: {
        'WLT-Api-Key': getApiKey(),
      },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Marble poll failed (${res.status}): ${errText}`
    );
  }

  const data = await res.json();
  console.log(
    `[Marble] Poll operation ${operationId}:`,
    JSON.stringify({
      done: data.done,
      error: data.error,
      progress: data.metadata?.progress,
    })
  );

  if (!data.done) {
    return {
      done: false,
      progress: data.metadata?.progress,
    };
  }

  if (data.error) {
    throw new Error(
      `Marble generation failed: ${JSON.stringify(data.error)}`
    );
  }

  const world = data.response;
  if (!world) {
    throw new Error(
      `Marble operation done but no response. Data: ${JSON.stringify(data)}`
    );
  }

  const worldUrl =
    world.world_marble_url ||
    `https://marble.worldlabs.ai/world/${world.id}`;

  return {
    done: true,
    worldId: world.id,
    worldUrl,
    thumbnailUrl: world.assets?.thumbnail_url || null,
  };
}

/**
 * Test the API key is valid and has credits.
 * Call this before starting generation.
 */
export async function testMarbleConnection() {
  const res = await fetch(
    `${MARBLE_BASE}/worlds:list`,
    {
      method: 'POST',
      headers: marbleHeaders(),
      body: JSON.stringify({ filters: {}, page_size: 1 }),
    }
  );

  if (res.status === 401) {
    throw new Error('Invalid Marble API key');
  }
  if (res.status === 402) {
    throw new Error('Marble: insufficient credits');
  }

  return res.ok;
}
