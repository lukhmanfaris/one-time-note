import { describe, it, expect } from "vitest";
import { validateCreateNoteRequest } from "../middleware";

describe("validateCreateNoteRequest", () => {
  it("accepts a valid request with turnstileToken", () => {
    const result = validateCreateNoteRequest({
      ciphertext: "aGVsbG8=",
      salt: "c2FsdA==",
      iv: "aXY=",
      ttl_seconds: 3600,
      lookup_id: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      turnstileToken: "test-token",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects missing turnstileToken", () => {
    const result = validateCreateNoteRequest({
      ciphertext: "aGVsbG8=",
      salt: "c2FsdA==",
      iv: "aXY=",
      ttl_seconds: 3600,
      lookup_id: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("turnstileToken");
  });

  it("rejects missing ciphertext", () => {
    const result = validateCreateNoteRequest({
      salt: "c2FsdA==",
      iv: "aXY=",
      ttl_seconds: 3600,
      lookup_id: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      turnstileToken: "test-token",
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
      lookup_id: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      turnstileToken: "test-token",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("ttl_seconds");
  });

  it("rejects lookup_id shorter than 64 characters", () => {
    const result = validateCreateNoteRequest({
      ciphertext: "aGVsbG8=",
      salt: "c2FsdA==",
      iv: "aXY=",
      ttl_seconds: 3600,
      lookup_id: "short",
      turnstileToken: "test-token",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("lookup_id");
  });

  it("rejects lookup_id with non-hex characters", () => {
    const result = validateCreateNoteRequest({
      ciphertext: "aGVsbG8=",
      salt: "c2FsdA==",
      iv: "aXY=",
      ttl_seconds: 3600,
      lookup_id: "g1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6g1b2",
      turnstileToken: "test-token",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("lookup_id");
  });

  it("rejects ciphertext exceeding max size", () => {
    const result = validateCreateNoteRequest({
      ciphertext: "x".repeat(20000),
      salt: "c2FsdA==",
      iv: "aXY=",
      ttl_seconds: 3600,
      lookup_id: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      turnstileToken: "test-token",
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
      lookup_id: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      turnstileToken: "test-token",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("ciphertext");
  });
});