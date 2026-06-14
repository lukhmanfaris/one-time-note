import { describe, it, expect } from "vitest";
import { app } from "../index";
import { signAccessToken } from "../auth";
import type { AuthPayload } from "../types";

const TEST_SECRET = "test-secret-key-for-jwt-signing-minimum-32-chars";
const TURNSTILE_TOKEN = "test-turnstile-token";

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

function createMockDB() {
  return {
    prepare: () => ({
      bind: function (..._args: unknown[]) { return this; },
      run: async () => ({ meta: { changes: 1 } }),
      first: async () => null,
      all: async () => ({ results: [] }),
    }),
  } as unknown as D1Database;
}

function createTestEnv() {
  return {
    NOTES_KV: createMockKV(),
    REFRESH_KV: createMockKV(),
    RESET_KV: createMockKV(),
    DB: createMockDB(),
    JWT_SECRET: TEST_SECRET,
    ENVIRONMENT: "test",
    RESEND_API_KEY: "test-key",
    TURNSTILE_SECRET_KEY: "test-bypass",
    CRON_SECRET: "test-cron-secret",
  };
}

const LOOKUP_ID_1 = "f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2";
const LOOKUP_ID_2 = "a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3";
const LOOKUP_ID_3 = "b3c4d5e6f7a8b3c4d5e6f7a8b3c4d5e6f7a8b3c4d5e6f7a8b3c4d5e6f7a8b3c4";

describe("Full note lifecycle", () => {
  it("creates a note, retrieves it, then retrieval fails (one-time read)", async () => {
    const env = createTestEnv();

    const createRes = await app.request(
      "/api/notes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertext: "dGVzdCBlbmNyeXB0ZWQgZGF0YQ==",
          salt: "dGVzdHNhbHQ=",
          iv: "dGVzdGl2ZWN0",
          ttl_seconds: 3600,
          lookup_id: LOOKUP_ID_1,
          turnstileToken: TURNSTILE_TOKEN,
        }),
      },
      env
    );

    expect(createRes.status).toBe(201);
    const createBody = (await createRes.json()) as Record<string, unknown>;
    expect(createBody.lookup_id).toBe(LOOKUP_ID_1);
    expect(createBody.expires_at).toBeDefined();

    const getRes = await app.request(`/api/notes/${LOOKUP_ID_1}`, undefined, env);
    expect(getRes.status).toBe(200);
    const getBody = (await getRes.json()) as Record<string, unknown>;
    expect(getBody.ciphertext).toBe("dGVzdCBlbmNyeXB0ZWQgZGF0YQ==");
    expect(getBody.salt).toBe("dGVzdHNhbHQ=");
    expect(getBody.iv).toBe("dGVzdGl2ZWN0");

    const secondGetRes = await app.request(`/api/notes/${LOOKUP_ID_1}`, undefined, env);
    expect(secondGetRes.status).toBe(404);
  });

  it("returns 404 for non-existent key", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/notes/0000000000000000000000000000000000000000000000000000000000000000", undefined, env);
    expect(res.status).toBe(404);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("rejects create with invalid TTL", async () => {
    const env = createTestEnv();
    const res = await app.request(
      "/api/notes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertext: "dGVzdA==",
          salt: "c2FsdA==",
          iv: "aXY=",
          ttl_seconds: 999,
          lookup_id: LOOKUP_ID_2,
          turnstileToken: TURNSTILE_TOKEN,
        }),
      },
      env
    );
    expect(res.status).toBe(400);
  });
});

describe("Tier enforcement on note creation", () => {
  it("allows anonymous user creating a note with 1h TTL", async () => {
    const env = createTestEnv();

    const res = await app.request("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ciphertext: "aGVsbG8gd29ybGQ=",
        salt: "c2FsdA==",
        iv: "aXYxMjM0NTY3",
        ttl_seconds: 3600,
        lookup_id: LOOKUP_ID_3,
        turnstileToken: TURNSTILE_TOKEN,
      }),
    }, env);

    expect(res.status).toBe(201);
  });

  it("rejects anonymous user creating a note with 24h TTL", async () => {
    const env = createTestEnv();

    const res = await app.request("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ciphertext: "aGVsbG8gd29ybGQ=",
        salt: "c2FsdA==",
        iv: "aXYxMjM0NTY3",
        ttl_seconds: 86400,
        lookup_id: "c4d5e6f7a8b9c4d5e6f7a8b9c4d5e6f7a8b9c4d5e6f7a8b9c4d5e6f7a8b9c4d5",
        turnstileToken: TURNSTILE_TOKEN,
      }),
    }, env);

    expect(res.status).toBe(403);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("rejects free user creating a note with 24h TTL", async () => {
    const env = createTestEnv();

    const payload: AuthPayload = {
      userId: "usr_free123456789",
      email: "free@example.com",
      tier: "free",
      sessionId: "sess_free_test",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };
    const token = await signAccessToken(payload, env.JWT_SECRET);

    const res = await app.request("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `access_token=${token}` },
      body: JSON.stringify({
        ciphertext: "aGVsbG8gd29ybGQ=",
        salt: "c2FsdA==",
        iv: "aXYxMjM0NTY3",
        ttl_seconds: 86400,
        lookup_id: "d5e6f7a8b9c0d5e6f7a8b9c0d5e6f7a8b9c0d5e6f7a8b9c0d5e6f7a8b9c0d5e6",
        turnstileToken: TURNSTILE_TOKEN,
      }),
    }, env);

    expect(res.status).toBe(403);
  });
});