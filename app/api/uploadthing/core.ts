// PATH: app/api/uploadthing/core.ts

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

// Optional: import Clerk auth later when you need protected uploads
// import { auth } from "@clerk/nextjs/server";

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
    .middleware(async ({ req, files, input }) => {
      // Note: no 'res' here — that's why TS complained
      // You can use 'req' for headers/cookies if needed

      // Optional: Clerk auth integration (uncomment when ready)
      // const { userId } = auth();
      // if (!userId) throw new UploadThingError("Unauthorized");

      // Metadata that will be available in onUploadComplete
      return {
        userId: "anonymous",        // replace with real userId later
        // Example: projectId: input?.projectId, etc.
      };
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
    return { userId: "user" };
  }).onUploadComplete(async ({ file }) => {
    return { url: file.url, key: file.key };
  }),

  // Endpoint for user avatars
  avatar: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 }
  }).middleware(async () => {
    return { userId: "user" };
  }).onUploadComplete(async ({ file }) => {
    return { url: file.url, key: file.key };
  }),

} satisfies FileRouter;

// Critical export for type safety in other files (fixes import in lib/uploadthing.ts)
export type OurFileRouter = typeof ourFileRouter;