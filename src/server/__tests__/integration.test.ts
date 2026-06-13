import { describe, it, expect } from "vitest";
import app from "../index";
import { signAccessToken } from "../auth";
import type { AuthPayload } from "../types";

const TEST_SECRET = "test-secret-key-for-jwt-signing-minimum-32-chars";

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
    ENVIRONMENT: "development",
    RESEND_API_KEY: "test-key",
  };
}

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
          access_key: "LfcyclTest1X",
        }),
      },
      env
    );

    expect(createRes.status).toBe(201);
    const createBody = await createRes.json();
    expect(createBody.access_key).toBe("LfcyclTest1X");
    expect(createBody.expires_at).toBeDefined();

    const getRes = await app.request("/api/notes/LfcyclTest1X", undefined, env);
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.ciphertext).toBe("dGVzdCBlbmNyeXB0ZWQgZGF0YQ==");
    expect(getBody.salt).toBe("dGVzdHNhbHQ=");
    expect(getBody.iv).toBe("dGVzdGl2ZWN0");

    const secondGetRes = await app.request("/api/notes/LfcyclTest1X", undefined, env);
    expect(secondGetRes.status).toBe(404);
  });

  it("returns 404 for non-existent key", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/notes/NonExistKey1X", undefined, env);
    expect(res.status).toBe(404);
    const body = await res.json();
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
          access_key: "InvalidTTLT1",
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
        access_key: "AnonNoteOK1X",
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
        access_key: "AnonNoteBd1X",
      }),
    }, env);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("rejects free user creating a note with 24h TTL", async () => {
    const env = createTestEnv();

    const payload: AuthPayload = {
      userId: "usr_free123456789",
      email: "free@example.com",
      tier: "free",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };
    const token = await signAccessToken(payload, env.JWT_SECRET);

    const res = await app.request("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `__Host-access_token=${token}` },
      body: JSON.stringify({
        ciphertext: "aGVsbG8gd29ybGQ=",
        salt: "c2FsdA==",
        iv: "aXYxMjM0NTY3",
        ttl_seconds: 86400,
        access_key: "FreeUsrTTL1X",
      }),
    }, env);

    expect(res.status).toBe(403);
  });
});