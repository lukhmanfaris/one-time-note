import { describe, it, expect } from "vitest";
import app from "../index";

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

describe("POST /api/notes", () => {
  it("creates a note and returns 201 with access_key", async () => {
    const kv = createMockKV();
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
          access_key: "aB3xK9mQwP2n",
        }),
      },
      { NOTES_KV: kv }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.access_key).toBe("aB3xK9mQwP2n");
    expect(body.expires_at).toBeDefined();
  });

  it("rejects invalid TTL with 400", async () => {
    const kv = createMockKV();
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
          access_key: "aB3xK9mQwP2n",
        }),
      },
      { NOTES_KV: kv }
    );
    expect(res.status).toBe(400);
  });

  it("rejects missing fields with 400", async () => {
    const kv = createMockKV();
    const res = await app.request(
      "/api/notes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ttl_seconds: 3600 }),
      },
      { NOTES_KV: kv }
    );
    expect(res.status).toBe(400);
  });

  it("rejects invalid access_key with 400", async () => {
    const kv = createMockKV();
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
          access_key: "short",
        }),
      },
      { NOTES_KV: kv }
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/notes/:key", () => {
  it("returns 404 for non-existent key", async () => {
    const kv = createMockKV();
    const res = await app.request("/api/notes/nonexistentkey1", undefined, {
      NOTES_KV: kv,
    });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });
});