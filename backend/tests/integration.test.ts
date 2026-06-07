import { describe, it, expect } from "vitest";
import app from "../src/index";

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

describe("Full note lifecycle", () => {
  it("creates a note, retrieves it, then retrieval fails (one-time read)", async () => {
    const kv = createMockKV();

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
      { NOTES_KV: kv }
    );

    expect(createRes.status).toBe(201);
    const createBody = await createRes.json();
    expect(createBody.access_key).toBe("LfcyclTest1X");
    expect(createBody.expires_at).toBeDefined();

    const getRes = await app.request("/api/notes/LfcyclTest1X", undefined, {
      NOTES_KV: kv,
    });
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.ciphertext).toBe("dGVzdCBlbmNyeXB0ZWQgZGF0YQ==");
    expect(getBody.salt).toBe("dGVzdHNhbHQ=");
    expect(getBody.iv).toBe("dGVzdGl2ZWN0");

    const secondGetRes = await app.request("/api/notes/LfcyclTest1X", undefined, {
      NOTES_KV: kv,
    });
    expect(secondGetRes.status).toBe(404);
  });

  it("returns 404 for non-existent key", async () => {
    const kv = createMockKV();
    const res = await app.request("/api/notes/NonExistKey1X", undefined, {
      NOTES_KV: kv,
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("rejects create with invalid TTL", async () => {
    const kv = createMockKV();
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
          access_key: "InvalidTTLTst1",
        }),
      },
      { NOTES_KV: kv }
    );
    expect(res.status).toBe(400);
  });
});