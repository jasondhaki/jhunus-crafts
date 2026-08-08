import { describe, expect, it } from "vitest";
import { extractCloudinaryPublicId } from "./cloudinary";

describe("extractCloudinaryPublicId", () => {
  it("extracts the public id, including a folder path, from a versioned delivery URL", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1699999999/jhunus-crafts/products/abc123.jpg";
    expect(extractCloudinaryPublicId(url)).toBe("jhunus-crafts/products/abc123");
  });

  it("extracts the public id when transformation segments precede the version", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/w_600,c_fill/v1699999999/products/abc123.png";
    expect(extractCloudinaryPublicId(url)).toBe("products/abc123");
  });

  it("returns null for a non-Cloudinary URL (e.g. the seeded Unsplash images)", () => {
    const url = "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80";
    expect(extractCloudinaryPublicId(url)).toBeNull();
  });

  it("returns null for a Cloudinary-hosted URL missing the expected /upload/ segment", () => {
    expect(extractCloudinaryPublicId("https://res.cloudinary.com/demo/raw/other/v1/abc.pdf")).toBeNull();
  });
});
