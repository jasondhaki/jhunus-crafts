// Pure — used both for the live client-side slug preview as the admin
// types a title, and as a server-side normalization step before the
// database uniqueness check.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
