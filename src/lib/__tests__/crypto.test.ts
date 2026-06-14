import { describe, it, expect } from "vitest";
import { encryptNote, decryptNote, generateEncryptionKey, deriveLookupId } from "../crypto";

describe("generateEncryptionKey", () => {
  it("generates a base64url-encoded string of 32 bytes", () => {
    const key = generateEncryptionKey();
    expect(key.length).toBeGreaterThan(0);
    expect(key).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generates unique keys on successive calls", () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateEncryptionKey()));
    expect(keys.size).toBe(100);
  });
});

describe("deriveLookupId", () => {
  it("produces a 64-character hex string from an encryption key", async () => {
    const key = generateEncryptionKey();
    const lookupId = await deriveLookupId(key);
    expect(lookupId.length).toBe(64);
    expect(lookupId).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces the same lookup ID for the same encryption key", async () => {
    const key = generateEncryptionKey();
    const id1 = await deriveLookupId(key);
    const id2 = await deriveLookupId(key);
    expect(id1).toBe(id2);
  });

  it("produces different lookup IDs for different encryption keys", async () => {
    const key1 = generateEncryptionKey();
    const key2 = generateEncryptionKey();
    const id1 = await deriveLookupId(key1);
    const id2 = await deriveLookupId(key2);
    expect(id1).not.toBe(id2);
  });
});

describe("encryptNote / decryptNote round-trip", () => {
  it("encrypts and decrypts a simple message", async () => {
    const plaintext = "Hello, world!";
    const key = generateEncryptionKey();
    const encrypted = await encryptNote(plaintext, key);
    const decrypted = await decryptNote(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });

  it("encrypts and decrypts a message with Unicode", async () => {
    const plaintext = "你好世界 🌍 Привет";
    const key = generateEncryptionKey();
    const encrypted = await encryptNote(plaintext, key);
    const decrypted = await decryptNote(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });

  it("fails to decrypt with wrong key", async () => {
    const plaintext = "Secret message";
    const key = generateEncryptionKey();
    const wrongKey = generateEncryptionKey();
    const encrypted = await encryptNote(plaintext, key);
    await expect(decryptNote(encrypted, wrongKey)).rejects.toThrow();
  });

  it("produces different ciphertexts for same plaintext (random IV/salt)", async () => {
    const plaintext = "Same content";
    const key = generateEncryptionKey();
    const encrypted1 = await encryptNote(plaintext, key);
    const encrypted2 = await encryptNote(plaintext, key);
    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    expect(encrypted1.salt).not.toBe(encrypted2.salt);
    expect(encrypted1.iv).not.toBe(encrypted2.iv);
  });

  it("handles empty string", async () => {
    const plaintext = "";
    const key = generateEncryptionKey();
    const encrypted = await encryptNote(plaintext, key);
    const decrypted = await decryptNote(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });

  it("handles very long content", async () => {
    const plaintext = "A".repeat(10000);
    const key = generateEncryptionKey();
    const encrypted = await encryptNote(plaintext, key);
    const decrypted = await decryptNote(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });
});

describe("full zero-knowledge flow", () => {
  it("derives consistent lookup ID and decrypts with the same encryption key", async () => {
    const key = generateEncryptionKey();
    const lookupId = await deriveLookupId(key);
    expect(lookupId.length).toBe(64);

    const plaintext = "Zero-knowledge test message";
    const encrypted = await encryptNote(plaintext, key);
    const decrypted = await decryptNote(encrypted, key);
    expect(decrypted).toBe(plaintext);

    const lookupId2 = await deriveLookupId(key);
    expect(lookupId2).toBe(lookupId);
  });
});