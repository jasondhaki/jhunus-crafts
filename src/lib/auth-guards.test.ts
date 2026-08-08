import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("../../auth", () => ({ auth: authMock }));

const { redirectMock, forbiddenMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(() => {
    throw new Error("REDIRECT");
  }),
  forbiddenMock: vi.fn(() => {
    throw new Error("FORBIDDEN");
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  forbidden: forbiddenMock,
}));

const { requireUser, requireAdmin } = await import("./auth-guards");

describe("requireUser", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockClear();
  });

  it("returns the session user when authenticated", async () => {
    authMock.mockResolvedValue({ user: { id: "1", role: "CUSTOMER" } });
    const user = await requireUser();
    expect(user).toEqual({ id: "1", role: "CUSTOMER" });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to /login when there is no session", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login when the session has no user", async () => {
    authMock.mockResolvedValue({ user: null });
    await expect(requireUser()).rejects.toThrow("REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});

describe("requireAdmin", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockClear();
    forbiddenMock.mockClear();
  });

  it("returns the user when the role is ADMIN", async () => {
    authMock.mockResolvedValue({ user: { id: "1", role: "ADMIN" } });
    const user = await requireAdmin();
    expect(user).toEqual({ id: "1", role: "ADMIN" });
    expect(forbiddenMock).not.toHaveBeenCalled();
  });

  it("calls forbidden() when the role is CUSTOMER", async () => {
    authMock.mockResolvedValue({ user: { id: "1", role: "CUSTOMER" } });
    await expect(requireAdmin()).rejects.toThrow("FORBIDDEN");
    expect(forbiddenMock).toHaveBeenCalledOnce();
  });

  it("redirects to /login before checking role when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/login");
    expect(forbiddenMock).not.toHaveBeenCalled();
  });
});
