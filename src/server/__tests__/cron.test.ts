import { describe, it, expect } from "vitest";
import { app } from "../index";

function createMockDB() {
  return {
    prepare: () => ({
      bind: function (..._args: unknown[]) { return this; },
      run: async () => ({ meta: { changes: 3 } }),
      first: async () => null,
      all: async () => ({ results: [] }),
    }),
  } as unknown as D1Database;
}

function createMockKV() {
  const store = new Map<string, { value: string; expiration?: number }>();
  return {
    async put(key: string, value: string, options?: { expirationTtl?: number }) {
      const ttl = options?.expirationTtl;
      store.set(key, { value, expiration: ttl ? Math.floor(Date.now() / 1000) + ttl : undefined });
    },
    async get(key: string) {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiration && Date.now() / 1000 > entry.expiration) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async delete(key: string) {
      store.delete(key);
    },
  } as unknown as KVNamespace;
}

function createTestEnv() {
  return {
    NOTES_KV: createMockKV(),
    REFRESH_KV: createMockKV(),
    RESET_KV: createMockKV(),
    DB: createMockDB(),
    JWT_SECRET: "test-secret-key-for-jwt-signing-minimum-32-chars",
    ENVIRONMENT: "test",
    RESEND_API_KEY: "test-key",
    TURNSTILE_SECRET_KEY: "test-bypass",
    CRON_SECRET: "test-cron-secret",
  };
}

describe("POST /api/cron/sweep", () => {
  it("returns 401 when no Authorization header is provided", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/cron/sweep", { method: "POST" }, env);
    expect(res.status).toBe(401);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 when Authorization header has wrong scheme", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/cron/sweep", {
      method: "POST",
      headers: { Authorization: "Basic dGVzdDp0ZXN0" },
    }, env);
    expect(res.status).toBe(401);
  });

  it("returns 401 when cron secret is incorrect", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/cron/sweep", {
      method: "POST",
      headers: { Authorization: "Bearer wrong-secret" },
    }, env);
    expect(res.status).toBe(401);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("sweeps expired notes and returns 200 with correct secret", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/cron/sweep", {
      method: "POST",
      headers: { Authorization: "Bearer test-cron-secret" },
    }, env);
    expect(res.status).toBe(200);
    const body = await res.json() as { success: boolean; deleted: number };
    expect(body.success).toBe(true);
    expect(typeof body.deleted).toBe("number");
  });

  it("returns 401 when secret is empty string", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/cron/sweep", {
      method: "POST",
      headers: { Authorization: "Bearer " },
    }, env);
    expect(res.status).toBe(401);
  });
});