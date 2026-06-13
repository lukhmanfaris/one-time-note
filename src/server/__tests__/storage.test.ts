import { describe, it, expect, beforeEach } from "vitest";
import { NoteStorage } from "../storage";

describe("NoteStorage", () => {
  let storage: NoteStorage;
  let kv: KVNamespace;

  beforeEach(() => {
    const store = new Map<string, { value: string; expiration?: number }>();
    kv = {
      async put(key: string, value: string, options?: { expirationTtl?: number }) {
        const ttl = (options as any)?.expirationTtl;
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
    storage = new NoteStorage(kv);
  });

  it("saves and retrieves a note", async () => {
    const data = { ciphertext: "abc", salt: "def", iv: "ghi" };
    await storage.save("testkey123456", data, 3600);
    const result = await storage.retrieve("testkey123456");
    expect(result).not.toBeNull();
    expect(result!.ciphertext).toBe("abc");
    expect(result!.salt).toBe("def");
    expect(result!.iv).toBe("ghi");
  });

  it("deletes note after retrieval (one-time read)", async () => {
    const data = { ciphertext: "abc", salt: "def", iv: "ghi" };
    await storage.save("testkey123456", data, 3600);
    await storage.retrieve("testkey123456");
    const second = await storage.retrieve("testkey123456");
    expect(second).toBeNull();
  });

  it("returns null for non-existent key", async () => {
    const result = await storage.retrieve("nonexistentke1");
    expect(result).toBeNull();
  });

  it("saves note with TTL metadata", async () => {
    const data = { ciphertext: "abc", salt: "def", iv: "ghi" };
    await storage.save("testkey123456", data, 3600);
    const raw = await kv.get("note:testkey123456");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.ciphertext).toBe("abc");
    expect(parsed.salt).toBe("def");
    expect(parsed.iv).toBe("ghi");
  });
});