// app/api/uploadthing/route.ts
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  // Optional config
  config: {
    token: process.env.UPLOADTHING_TOKEN, // if using token auth
  },
});