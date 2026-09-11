/**
 * Vercel serverless entrypoint.
 *
 * Imports the compiled output rather than the TypeScript source, so the
 * `@/` path aliases are already resolved to relative specifiers by
 * `tsc-alias` and Vercel's bundler has plain ESM to work with.
 *
 * `vercel.json` rewrites every path to this function, and because Express
 * still sees the original `req.url`, the `/patient-service` mount point
 * continues to match exactly as it does when self-hosted.
 */
import { application, ensureBootstrapped } from "../dist/index.js";

export default async function handler(request, response) {
  try {
    await ensureBootstrapped();
  } catch {
    response.statusCode = 503;
    response.setHeader("content-type", "application/json");
    response.end(
      JSON.stringify({
        success: false,
        status_code: 503,
        data: { detail: "The service is starting up. Please retry shortly." },
      }),
    );
    return;
  }

  application(request, response);
}
