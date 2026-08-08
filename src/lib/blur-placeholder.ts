// A brand-toned shimmer, used as next/image's blurDataURL until we have
// real per-image blur hashes generated at upload time (e.g. via Cloudinary).
function shimmerSvg(width: number, height: number): string {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"><stop stop-color="#8C6D46" offset="20%" stop-opacity="0.15"/><stop stop-color="#8C6D46" offset="50%" stop-opacity="0.35"/><stop stop-color="#8C6D46" offset="70%" stop-opacity="0.15"/></linearGradient></defs><rect width="${width}" height="${height}" fill="#FBF9F5"/><rect width="${width}" height="${height}" fill="url(#g)"/></svg>`;
}

export function shimmerDataUrl(width: number, height: number): string {
  return `data:image/svg+xml;base64,${Buffer.from(shimmerSvg(width, height)).toString("base64")}`;
}
