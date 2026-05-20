/**
 * Cloud ComfyUI Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * When GPU_MODE=cloud, images cannot be written to the local filesystem
 * (ComfyUI runs on Colab / RunPod). These helpers use ComfyUI's own HTTP API
 * to upload inputs and download outputs — the exact same ComfyUI API,
 * just pointed at the remote URL.
 */

/**
 * Upload an image buffer to a remote ComfyUI instance.
 * Uses POST /upload/image — the same endpoint ComfyUI's web UI uses.
 *
 * @param buffer    Raw image bytes
 * @param filename  Desired filename in ComfyUI/input/
 * @param baseUrl   Remote ComfyUI HTTP base URL
 * @returns The filename as stored by ComfyUI (may differ if deduplicated)
 */
export async function uploadImageToRemoteComfy(
  buffer: Buffer,
  filename: string,
  baseUrl: string,
): Promise<string> {
  const form = new FormData();
  // Node 18+: Buffer extends Uint8Array which satisfies BlobPart
  const blob = new Blob([new Uint8Array(buffer)], { type: 'image/png' });
  form.append('image', blob, filename);
  form.append('overwrite', 'true');

  const res = await fetch(`${baseUrl}/upload/image`, {
    method: 'POST',
    headers: {
      'bypass-tunnel-reminder': 'true'
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ComfyUI upload failed (HTTP ${res.status}): ${text}`);
  }

  const json = await res.json();
  // ComfyUI returns { name, subfolder, type }
  return json.name as string;
}

/**
 * Download an output image from a remote ComfyUI instance.
 * Uses GET /view?filename=…&type=output
 *
 * @param filename  Output filename from ComfyUI history
 * @param subfolder Optional subfolder (e.g. "stage1")
 * @param baseUrl   Remote ComfyUI HTTP base URL
 * @returns Buffer of the downloaded image
 */
export async function downloadOutputFromRemoteComfy(
  filename: string,
  subfolder: string = '',
  baseUrl: string,
): Promise<Buffer> {
  const params = new URLSearchParams({ filename, type: 'output' });
  if (subfolder) params.set('subfolder', subfolder);

  const res = await fetch(`${baseUrl}/view?${params.toString()}`, {
    headers: { 'bypass-tunnel-reminder': 'true' }
  });
  if (!res.ok) {
    throw new Error(`ComfyUI download failed (HTTP ${res.status}) for ${filename}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Copy stage outputs from remote ComfyUI output → remote ComfyUI input.
 * In cloud mode, ComfyUI handles its own file system — we tell it to move
 * files by re-uploading each output as an input image.
 *
 * @param outputs  ComfyUI history outputs object
 * @param baseUrl  Remote ComfyUI base URL
 */
export async function copyOutputsToRemoteInput(
  outputs: Record<string, any>,
  baseUrl: string,
): Promise<void> {
  for (const nodeId in outputs) {
    const images = outputs[nodeId]?.images;
    if (!images) continue;
    for (const img of images) {
      const filename: string = img.filename || img.name;
      if (!filename) continue;
      const subfolder: string = img.subfolder || '';
      try {
        // Download from output
        const buffer = await downloadOutputFromRemoteComfy(filename, subfolder, baseUrl);
        // Re-upload to input (flat — ComfyUI LoadImage searches input/)
        const flatName = filename.split('/').pop() ?? filename;
        const storedName = await uploadImageToRemoteComfy(buffer, flatName, baseUrl);
        img._inputFilename = storedName;
        console.log(`☁️  Cloud copy: ${filename} → input/${storedName}`);
      } catch (err: any) {
        console.warn(`⚠️  Cloud copy failed for ${filename}: ${err.message}`);
      }
    }
  }
}
