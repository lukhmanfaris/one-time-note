import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import type { Env, AuthPayload, UserPublic, SessionPublic } from "../types";
import { UserDatabase } from "../database";
import { authGuard } from "../auth-middleware";
import { validateSignup, validateLogin, validateResetRequest, validateResetConfirm } from "../middleware";
import { sendPasswordResetEmail } from "../email";
import { verifyTurnstile } from "../turnstile";
import { RESET_TOKEN_EXPIRY_SECONDS, ACCESS_TOKEN_EXPIRY_SECONDS, REFRESH_TOKEN_EXPIRY_SECONDS } from "../types";
import { hashPassword, verifyPassword, signAccessToken, verifyAccessToken, generateUserId, generateRefreshToken } from "../auth";
import { getAuthCookieName, getRefreshCookieName, getAuthCookiePattern, getRefreshCookiePattern } from "../cookies";
import {
  createSession,
  findSessionByToken,
  updateSessionActivity,
  deleteSessionById,
  deleteAllSessionsExcept,
  rotateSessionToken,
  getClientIp,
} from "../sessions";

export const authRoutes = new Hono<{ Bindings: Env; Variables: { user: AuthPayload } }>();

authRoutes.post("/signup", async (c) => {
  const missingBindings: string[] = [];
  if (!c.env.DB) missingBindings.push("DB");
  if (!c.env.JWT_SECRET) missingBindings.push("JWT_SECRET");
  if (!c.env.REFRESH_KV) missingBindings.push("REFRESH_KV");
  if (!c.env.ENVIRONMENT) missingBindings.push("ENVIRONMENT");
  if (missingBindings.length > 0) {
    console.error("Missing config:", missingBindings.join(", "));
    return c.json(
      { error: { status: 500, code: "CONFIG_ERROR", message: `Missing config: ${missingBindings.join(", ")}` } },
      500
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch (_err) {
    return c.json(
      { error: { status: 400, code: "BAD_REQUEST", message: "Invalid JSON in request body" } },
      400
    );
  }

  const validation = validateSignup(body);
  if (!validation.valid) {
    return c.json({ error: { status: 400, code: "VALIDATION_ERROR", message: validation.error! } }, 400);
  }

  const { email, password, turnstileToken } = body as { email: string; password: string; turnstileToken: string };

  try {
    const turnstileValid = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET_KEY);
    if (!turnstileValid) {
      return c.json({ error: { status: 403, code: "FORBIDDEN", message: "Turnstile verification failed" } }, 403);
    }

    const userDb = new UserDatabase(c.env.DB);

    const existingUser = await userDb.findUserByEmail(email);
    if (existingUser) {
      return c.json({ error: { status: 409, code: "CONFLICT", message: "An account with this email already exists" } }, 409);
    }

    const passwordHash = await hashPassword(password);
    const userId = generateUserId();

    const user = await userDb.createUser({
      id: userId,
      email,
      passwordHash,
      tier: "free",
    });

    const now = Math.floor(Date.now() / 1000);
    const refreshToken = generateRefreshToken();
    const ip = getClientIp(c);
    const userAgent = c.req.header("User-Agent") || "";
    const sessionId = await createSession(c.env.REFRESH_KV, user.id, refreshToken, ip, userAgent || "", now);

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      tier: user.tier,
      sessionId,
      iat: now,
      exp: now + ACCESS_TOKEN_EXPIRY_SECONDS,
    };

    const accessToken = await signAccessToken(payload, c.env.JWT_SECRET);

    setCookie(c, getAuthCookieName(c.env.ENVIRONMENT), accessToken, {
      httpOnly: true,
      secure: c.env.ENVIRONMENT === "production",
      sameSite: "Strict",
      path: "/",
      maxAge: ACCESS_TOKEN_EXPIRY_SECONDS,
    });

    setCookie(c, getRefreshCookieName(c.env.ENVIRONMENT), refreshToken, {
      httpOnly: true,
      secure: c.env.ENVIRONMENT === "production",
      sameSite: "Strict",
      path: "/",
      maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
    });

    const userPublic: UserPublic = {
      id: user.id,
      email: user.email,
      tier: user.tier,
      created_at: user.created_at,
      active_notes: 0,
    };

    return c.json({ user: userPublic }, 201);
  } catch (err) {
    console.error("Signup handler error:", err);
    return c.json(
      { error: { status: 500, code: "INTERNAL_ERROR", message: "Failed to create account" } },
      500
    );
  }
});

