// PATH: app/api/uploadthing/core.ts

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { verifyJwt } from '@/lib/auth/jwt';


const f = createUploadthing();

// This is your file router — each key becomes an endpoint
export const ourFileRouter = {
  // Main image uploader for room photos (Removation.ai use-case)
  imageUploader: f({
    image: {
      maxFileSize: "8MB",           // ← FIXED: only allowed values (8MB is safe & common)
      maxFileCount: 4,              // allow multiple room angles if needed
      contentDisposition: "inline",
    },
  })
    .middleware(async () => {
      // TODO(security): No auth gate. See KNOWN_ISSUES.md → "UploadThing routes have no auth".
      // Fix: apply the same JWT cookie verification pattern used by designerPortfolio.
      return { userId: "anonymous" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Runs on server after successful upload
      console.log("Upload completed:");
      console.log("  • URL:", file.url);
      console.log("  • Key:", file.key);
      console.log("  • User:", metadata.userId);

      // Return value sent back to the client
      return {
        url: file.url,
        key: file.key,
        name: file.name ?? "unnamed",
        size: file.size,
      };
    }),

  // Endpoint for project cover images
  projectImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 }
  }).middleware(async () => {
    // TODO(security): No auth gate. See KNOWN_ISSUES.md → "UploadThing routes have no auth".
    // Fix: apply the same JWT cookie verification pattern used by designerPortfolio.
    return { userId: "anonymous" };
  }).onUploadComplete(async ({ file }) => {
    return { url: file.url, key: file.key };
  }),

  // Endpoint for user avatars
  avatar: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 }
  }).middleware(async () => {
    // TODO(security): No auth gate. See KNOWN_ISSUES.md → "UploadThing routes have no auth".
    // Fix: apply the same JWT cookie verification pattern used by designerPortfolio.
    return { userId: "anonymous" };
  }).onUploadComplete(async ({ file }) => {
    return { url: file.url, key: file.key };
  }),


  // ─── Designer Portfolio Upload ─────────────────────────────────────────────
  // Auth-gated from day one. Reads the same auth_token cookie the rest of the
  // app uses (lib/auth/jwt.ts). Max 10 images, 4MB each, no SVG/HEIC/GIF/PDF.
  designerPortfolio: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 10,
      contentDisposition: "inline",
    },
  })
    .middleware(async ({ req }) => {
      // Read auth_token from the Cookie header — UploadThing middleware runs
      // outside the standard Next.js response cycle so we parse raw headers.
      const cookieName = process.env.COOKIE_NAME || 'auth_token';
      const rawCookie = req.headers.get('cookie') ?? '';
      // Simple cookie parser: find `auth_token=<value>` bounded by ; or end
      const match = rawCookie.match(
        new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`)
      );
      const token = match?.[1] ?? null;

      const user = token ? verifyJwt(token) : null;
      if (!user) throw new UploadThingError('Unauthorized');

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Designer portfolio upload complete:');
      console.log('  • URL:', file.url);
      console.log('  • Key:', file.key);
      console.log('  • User:', metadata.userId);

      return {
        url: file.url,
        key: file.key,
        name: file.name ?? 'unnamed',
        size: file.size,
      };
    }),

} satisfies FileRouter;


// Critical export for type safety in other files (fixes import in lib/uploadthing.ts)
export type OurFileRouter = typeof ourFileRouter;