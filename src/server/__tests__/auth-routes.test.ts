import { describe, it, expect } from "vitest";
import { app } from "../index";

const mockKV = () => {
  const store = new Map<string, string>();
  return {
    put: async (key: string, value: string, opts?: any) => store.set(key, value),
    get: async (key: string) => store.get(key) ?? null,
    delete: async (key: string) => { store.delete(key); },
  } as unknown as KVNamespace;
};

const mockD1 = () => {
  const users: any[] = [];
  return {
    prepare: (sql: string) => {
      const stmt: any = {
        _binds: [] as any[],
        bind: function (...args: any[]) {
          this._binds = args;
          return this;
        },
        run: async () => {
          if (sql.includes("INSERT INTO users")) {
            const [id, email, passwordHash, tier] = stmt._binds;
            users.push({ id, email, password_hash: passwordHash, tier, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
            return { meta: { changes: 1 } };
          }
          return {};
        },
        first: async () => {
          if (sql.includes("FROM users WHERE email")) {
            return users.find(u => u.email === stmt._binds[0]) || null;
          }
          if (sql.includes("FROM users WHERE id")) {
            return users.find(u => u.id === stmt._binds[0]) || null;
          }
          if (sql.includes("SELECT COUNT")) {
            return { count: 0 };
          }
          return null;
        },
        all: async () => ({ results: [] }),
      };
      return stmt;
    },
  } as unknown as D1Database;
};

const createTestEnv = () => ({
  NOTES_KV: mockKV(),
  REFRESH_KV: mockKV(),
  RESET_KV: mockKV(),
  DB: mockD1(),
  JWT_SECRET: "test-secret-key-for-jwt-signing-minimum-32-chars",
  ENVIRONMENT: "test",
  RESEND_API_KEY: "test-key",
  TURNSTILE_SECRET_KEY: "test-bypass",
});

describe("POST /api/auth/signup", () => {
  it("creates a new user and returns 201", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "SecurePass1", turnstileToken: "test-token" }),
    }, env);

    expect(res.status).toBe(201);
    const body = await res.json() as { user: { email: string; tier: string } };
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe("test@example.com");
    expect(body.user.tier).toBe("free");
  });

  it("rejects signup with missing email", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "SecurePass1", turnstileToken: "test-token" }),
    }, env);

    expect(res.status).toBe(400);
  });

  it("rejects signup with short password", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test2@example.com", password: "short", turnstileToken: "test-token" }),
    }, env);

    expect(res.status).toBe(400);
  });

  it("rejects signup with missing turnstileToken", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test3@example.com", password: "SecurePass1" }),
    }, env);

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("rejects login with missing fields", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }, env);

    expect(res.status).toBe(400);
  });

  it("rejects login with missing turnstileToken", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", password: "password123" }),
    }, env);

    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/me without auth", () => {
  it("returns 401 when no access token is provided", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/auth/me", {}, env);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("returns 200 even without auth", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/auth/logout", {
      method: "POST",
    }, env);
    expect(res.status).toBe(200);
  });
});

describe("POST /api/auth/reset-request", () => {
  it("returns success message even for non-existent email (prevents enumeration)", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/auth/reset-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent@example.com" }),
    }, env);

    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.message).toContain("If an account");
  });

  it("rejects invalid email format", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/auth/reset-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bad-email" }),
    }, env);

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/reset-confirm", () => {
  it("rejects expired or invalid token", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/auth/reset-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "invalid-token", password: "NewSecure1" }),
    }, env);

    expect(res.status).toBe(410);
  });

  it("rejects short password", async () => {
    const env = createTestEnv();
    const res = await app.request("/api/auth/reset-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "some-token", password: "short" }),
    }, env);

    expect(res.status).toBe(400);
  });
});