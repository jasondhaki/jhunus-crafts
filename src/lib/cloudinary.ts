import { v2 as cloudinary } from "cloudinary";

// Product images live under one folder so they're easy to find/prune in
// the Cloudinary console independent of anything else on the account.
const UPLOAD_FOLDER = "jhunus-crafts/products";

let configured = false;

function getCloudinaryEnv() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET).",
    );
  }
  return { cloudName, apiKey, apiSecret };
}

// Lazy, same reasoning as src/lib/stripe.ts — configuring eagerly at
// module load would throw during `next build` wherever these env vars
// aren't set (e.g. CI), even though this module is only ever exercised
// inside admin Server Actions at request time.
function ensureConfigured() {
  const env = getCloudinaryEnv();
  if (!configured) {
    cloudinary.config({
      cloud_name: env.cloudName,
      api_key: env.apiKey,
      api_secret: env.apiSecret,
      secure: true,
    });
    configured = true;
  }
  return env;
}

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

/**
 * Signs an upload request the browser sends *directly* to Cloudinary — the
 * binary never passes through our server, so there's no Next.js route
 * body-size limit to worry about. The signature only covers folder +
 * timestamp, so it can't be replayed to upload somewhere else or forged
 * without the API secret.
 */
export function createUploadSignature(): UploadSignature {
  const env = ensureConfigured();
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder: UPLOAD_FOLDER }, env.apiSecret);

  return { cloudName: env.cloudName, apiKey: env.apiKey, timestamp, signature, folder: UPLOAD_FOLDER };
}

/** Best-effort delete — the caller doesn't need this to succeed to remove an image from a product. */
export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Cloudinary delivery URLs look like:
 *   https://res.cloudinary.com/{cloud}/image/upload/[transforms/]v{version}/{publicId}.{ext}
 * Returns null for anything that doesn't match — notably the seeded
 * Unsplash URLs already in the database, which were never uploaded here
 * and have no Cloudinary asset to delete.
 */
export function extractCloudinaryPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:[^/]+\/)*v\d+\/(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
}
