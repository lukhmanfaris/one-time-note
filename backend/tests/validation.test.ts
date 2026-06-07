import { describe, it, expect } from "vitest";
import { validateCreateNoteRequest } from "../src/middleware";

describe("validateCreateNoteRequest", () => {
  it("accepts a valid request", () => {
    const result = validateCreateNoteRequest({
      ciphertext: "aGVsbG8=",
      salt: "c2FsdA==",
      iv: "aXY=",
      ttl_seconds: 3600,
      access_key: "aB3xK9mQwP2n",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects missing ciphertext", () => {
    const result = validateCreateNoteRequest({
      salt: "c2FsdA==",
      iv: "aXY=",
      ttl_seconds: 3600,
      access_key: "aB3xK9mQwP2n",
    } as any);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("ciphertext");
  });

  it("rejects invalid TTL (not in allowed list)", () => {
    const result = validateCreateNoteRequest({
      ciphertext: "aGVsbG8=",
      salt: "c2FsdA==",
      iv: "aXY=",
      ttl_seconds: 999,
      access_key: "aB3xK9mQwP2n",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("ttl_seconds");
  });

  it("rejects access key shorter than 12 characters", () => {
    const result = validateCreateNoteRequest({
      ciphertext: "aGVsbG8=",
      salt: "c2FsdA==",
      iv: "aXY=",
      ttl_seconds: 3600,
      access_key: "short",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("access_key");
  });

  it("rejects access key with non-alphanumeric characters", () => {
    const result = validateCreateNoteRequest({
      ciphertext: "aGVsbG8=",
      salt: "c2FsdA==",
      iv: "aXY=",
      ttl_seconds: 3600,
      access_key: "aB3xK9mQwP2!",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("access_key");
  });

  it("rejects ciphertext exceeding max size", () => {
    const result = validateCreateNoteRequest({
      ciphertext: "x".repeat(20000),
      salt: "c2FsdA==",
      iv: "aXY=",
      ttl_seconds: 3600,
      access_key: "aB3xK9mQwP2n",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("size");
  });

  it("rejects empty base64 fields", () => {
    const result = validateCreateNoteRequest({
      ciphertext: "",
      salt: "c2FsdA==",
      iv: "aXY=",
      ttl_seconds: 3600,
      access_key: "aB3xK9mQwP2n",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("ciphertext");
  });
});