import { describe, it, expect } from "vitest";
import { validateSignup, validateLogin, validateResetRequest, validateResetConfirm } from "../src/middleware";

describe("validateSignup", () => {
  it("accepts valid signup data", () => {
    const result = validateSignup({ email: "user@example.com", password: "SecureP@ss1" });
    expect(result.valid).toBe(true);
  });

  it("rejects missing email", () => {
    const result = validateSignup({ password: "SecureP@ss1" });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("email");
  });

  it("rejects invalid email format", () => {
    const result = validateSignup({ email: "notanemail", password: "SecureP@ss1" });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("email");
  });

  it("rejects short password", () => {
    const result = validateSignup({ email: "user@example.com", password: "short1" });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("8");
  });

  it("rejects long password", () => {
    const result = validateSignup({ email: "user@example.com", password: "A".repeat(129) });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("128");
  });

  it("rejects missing password", () => {
    const result = validateSignup({ email: "user@example.com" });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Password");
  });
});

describe("validateLogin", () => {
  it("accepts valid login data", () => {
    const result = validateLogin({ email: "user@example.com", password: "anypassword" });
    expect(result.valid).toBe(true);
  });

  it("rejects missing email", () => {
    const result = validateLogin({ password: "anypassword" });
    expect(result.valid).toBe(false);
  });

  it("rejects missing password", () => {
    const result = validateLogin({ email: "user@example.com" });
    expect(result.valid).toBe(false);
  });
});

describe("validateResetRequest", () => {
  it("accepts valid email", () => {
    const result = validateResetRequest({ email: "user@example.com" });
    expect(result.valid).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = validateResetRequest({ email: "bad-email" });
    expect(result.valid).toBe(false);
  });
});

describe("validateResetConfirm", () => {
  it("accepts valid reset confirmation", () => {
    const result = validateResetConfirm({ token: "valid-reset-token", password: "NewSecure1" });
    expect(result.valid).toBe(true);
  });

  it("rejects missing token", () => {
    const result = validateResetConfirm({ password: "NewSecure1" });
    expect(result.valid).toBe(false);
  });

  it("rejects short password", () => {
    const result = validateResetConfirm({ token: "valid-token", password: "short" });
    expect(result.valid).toBe(false);
  });
});