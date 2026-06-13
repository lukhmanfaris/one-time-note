import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  verifyAccessToken,
  generateUserId,
} from "../auth";
import type { AuthPayload } from "../types";

const TEST_JWT_SECRET = "test-secret-key-for-jwt-signing-minimum-32-chars";

describe("hashPassword / verifyPassword", () => {
  it("hashes a password and verifies it correctly", async () => {
    const hash = await hashPassword("MySecureP@ss123");
    expect(hash).toMatch(/^\$pbkdf2-sha256\$i=100000\$/);
    expect(hash).not.toBe("MySecureP@ss123");

    const isValid = await verifyPassword("MySecureP@ss123", hash);
    expect(isValid).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("CorrectHorseBatteryStaple");
    const isValid = await verifyPassword("wrong-password", hash);
    expect(isValid).toBe(false);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const hash1 = await hashPassword("same-password");
    const hash2 = await hashPassword("same-password");
    expect(hash1).not.toBe(hash2);
  });
});

describe("signAccessToken / verifyAccessToken", () => {
  it("signs and verifies a JWT access token", async () => {
    const payload: AuthPayload = {
      userId: "usr_abc123",
      email: "test@example.com",
      tier: "free",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };

    const token = await signAccessToken(payload, TEST_JWT_SECRET);
    expect(typeof token).toBe("string");

    const decoded = await verifyAccessToken(token, TEST_JWT_SECRET);
    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe("usr_abc123");
    expect(decoded!.email).toBe("test@example.com");
    expect(decoded!.tier).toBe("free");
  });

  it("rejects a token signed with a different secret", async () => {
    const payload: AuthPayload = {
      userId: "usr_abc123",
      email: "test@example.com",
      tier: "free",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };

    const token = await signAccessToken(payload, TEST_JWT_SECRET);
    const decoded = await verifyAccessToken(token, "wrong-secret-key-that-is-long-enough-for-hmac");
    expect(decoded).toBeNull();
  });

  it("rejects an expired token", async () => {
    const payload: AuthPayload = {
      userId: "usr_abc123",
      email: "test@example.com",
      tier: "free",
      iat: Math.floor(Date.now() / 1000) - 3600,
      exp: Math.floor(Date.now() / 1000) - 1800,
    };

    const token = await signAccessToken(payload, TEST_JWT_SECRET);
    const decoded = await verifyAccessToken(token, TEST_JWT_SECRET);
    expect(decoded).toBeNull();
  });

  it("rejects a malformed token", async () => {
    const decoded = await verifyAccessToken("not-a-valid-token", TEST_JWT_SECRET);
    expect(decoded).toBeNull();
  });
});

describe("generateUserId", () => {
  it("generates a user ID with usr_ prefix", () => {
    const id = generateUserId();
    expect(id).toMatch(/^usr_[a-zA-Z0-9]{24}$/);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateUserId()));
    expect(ids.size).toBe(100);
  });
});