authRoutes.post("/login", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch (_err) {
    return c.json(
      { error: { status: 400, code: "BAD_REQUEST", message: "Invalid JSON in request body" } },
      400
    );
  }

  const validation = validateLogin(body);
  if (!validation.valid) {
    return c.json({ error: { status: 400, code: "VALIDATION_ERROR", message: validation.error! } }, 400);
  }

  const { email, password, turnstileToken } = body as { email: string; password: string; turnstileToken: string };

  try {
    const turnstileValid = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET_KEY);
    if (!turnstileValid) {
      return c.json({ error: { status: 403, code: "FORBIDDEN", message: "Turnstile verification failed" } }, 403);
    }

    const userDb = new UserDatabase(c.env.DB);

    const user = await userDb.findUserByEmail(email);
    if (!user) {
      return c.json({ error: { status: 401, code: "UNAUTHORIZED", message: "Invalid email or password" } }, 401);
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json({ error: { status: 401, code: "UNAUTHORIZED", message: "Invalid email or password" } }, 401);
    }

    const now = Math.floor(Date.now() / 1000);
    const refreshToken = generateRefreshToken();
    const ip = getClientIp(c);
    const userAgent = c.req.header("User-Agent") || "";
    const sessionId = await createSession(c.env.REFRESH_KV, user.id, refreshToken, ip, userAgent, now);

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      tier: user.tier,
      sessionId,
      iat: now,
      exp: now + ACCESS_TOKEN_EXPIRY_SECONDS,
    };

    const accessToken = await signAccessToken(payload, c.env.JWT_SECRET);

    setCookie(c, getAuthCookieName(c.env.ENVIRONMENT), accessToken, {
      httpOnly: true,
      secure: c.env.ENVIRONMENT === "production",
      sameSite: "Strict",
      path: "/",
      maxAge: ACCESS_TOKEN_EXPIRY_SECONDS,
    });

    setCookie(c, getRefreshCookieName(c.env.ENVIRONMENT), refreshToken, {
      httpOnly: true,
      secure: c.env.ENVIRONMENT === "production",
      sameSite: "Strict",
      path: "/",
      maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
    });

    const activeNotes = await userDb.countActiveNotes(user.id);

    const userPublic: UserPublic = {
      id: user.id,
      email: user.email,
      tier: user.tier,
      created_at: user.created_at,
      active_notes: activeNotes,
    };

    return c.json({ user: userPublic });
  } catch (err) {
    console.error("Auth handler error:", err);
    return c.json(
      { error: { status: 500, code: "INTERNAL_ERROR", message: "Failed to sign in" } },
      500
    );
  }
});

authRoutes.post("/refresh", async (c) => {
  try {
    const cookieHeader = c.req.header("Cookie") || "";
    const refreshMatch = cookieHeader.match(getRefreshCookiePattern(c.env.ENVIRONMENT));
    const accessMatch = cookieHeader.match(getAuthCookiePattern(c.env.ENVIRONMENT));

    if (!refreshMatch) {
      return c.json({ error: { status: 401, code: "UNAUTHORIZED", message: "Refresh token is required" } }, 401);
    }

    const refreshTokenValue = refreshMatch[1];

    let userId: string | null = null;
    if (accessMatch) {
      const oldPayload = await verifyAccessToken(accessMatch[1], c.env.JWT_SECRET);
      if (oldPayload) {
        userId = oldPayload.userId;
      }
    }

    if (!userId) {
      return c.json({ error: { status: 401, code: "UNAUTHORIZED", message: "Invalid or expired session" } }, 401);
    }

    const session = await findSessionByToken(c.env.REFRESH_KV, userId, refreshTokenValue);
    if (!session) {
      return c.json({ error: { status: 401, code: "UNAUTHORIZED", message: "Refresh token not found or expired" } }, 401);
    }

    const userDb = new UserDatabase(c.env.DB);
    const user = await userDb.findUserById(userId);
    if (!user) {
      return c.json({ error: { status: 401, code: "UNAUTHORIZED", message: "User not found" } }, 401);
    }

    const now = Math.floor(Date.now() / 1000);
    const newRefreshToken = generateRefreshToken();

    await rotateSessionToken(c.env.REFRESH_KV, userId, session.sessionId, newRefreshToken, now);

    const newPayload: AuthPayload = {
      userId: user.id,
      email: user.email,
      tier: user.tier,
      sessionId: session.sessionId,
      iat: now,
      exp: now + ACCESS_TOKEN_EXPIRY_SECONDS,
    };

    const newAccessToken = await signAccessToken(newPayload, c.env.JWT_SECRET);

    setCookie(c, getAuthCookieName(c.env.ENVIRONMENT), newAccessToken, {
      httpOnly: true,
      secure: c.env.ENVIRONMENT === "production",
      sameSite: "Strict",
      path: "/",
      maxAge: ACCESS_TOKEN_EXPIRY_SECONDS,
    });

    setCookie(c, getRefreshCookieName(c.env.ENVIRONMENT), newRefreshToken, {
      httpOnly: true,
      secure: c.env.ENVIRONMENT === "production",
      sameSite: "Strict",
      path: "/",
      maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
    });

    return c.json({ user: { id: user.id, email: user.email, tier: user.tier } });
  } catch (err) {
    console.error("Auth handler error:", err);
    return c.json(
      { error: { status: 500, code: "INTERNAL_ERROR", message: "Failed to refresh session" } },
      500
    );
  }
});

