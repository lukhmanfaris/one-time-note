import { Hono } from "hono";
import type { Env } from "../types";

export const healthRoutes = new Hono<{ Bindings: Env }>();

healthRoutes.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

healthRoutes.get("/health/bindings", async (c) => {
  const results: Record<string, string> = {};

  try {
    const db = c.env.DB;
    results["DB_present"] = db ? "yes" : "no";
    if (db) {
      const row = await db.prepare("SELECT 1 as ok").first();
      results["DB_query"] = row ? "ok" : "no_rows";
    }
  } catch (err) {
    results["DB_query"] = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const kv = c.env.REFRESH_KV;
    results["REFRESH_KV_present"] = kv ? "yes" : "no";
    if (kv) {
      await kv.put("_health:k", "ok", { expirationTtl: 60 });
      const v = await kv.get("_health:k");
      results["REFRESH_KV_rw"] = v === "ok" ? "ok" : `unexpected: ${v}`;
    }
  } catch (err) {
    results["REFRESH_KV_rw"] = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const kv = c.env.NOTES_KV;
    results["NOTES_KV_present"] = kv ? "yes" : "no";
  } catch (err) {
    results["NOTES_KV_present"] = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const kv = c.env.RESET_KV;
    results["RESET_KV_present"] = kv ? "yes" : "no";
  } catch (err) {
    results["RESET_KV_present"] = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const secret = c.env.JWT_SECRET;
    results["JWT_SECRET_present"] = secret ? "yes" : "no";
    if (secret) {
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      results["JWT_crypto_import"] = key ? "ok" : "failed";
    }
  } catch (err) {
    results["JWT_crypto_import"] = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const env = c.env.ENVIRONMENT;
    results["ENVIRONMENT"] = env || "(empty)";
  } catch (err) {
    results["ENVIRONMENT"] = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const apiKey = c.env.RESEND_API_KEY;
    results["RESEND_API_KEY_present"] = apiKey ? "yes" : "no";
  } catch (err) {
    results["RESEND_API_KEY_present"] = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  return c.json(results);
});