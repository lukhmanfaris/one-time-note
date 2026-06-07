import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { authGuard, requireTier } from "../src/auth-middleware";
import { signAccessToken } from "../src/auth";
import type { AuthPayload, Env } from "../src/types";

const TEST_SECRET = "test-secret-key-for-jwt-signing-minimum-32-chars";

function createAuthenticatedApp() {
  const app = new Hono<{ Bindings: Env; Variables: { user: AuthPayload } }>();

  app.use("/api/protected", authGuard());
  app.get("/api/protected", (c) => {
    const user = c.get("user");
    return c.json({ userId: user.userId, email: user.email, tier: user.tier });
  });

  app.use("/api/pro-only", authGuard());
  app.use("/api/pro-only", requireTier("pro"));
  app.get("/api/pro-only", (c) => {
    return c.json({ message: "pro content" });
  });

  return app;
}

describe("authGuard", () => {
  it("returns 401 when no access token cookie is present", async () => {
    const app = createAuthenticatedApp();
    const res = await app.request("/api/protected", {}, { JWT_SECRET: TEST_SECRET } as any);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 when access token is invalid", async () => {
    const app = createAuthenticatedApp();
    const res = await app.request("/api/protected", {
      headers: { Cookie: "__Host-access_token=invalid-token" },
    }, { JWT_SECRET: TEST_SECRET } as any);
    expect(res.status).toBe(401);
  });

  it("allows request with valid access token", async () => {
    const app = createAuthenticatedApp();
    const payload: AuthPayload = {
      userId: "usr_abc123",
      email: "test@example.com",
      tier: "free",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };
    const token = await signAccessToken(payload, TEST_SECRET);

    const res = await app.request("/api/protected", {
      headers: { Cookie: `__Host-access_token=${token}` },
    }, { JWT_SECRET: TEST_SECRET } as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe("usr_abc123");
    expect(body.email).toBe("test@example.com");
  });
});

describe("requireTier", () => {
  it("allows pro user to access pro-only endpoint", async () => {
    const app = createAuthenticatedApp();
    const payload: AuthPayload = {
      userId: "usr_pro123",
      email: "pro@example.com",
      tier: "pro",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };
    const token = await signAccessToken(payload, TEST_SECRET);

    const res = await app.request("/api/pro-only", {
      headers: { Cookie: `__Host-access_token=${token}` },
    }, { JWT_SECRET: TEST_SECRET } as any);

    expect(res.status).toBe(200);
  });

  it("blocks free user from pro-only endpoint", async () => {
    const app = createAuthenticatedApp();
    const payload: AuthPayload = {
      userId: "usr_free123",
      email: "free@example.com",
      tier: "free",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };
    const token = await signAccessToken(payload, TEST_SECRET);

    const res = await app.request("/api/pro-only", {
      headers: { Cookie: `__Host-access_token=${token}` },
    }, { JWT_SECRET: TEST_SECRET } as any);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });
});