authRoutes.post("/logout", async (c) => {
  try {
    const cookieHeader = c.req.header("Cookie") || "";
    const accessMatch = cookieHeader.match(getAuthCookiePattern(c.env.ENVIRONMENT));

    if (accessMatch) {
      const payload = await verifyAccessToken(accessMatch[1], c.env.JWT_SECRET);
      if (payload) {
        await deleteSessionById(c.env.REFRESH_KV, payload.userId, payload.sessionId);
      }
    }

    deleteCookie(c, getAuthCookieName(c.env.ENVIRONMENT), { path: "/", secure: c.env.ENVIRONMENT === "production" });
    deleteCookie(c, getRefreshCookieName(c.env.ENVIRONMENT), { path: "/", secure: c.env.ENVIRONMENT === "production" });

    return c.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Auth handler error:", err);
    return c.json(
      { error: { status: 500, code: "INTERNAL_ERROR", message: "Failed to log out" } },
      500
    );
  }
});

authRoutes.get("/me", authGuard(), async (c) => {
  try {
    const userPayload = c.get("user");
    const userDb = new UserDatabase(c.env.DB);
    const dbUser = await userDb.findUserById(userPayload.userId);

    if (!dbUser) {
      return c.json({ error: { status: 404, code: "NOT_FOUND", message: "User not found" } }, 404);
    }

    const activeNotes = await userDb.countActiveNotes(dbUser.id);

    const userPublic: UserPublic = {
      id: dbUser.id,
      email: dbUser.email,
      tier: dbUser.tier,
      created_at: dbUser.created_at,
      active_notes: activeNotes,
    };

    return c.json(userPublic);
  } catch (err) {
    console.error("Auth handler error:", err);
    return c.json(
      { error: { status: 500, code: "INTERNAL_ERROR", message: "Failed to retrieve user profile" } },
      500
    );
  }
});

authRoutes.get("/sessions", authGuard(), async (c) => {
  try {
    const userPayload = c.get("user");
    const prefix = `session:${userPayload.userId}:`;
    const list = await c.env.REFRESH_KV.list({ prefix });
    const currentSessionId = userPayload.sessionId;

    const sessions: SessionPublic[] = [];
    for (const key of list.keys) {
      const raw = await c.env.REFRESH_KV.get(key.name);
      if (!raw) continue;
      try {
        const data = JSON.parse(raw);
        const sessionId = key.name.slice(prefix.length);
        sessions.push({
          id: sessionId,
          browser: data.browser || "Unknown",
          os: data.os || "Unknown",
          ip: data.ip || "unknown",
          createdAt: new Date(data.createdAt * 1000).toISOString(),
          lastActive: new Date(data.lastActive * 1000).toISOString(),
          current: sessionId === currentSessionId,
        });
      } catch {
        continue;
      }
    }

    sessions.sort((a, b) => b.lastActive.localeCompare(a.lastActive));

    return c.json({ sessions });
  } catch (err) {
    console.error("Get sessions error:", err);
    return c.json(
      { error: { status: 500, code: "INTERNAL_ERROR", message: "Failed to retrieve sessions" } },
      500
    );
  }
});

