import { describe, it, expect } from "vitest";
import { app } from "../index";

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
    JWT_SECRET: "test-secret-key-for-jwt-signing-minimum-32-chars",
    ENVIRONMENT: "test",
    RESEND_API_KEY: "test-key",
    TURNSTILE_SECRET_KEY: "test-bypass",
    CRON_SECRET: "test-cron-secret",
  };
}

const LOOKUP_ID_1 = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
const LOOKUP_ID_2 = "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3";
const LOOKUP_ID_3 = "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4";
const LOOKUP_ID_DUP = "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5";
const TURNSTILE_TOKEN = "test-turnstile-token";

describe("POST /api/notes", () => {
  it("creates a note and returns 201 with lookup_id", async () => {
    const env = createTestEnv();
    const res = await app.request(
      "/api/notes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertext: "aGVsbG8gd29ybGQ=",
          salt: "c2FsdA==",
          iv: "aXYxMjM0NTY3",
          ttl_seconds: 3600,
          lookup_id: LOOKUP_ID_1,
          turnstileToken: TURNSTILE_TOKEN,
        }),
      },
      env
    );
    expect(res.status).toBe(201);
    const body = await res.json() as Record<string, unknown>;
    expect(body.lookup_id).toBe(LOOKUP_ID_1);
    expect(body.expires_at).toBeDefined();
  });

  it("rejects invalid TTL with 400", async () => {
    const env = createTestEnv();
    const res = await app.request(
      "/api/notes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertext: "aGVsbG8=",
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

  it("rejects missing fields with 400", async () => {
    const env = createTestEnv();
    const res = await app.request(
      "/api/notes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ttl_seconds: 3600 }),
      },
      env
    );
    expect(res.status).toBe(400);
  });

  it("rejects invalid lookup_id with 400", async () => {
    const env = createTestEnv();
    const res = await app.request(
      "/api/notes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertext: "aGVsbG8=",
          salt: "c2FsdA==",
          iv: "aXY=",
          ttl_seconds: 3600,
          lookup_id: "short",
          turnstileToken: TURNSTILE_TOKEN,
        }),
      },
      env
    );
    expect(res.status).toBe(400);
  });

  it("rejects missing turnstileToken with 400", async () => {
    const env = createTestEnv();
    const res = await app.request(
      "/api/notes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertext: "aGVsbG8=",
          salt: "c2FsdA==",
          iv: "aXY=",
          ttl_seconds: 3600,
          lookup_id: LOOKUP_ID_1,
        }),
      },
      env
    );
    expect(res.status).toBe(400);
  });

  it("rejects duplicate lookup_id with 409", async () => {
    const env = createTestEnv();
    const body = {
      ciphertext: "aGVsbG8gd29ybGQ=",
      salt: "c2FsdA==",
      iv: "aXYxMjM0NTY3",
      ttl_seconds: 3600,
      lookup_id: LOOKUP_ID_DUP,
      turnstileToken: TURNSTILE_TOKEN,
    };
    const res1 = await app.request(
      "/api/notes",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
      env
    );
    expect(res1.status).toBe(201);

    const res2 = await app.request(
      "/api/notes",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, ciphertext: "b3RoZXIgZGF0YQ==" }) },
      env
    );
    expect(res2.status).toBe(409);
    const res2Body = await res2.json() as { error: { code: string } };
    expect(res2Body.error.code).toBe("CONFLICT");
  });
});

describe("GET /api/notes/:lookupId", () => {
  it("returns 404 for non-existent lookup_id", async () => {
    const env = createTestEnv();
    const res = await app.request(
      "/api/notes/0000000000000000000000000000000000000000000000000000000000000000",
      undefined,
      env
    );
    expect(res.status).toBe(404);
  });

  it("retrieves an existing note and returns 200", async () => {
    const env = createTestEnv();
    const createRes = await app.request(
      "/api/notes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertext: "dGVzdCBkYXRh",
          salt: "c2FsdA==",
          iv: "aXYxMjM0NTY3",
          ttl_seconds: 3600,
          lookup_id: LOOKUP_ID_3,
          turnstileToken: TURNSTILE_TOKEN,
        }),
      },
      env
    );
    expect(createRes.status).toBe(201);

    const res = await app.request(`/api/notes/${LOOKUP_ID_3}`, undefined, env);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.ciphertext).toBe("dGVzdCBkYXRh");
    expect(body.salt).toBe("c2FsdA==");
    expect(body.iv).toBe("aXYxMjM0NTY3");
  });

  it("returns 404 when retrieving a note for the second time (one-time read)", async () => {
    const env = createTestEnv();
    const oneTimeId = "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6";
    const createRes = await app.request(
      "/api/notes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertext: "dGVzdCBkYXRh",
          salt: "c2FsdA==",
          iv: "aXYxMjM0NTY3",
          ttl_seconds: 3600,
          lookup_id: oneTimeId,
          turnstileToken: TURNSTILE_TOKEN,
        }),
      },
      env
    );
    expect(createRes.status).toBe(201);

    const firstRes = await app.request(`/api/notes/${oneTimeId}`, undefined, env);
    expect(firstRes.status).toBe(200);

    const secondRes = await app.request(`/api/notes/${oneTimeId}`, undefined, env);
    expect(secondRes.status).toBe(404);
  });
});

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe("ok");
  });
});