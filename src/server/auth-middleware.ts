import type { Context, Next } from "hono";
import type { Env, AuthPayload } from "./types";
import { verifyAccessToken } from "./auth";

export function authGuard() {
  return async (c: Context<{ Bindings: Env; Variables: { user: AuthPayload } }>, next: Next) => {
    const cookieHeader = c.req.header("Cookie") || "";
    const match = cookieHeader.match(/__Host-access_token=([^;]+)/);

    if (!match) {
      return c.json({ error: { status: 401, code: "UNAUTHORIZED", message: "Access token is required" } }, 401);
    }

    const token = match[1];
    const payload = await verifyAccessToken(token, c.env.JWT_SECRET);

    if (!payload) {
      return c.json({ error: { status: 401, code: "UNAUTHORIZED", message: "Invalid or expired access token" } }, 401);
    }

    c.set("user", payload);
    await next();
  };
}

export function requireTier(requiredTier: string) {
  return async (c: Context<{ Bindings: Env; Variables: { user: AuthPayload } }>, next: Next) => {
    const user = c.get("user");

    const tierHierarchy: Record<string, number> = { free: 0, pro: 1, enterprise: 2 };
    const userTierLevel = tierHierarchy[user.tier] ?? 0;
    const requiredLevel = tierHierarchy[requiredTier] ?? 0;

    if (userTierLevel < requiredLevel) {
      return c.json({
        error: {
          status: 403,
          code: "FORBIDDEN",
          message: `This action requires a ${requiredTier} account or higher`,
        },
      }, 403);
    }

    await next();
  };
}