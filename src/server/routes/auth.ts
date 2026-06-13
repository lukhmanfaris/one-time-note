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

export const authRoutes = new Hono<{ Bindings: Env; Variables: { user: AuthPayload } }>();

authRoutes.post("/signup", async (c) => {
  const body = await c.req.json();
  const validation = validateSignup(body);

  if (!validation.valid) {
    return c.json({ error: { status: 400, code: "VALIDATION_ERROR", message: validation.error! } }, 400);
  }

  const { email, password } = body;
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

  setCookie(c, "__Host-access_token", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge: ACCESS_TOKEN_EXPIRY_SECONDS,
  });

  setCookie(c, "__Host-refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
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
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const validation = validateLogin(body);

  if (!validation.valid) {
    return c.json({ error: { status: 400, code: "VALIDATION_ERROR", message: validation.error! } }, 400);
  }

  const { email, password } = body;
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

  setCookie(c, "__Host-access_token", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge: ACCESS_TOKEN_EXPIRY_SECONDS,
  });

  setCookie(c, "__Host-refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
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
});

authRoutes.post("/refresh", async (c) => {
  const cookieHeader = c.req.header("Cookie") || "";
  const refreshMatch = cookieHeader.match(/__Host-refresh_token=([^;]+)/);
  const accessMatch = cookieHeader.match(/__Host-access_token=([^;]+)/);

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

  setCookie(c, "__Host-access_token", newAccessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge: ACCESS_TOKEN_EXPIRY_SECONDS,
  });

  setCookie(c, "__Host-refresh_token", newRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
  });

  return c.json({ user: { id: user.id, email: user.email, tier: user.tier } });
});

authRoutes.post("/logout", async (c) => {
  const cookieHeader = c.req.header("Cookie") || "";
  const accessMatch = cookieHeader.match(/__Host-access_token=([^;]+)/);

  if (accessMatch) {
    const payload = await verifyAccessToken(accessMatch[1], c.env.JWT_SECRET);
    if (payload) {
      await c.env.REFRESH_KV.delete(`refresh:${payload.userId}`);
    }
  }

  deleteCookie(c, "__Host-access_token", { path: "/", secure: true });
  deleteCookie(c, "__Host-refresh_token", { path: "/", secure: true });

  return c.json({ message: "Logged out successfully" });
});

authRoutes.get("/me", authGuard(), async (c) => {
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
});

authRoutes.post("/reset-request", async (c) => {
  const body = await c.req.json();
  const validation = validateResetRequest(body);

  if (!validation.valid) {
    return c.json({ error: { status: 400, code: "VALIDATION_ERROR", message: validation.error! } }, 400);
  }

  const { email } = body;
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
});

authRoutes.post("/reset-confirm", async (c) => {
  const body = await c.req.json();
  const validation = validateResetConfirm(body);

  if (!validation.valid) {
    return c.json({ error: { status: 400, code: "VALIDATION_ERROR", message: validation.error! } }, 400);
  }

  const { token, password } = body;

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
});