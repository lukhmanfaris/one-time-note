import { describe, it, expect } from "vitest";
import { encryptNote, decryptNote, generateAccessKey } from "../crypto";

describe("generateAccessKey", () => {
  it("generates a 12-character alphanumeric key", () => {
    const key = generateAccessKey();
    expect(key.length).toBe(12);
    expect(key).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("generates unique keys on successive calls", () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateAccessKey()));
    expect(keys.size).toBe(100);
  });
});

describe("encryptNote / decryptNote round-trip", () => {
  it("encrypts and decrypts a simple message", async () => {
    const plaintext = "Hello, world!";
    const key = generateAccessKey();
    const encrypted = await encryptNote(plaintext, key);
    const decrypted = await decryptNote(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });

  it("encrypts and decrypts a message with Unicode", async () => {
    const plaintext = "你好世界 🌍 Привет";
    const key = generateAccessKey();
    const encrypted = await encryptNote(plaintext, key);
    const decrypted = await decryptNote(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });

  it("fails to decrypt with wrong key", async () => {
    const plaintext = "Secret message";
    const key = generateAccessKey();
    const wrongKey = generateAccessKey();
    const encrypted = await encryptNote(plaintext, key);
    await expect(decryptNote(encrypted, wrongKey)).rejects.toThrow();
  });

  it("produces different ciphertexts for same plaintext (random IV/salt)", async () => {
    const plaintext = "Same content";
    const key = generateAccessKey();
    const encrypted1 = await encryptNote(plaintext, key);
    const encrypted2 = await encryptNote(plaintext, key);
    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    expect(encrypted1.salt).not.toBe(encrypted2.salt);
    expect(encrypted1.iv).not.toBe(encrypted2.iv);
  });

  it("handles empty string", async () => {
    const plaintext = "";
    const key = generateAccessKey();
    const encrypted = await encryptNote(plaintext, key);
    const decrypted = await decryptNote(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });

  it("handles very long content", async () => {
    const plaintext = "A".repeat(10000);
    const key = generateAccessKey();
    const encrypted = await encryptNote(plaintext, key);
    const decrypted = await decryptNote(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });
});