authRoutes.delete("/sessions/:sessionId", authGuard(), async (c) => {
  try {
    const userPayload = c.get("user");
    const sessionId = c.req.param("sessionId") || "";

    if (sessionId === userPayload.sessionId) {
      return c.json({ error: { status: 400, code: "BAD_REQUEST", message: "Cannot revoke your current session. Use logout instead." } }, 400);
    }

    const deleted = await deleteSessionById(c.env.REFRESH_KV, userPayload.userId, sessionId);
    if (!deleted) {
      return c.json({ error: { status: 404, code: "NOT_FOUND", message: "Session not found" } }, 404);
    }

    return c.json({ message: "Session revoked successfully" });
  } catch (err) {
    console.error("Revoke session error:", err);
    return c.json(
      { error: { status: 500, code: "INTERNAL_ERROR", message: "Failed to revoke session" } },
      500
    );
  }
});

authRoutes.delete("/sessions", authGuard(), async (c) => {
  try {
    const userPayload = c.get("user");
    const deletedCount = await deleteAllSessionsExcept(c.env.REFRESH_KV, userPayload.userId, userPayload.sessionId);
    return c.json({ message: `Signed out of ${deletedCount} other device(s)`, deleted: deletedCount });
  } catch (err) {
    console.error("Revoke all sessions error:", err);
    return c.json(
      { error: { status: 500, code: "INTERNAL_ERROR", message: "Failed to revoke other sessions" } },
      500
    );
  }
});

authRoutes.post("/reset-request", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch (_err) {
    return c.json(
      { error: { status: 400, code: "BAD_REQUEST", message: "Invalid JSON in request body" } },
      400
    );
  }

  const validation = validateResetRequest(body);
  if (!validation.valid) {
    return c.json({ error: { status: 400, code: "VALIDATION_ERROR", message: validation.error! } }, 400);
  }

  const { email } = body as { email: string };

  try {
    const userDb = new UserDatabase(c.env.DB);
    const user = await userDb.findUserByEmail(email);

    if (!user) {
      return c.json({ message: "If an account with this email exists, a reset link has been sent." });
    }

    const resetToken = generateRefreshToken();

    await c.env.RESET_KV.put(
      `reset:${resetToken}`,
      JSON.stringify({ userId: user.id, email: user.email, createdAt: Math.floor(Date.now() / 1000) }),
      { expirationTtl: RESET_TOKEN_EXPIRY_SECONDS }
    );

    const frontendUrl = c.env.ENVIRONMENT === "development"
      ? "http://localhost:3000"
      : "https://revelio.app";

    const emailResult = await sendPasswordResetEmail(user.email, resetToken, c.env.RESEND_API_KEY, frontendUrl);

    if (!emailResult.success) {
      console.error(`Password reset email failed for ${email}: ${emailResult.error}`);
    }

    return c.json({ message: "If an account with this email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Auth handler error:", err);
    return c.json(
      { error: { status: 500, code: "INTERNAL_ERROR", message: "Failed to process reset request" } },
      500
    );
  }
});

authRoutes.post("/reset-confirm", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch (_err) {
    return c.json(
      { error: { status: 400, code: "BAD_REQUEST", message: "Invalid JSON in request body" } },
      400
    );
  }

  const validation = validateResetConfirm(body);
  if (!validation.valid) {
    return c.json({ error: { status: 400, code: "VALIDATION_ERROR", message: validation.error! } }, 400);
  }

  const { token, password } = body as { token: string; password: string };

  try {
    const stored = await c.env.RESET_KV.get(`reset:${token}`);
    if (!stored) {
      return c.json({ error: { status: 410, code: "EXPIRED", message: "Reset token has expired or is invalid" } }, 410);
    }

    const parsed = JSON.parse(stored);
    const userId = parsed.userId as string;

    await c.env.RESET_KV.delete(`reset:${token}`);

    const passwordHash = await hashPassword(password);
    const userDb = new UserDatabase(c.env.DB);
    await userDb.updateUserPassword(userId, passwordHash);

    const prefix = `session:${userId}:`;
    const list = await c.env.REFRESH_KV.list({ prefix });
    for (const key of list.keys) {
      await c.env.REFRESH_KV.delete(key.name);
    }

    return c.json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("Auth handler error:", err);
    return c.json(
      { error: { status: 500, code: "INTERNAL_ERROR", message: "Failed to reset password" } },
      500
    );
  }
});