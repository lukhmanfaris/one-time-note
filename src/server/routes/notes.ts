import { Hono } from "hono";
import { NoteStorage } from "../storage";
import { NoteDatabase } from "../database";
import { validateCreateNoteRequest } from "../middleware";
import { verifyAccessToken } from "../auth";
import { getAuthCookiePattern } from "../cookies";
import { FREE_TTL_MAX, FREE_MAX_ACTIVE_NOTES } from "../types";
import type { Env, AuthPayload } from "../types";

export const noteRoutes = new Hono<{ Bindings: Env; Variables: { user: AuthPayload | null } }>();

noteRoutes.use("/notes", async (c, next) => {
  const cookieHeader = c.req.header("Cookie") || "";
  const match = cookieHeader.match(getAuthCookiePattern(c.env.ENVIRONMENT));

  if (match) {
    const payload = await verifyAccessToken(match[1], c.env.JWT_SECRET);
    c.set("user", payload);
  } else {
    c.set("user", null);
  }

  await next();
});

noteRoutes.post("/notes", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch (err) {
    console.error("Create note JSON parse error:", err);
    return c.json(
      { error: { status: 400, code: "BAD_REQUEST", message: "Invalid JSON in request body" } },
      400
    );
  }

  const validation = validateCreateNoteRequest(body);
  if (!validation.valid) {
    return c.json(
      { error: { status: 400, code: "VALIDATION_ERROR", message: validation.error! } },
      400
    );
  }

  const { ciphertext, salt, iv, ttl_seconds, access_key } = body as {
    ciphertext: string;
    salt: string;
    iv: string;
    ttl_seconds: number;
    access_key: string;
  };
  const user = c.get("user") as AuthPayload | null;

  try {
    if (!user) {
      if (ttl_seconds !== FREE_TTL_MAX) {
        return c.json(
          { error: { status: 403, code: "FORBIDDEN", message: "Anonymous users can only create notes with a 1-hour TTL" } },
          403
        );
      }
    } else if (user.tier === "free") {
      if (ttl_seconds !== FREE_TTL_MAX) {
        return c.json(
          { error: { status: 403, code: "FORBIDDEN", message: "Free accounts are limited to 1-hour TTL. Upgrade to Pro for extended expiry options." } },
          403
        );
      }
      const noteDb = new NoteDatabase(c.env.DB);
      const activeCount = await noteDb.countActiveNotesByUser(user.userId);
      if (activeCount >= FREE_MAX_ACTIVE_NOTES) {
        return c.json(
          { error: { status: 403, code: "FORBIDDEN", message: "Free accounts are limited to 1 active note. Delete your current note or upgrade to Pro." } },
          403
        );
      }
    }

    const storage = new NoteStorage(c.env.NOTES_KV);
    await storage.save(access_key, { ciphertext, salt, iv }, ttl_seconds);

    if (user) {
      const noteDb = new NoteDatabase(c.env.DB);
      await noteDb.createNote({
        id: `note_${access_key}`,
        userId: user.userId,
        accessKey: access_key,
        ttlSeconds: ttl_seconds,
      });
    }

    const expiresAt = new Date(Date.now() + ttl_seconds * 1000).toISOString();

    return c.json({ access_key, expires_at: expiresAt }, 201);
  } catch (err) {
    console.error("Create note handler error:", err instanceof Error ? err.message : String(err), err);
    return c.json(
      { error: { status: 500, code: "INTERNAL_ERROR", message: "Failed to create note" } },
      500
    );
  }
});

noteRoutes.get("/notes/:key", async (c) => {
  try {
    const key = c.req.param("key");
    const storage = new NoteStorage(c.env.NOTES_KV);
    const noteData = await storage.retrieve(key);

    if (!noteData) {
      return c.json({ error: { status: 404, code: "NOT_FOUND", message: "Note not found or already retrieved" } }, 404);
    }

    const noteDb = new NoteDatabase(c.env.DB);
    await noteDb.claimNote(key);

    return c.json(noteData);
  } catch (err) {
    console.error("Get note handler error:", err instanceof Error ? err.message : String(err), err);
    return c.json(
      { error: { status: 500, code: "INTERNAL_ERROR", message: "Failed to retrieve note" } },
      500
    );
  }
});