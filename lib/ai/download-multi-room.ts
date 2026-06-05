import * as JSZip from 'jszip';

export async function downloadMultiRoomZip(
  projectId: string,
  photos: { order: number; originalUrl: string; paintedUrl?: string | null }[]
) {
  // Handle esModuleInterop issues dynamically across all environments
  const JSZipConstructor = (JSZip as any).default || JSZip;
  const zip = new JSZipConstructor();
  const projectFolder = zip.folder(projectId);
  if (!projectFolder) throw new Error('Could not create project folder in zip');

  const inputFolder = projectFolder.folder('input');
  const outputFolder = projectFolder.folder('output');

  if (!inputFolder || !outputFolder) throw new Error('Could not create subfolders in zip');

  // Helper to fetch an image as a Blob
  const fetchImageBlob = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
    return await res.blob();
  };

  // Helper to pad numbers: e.g. 0 -> "01", 1 -> "02"
  const padIndex = (idx: number) => String(idx + 1).padStart(2, '0');

  // Helper to get extension from content-type or URL
  const getExtension = (url: string, blob: Blob) => {
    const mime = blob.type;
    if (mime === 'image/png') return 'png';
    if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
    if (mime === 'image/webp') return 'webp';
    
    // Fallback to URL extension
    const extMatch = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    return extMatch ? extMatch[1] : 'jpg';
  };

  const promises = [];

  for (const photo of photos) {
    const orderStr = padIndex(photo.order);
    const originalUrl = photo.originalUrl;
    const paintedUrl = photo.paintedUrl;

    // Download original
    if (originalUrl) {
      promises.push(
        (async () => {
          try {
            const blob = await fetchImageBlob(originalUrl);
            const ext = getExtension(originalUrl, blob);
            inputFolder.file(`${projectId}_input_${orderStr}.${ext}`, blob);
          } catch (err) {
            console.error(`Error downloading original photo order ${photo.order}:`, err);
          }
        })()
      );
    }

    // Download painted
    if (paintedUrl) {
      promises.push(
        (async () => {
          try {
            const blob = await fetchImageBlob(paintedUrl);
            const ext = getExtension(paintedUrl, blob);
            outputFolder.file(`${projectId}_output_${orderStr}.${ext}`, blob);
          } catch (err) {
            console.error(`Error downloading painted photo order ${photo.order}:`, err);
          }
        })()
      );
    }
  }

  // Wait for all downloads to finish
  await Promise.all(promises);

  // Generate ZIP
  const content = await zip.generateAsync({ type: 'blob' });

  // Trigger download
  const link = document.body.ownerDocument.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${projectId}_download.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
