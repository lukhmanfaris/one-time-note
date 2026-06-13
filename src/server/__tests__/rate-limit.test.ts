import { describe, it, expect } from "vitest";
import { rateLimiter } from "../middleware";

describe("rateLimiter", () => {
  it("allows requests under the limit", () => {
    const limiter = rateLimiter({ windowMs: 60000, maxRequests: 5 });
    const key = "192.168.1.1";
    for (let i = 0; i < 4; i++) {
      expect(limiter(key).allowed).toBe(true);
    }
  });

  it("blocks requests over the limit", () => {
    const limiter = rateLimiter({ windowMs: 60000, maxRequests: 3 });
    const key = "192.168.1.2";
    expect(limiter(key).allowed).toBe(true);
    expect(limiter(key).allowed).toBe(true);
    expect(limiter(key).allowed).toBe(true);
    expect(limiter(key).allowed).toBe(false);
  });

  it("resets after window expires", () => {
    const limiter = rateLimiter({ windowMs: 100, maxRequests: 2 });
    const key = "192.168.1.3";
    expect(limiter(key).allowed).toBe(true);
    expect(limiter(key).allowed).toBe(true);
    expect(limiter(key).allowed).toBe(false);
  });

  it("tracks different keys independently", () => {
    const limiter = rateLimiter({ windowMs: 60000, maxRequests: 1 });
    expect(limiter("key1").allowed).toBe(true);
    expect(limiter("key2").allowed).toBe(true);
    expect(limiter("key1").allowed).toBe(false);
  });

  it("returns retry-after seconds when blocked", () => {
    const limiter = rateLimiter({ windowMs: 60000, maxRequests: 1 });
    limiter("192.168.1.4");
    const result = limiter("192.168.1.4");
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThanOrEqual(1);
    expect(result.retryAfter).toBeLessThanOrEqual(60);
  });
});