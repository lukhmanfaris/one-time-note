import { UAParser } from "ua-parser-js";
import { sessionKey, sessionPrefix, type SessionData } from "./types";
import { REFRESH_TOKEN_EXPIRY_SECONDS } from "./types";

export function parseUserAgent(userAgent: string): { browser: string; os: string } {
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  return {
    browser: browser.name && browser.version ? `${browser.name} ${browser.version}` : browser.name || "Unknown",
    os: os.name && os.version ? `${os.name} ${os.version}` : os.name || "Unknown",
  };
}

export function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() || "unknown";
}

export async function createSession(
  kv: KVNamespace,
  userId: string,
  refreshToken: string,
  ip: string,
  userAgent: string,
  now: number
): Promise<string> {
  const { browser, os } = parseUserAgent(userAgent);
  const sessionId = crypto.randomUUID().replace(/-/g, "");
  const data: SessionData = {
    token: refreshToken,
    ip,
    browser,
    os,
    createdAt: now,
    lastActive: now,
  };
  await kv.put(sessionKey(userId, sessionId), JSON.stringify(data), {
    expirationTtl: REFRESH_TOKEN_EXPIRY_SECONDS,
  });
  return sessionId;
}

export async function findSessionByToken(
  kv: KVNamespace,
  userId: string,
  token: string
): Promise<{ sessionId: string; data: SessionData } | null> {
  const prefix = sessionPrefix(userId);
  const list = await kv.list({ prefix });
  for (const key of list.keys) {
    const raw = await kv.get(key.name);
    if (!raw) continue;
    try {
      const data: SessionData = JSON.parse(raw);
      if (data.token === token) {
        const sessionId = key.name.slice(prefix.length);
        return { sessionId, data };
      }
    } catch {
      continue;
    }
  }
  return null;
}

export async function updateSessionActivity(
  kv: KVNamespace,
  userId: string,
  sessionId: string,
  data: SessionData
): Promise<void> {
  data.lastActive = Math.floor(Date.now() / 1000);
  await kv.put(sessionKey(userId, sessionId), JSON.stringify(data), {
    expirationTtl: REFRESH_TOKEN_EXPIRY_SECONDS,
  });
}

export async function deleteSessionById(
  kv: KVNamespace,
  userId: string,
  sessionId: string
): Promise<boolean> {
  const key = sessionKey(userId, sessionId);
  const existing = await kv.get(key);
  if (!existing) return false;
  await kv.delete(key);
  return true;
}

export async function deleteAllSessionsExcept(
  kv: KVNamespace,
  userId: string,
  exceptSessionId: string
): Promise<number> {
  const prefix = sessionPrefix(userId);
  const list = await kv.list({ prefix });
  let deleted = 0;
  for (const key of list.keys) {
    const sid = key.name.slice(prefix.length);
    if (sid !== exceptSessionId) {
      await kv.delete(key.name);
      deleted++;
    }
  }
  return deleted;
}

export async function rotateSessionToken(
  kv: KVNamespace,
  userId: string,
  oldSessionId: string,
  newToken: string,
  now: number
): Promise<void> {
  const key = sessionKey(userId, oldSessionId);
  const raw = await kv.get(key);
  if (!raw) return;
  const data: SessionData = JSON.parse(raw);
  data.token = newToken;
  data.lastActive = now;
  await kv.put(key, JSON.stringify(data), {
    expirationTtl: REFRESH_TOKEN_EXPIRY_SECONDS,
  });
}