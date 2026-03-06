/**
 * downloadPhoto.ts
 * Purpose: Client-side utility to download a generated image from a URL.
 * Used by the editor/generate UI to let users save their AI-generated renders.
 * Connects to: appendNewToName.ts for filename generation.
 */

function forceDownload(blobUrl: string, filename: string): void {
    const a = document.createElement("a");
    a.download = filename;
    a.href = blobUrl;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

/**
 * Fetches an image from a URL and triggers a browser download.
 * @param url - The URL of the image to download (can be a Replicate output URL)
 * @param filename - The desired filename for the downloaded file
 */
export default function downloadPhoto(url: string, filename: string): void {
    fetch(url, {
        headers: new Headers({
            Origin: window.location.origin,
        }),
        mode: "cors",
    })
        .then((response) => response.blob())
        .then((blob) => {
            const blobUrl = window.URL.createObjectURL(blob);
            forceDownload(blobUrl, filename);
            // Clean up the object URL after use
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
        })
        .catch((e) => console.error("[downloadPhoto] Failed to download image:", e));
}
