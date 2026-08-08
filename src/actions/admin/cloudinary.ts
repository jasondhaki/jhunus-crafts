"use server";

import { requireAdmin } from "@/lib/auth-guards";
import {
  createUploadSignature,
  deleteCloudinaryAsset,
  extractCloudinaryPublicId,
  type UploadSignature,
} from "@/lib/cloudinary";

// The client uploads directly to Cloudinary (never through our server —
// no reason to proxy image bytes through a Next.js route), but the
// signature that authorizes that upload can only be minted server-side
// with the API secret. requireAdmin() here is what stops a non-admin from
// ever getting a valid signature to upload arbitrary files to our account.
export async function getUploadSignatureAction(): Promise<UploadSignature> {
  await requireAdmin();
  return createUploadSignature();
}

// Best-effort: removing an image from a product shouldn't be blocked on
// Cloudinary's API responding. Silently no-ops for non-Cloudinary URLs
// (e.g. the seeded Unsplash images).
export async function deleteProductImageAction(url: string): Promise<void> {
  await requireAdmin();
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return;

  await deleteCloudinaryAsset(publicId).catch((error) => {
    console.error(`Failed to delete Cloudinary asset ${publicId}`, error);
  });
}
