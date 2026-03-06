/**
 * appendNewToName.ts
 * Purpose: Filename utility that appends "-new" before the file extension.
 * Used with downloadPhoto.ts to name AI-generated outputs.
 * Example: "room.jpg" → "room-new.jpg"
 * Connects to: lib/downloadPhoto.ts
 */

/**
 * Inserts "-new" before the file extension in a filename.
 * If no extension is found, appends "-new" to the end.
 * @param name - Original filename (e.g. "my-room.jpg")
 * @returns Modified filename (e.g. "my-room-new.jpg")
 */
export default function appendNewToName(name: string): string {
    const insertPos = name.lastIndexOf(".");
    if (insertPos === -1) {
        // No extension found — just append "-new"
        return `${name}-new`;
    }
    return `${name.substring(0, insertPos)}-new${name.substring(insertPos)}`;
}
