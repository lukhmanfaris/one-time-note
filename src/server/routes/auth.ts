import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import type { Env, AuthPayload, UserPublic } from "../types";
import { UserDatabase } from "../database";
import { authGuard } from "../auth-middleware";
import { validateSignup, validateLogin, validateResetRequest, validateResetConfirm } from "../middleware";
import { sendPasswordResetEmail } from "../email";
import { RESET_TOKEN_EXPIRY_SECONDS } from "../types";
import { hashPassword, verifyPassword, signAccessToken, generateUserId, generateRefreshToken } from "../auth";
import { verifyAccessToken } from "../auth";
import { ACCESS_TOKEN_EXPIRY_SECONDS, REFRESH_TOKEN_EXPIRY_SECONDS } from "../types";
import { getAuthCookieName, getRefreshCookieName, getAuthCookiePattern, getRefreshCookiePattern } from "../cookies";

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

  const { email, password } = body as { email: string; password: string };

  try {
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
    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      tier: user.tier,
      iat: now,
      exp: now + ACCESS_TOKEN_EXPIRY_SECONDS,
    };

    const accessToken = await signAccessToken(payload, c.env.JWT_SECRET);
    const refreshToken = generateRefreshToken();

    await c.env.REFRESH_KV.put(
      `refresh:${user.id}`,
      JSON.stringify({ token: refreshToken, createdAt: now }),
      { expirationTtl: REFRESH_TOKEN_EXPIRY_SECONDS }
    );

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

  const { email, password } = body as { email: string; password: string };

  try {
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
    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      tier: user.tier,
      iat: now,
      exp: now + ACCESS_TOKEN_EXPIRY_SECONDS,
    };

    const accessToken = await signAccessToken(payload, c.env.JWT_SECRET);
    const refreshToken = generateRefreshToken();

    await c.env.REFRESH_KV.put(
      `refresh:${user.id}`,
      JSON.stringify({ token: refreshToken, createdAt: now }),
      { expirationTtl: REFRESH_TOKEN_EXPIRY_SECONDS }
    );

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

    const stored = await c.env.REFRESH_KV.get(`refresh:${userId}`);
    if (!stored) {
      return c.json({ error: { status: 401, code: "UNAUTHORIZED", message: "Refresh token not found or expired" } }, 401);
    }

    const parsed = JSON.parse(stored);
    if (parsed.token !== refreshTokenValue) {
      return c.json({ error: { status: 401, code: "UNAUTHORIZED", message: "Invalid refresh token" } }, 401);
    }

    const userDb = new UserDatabase(c.env.DB);
    const user = await userDb.findUserById(userId);
    if (!user) {
      return c.json({ error: { status: 401, code: "UNAUTHORIZED", message: "User not found" } }, 401);
    }

    const now = Math.floor(Date.now() / 1000);
    const newPayload: AuthPayload = {
      userId: user.id,
      email: user.email,
      tier: user.tier,
      iat: now,
      exp: now + ACCESS_TOKEN_EXPIRY_SECONDS,
    };

    const newAccessToken = await signAccessToken(newPayload, c.env.JWT_SECRET);
    const newRefreshToken = generateRefreshToken();

    await c.env.REFRESH_KV.put(
      `refresh:${user.id}`,
      JSON.stringify({ token: newRefreshToken, createdAt: now }),
      { expirationTtl: REFRESH_TOKEN_EXPIRY_SECONDS }
    );

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
        await c.env.REFRESH_KV.delete(`refresh:${payload.userId}`);
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

    await c.env.REFRESH_KV.delete(`refresh:${userId}`);

    return c.json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("Auth handler error:", err);
    return c.json(
      { error: { status: 500, code: "INTERNAL_ERROR", message: "Failed to reset password" } },
      500
    );
  }
});