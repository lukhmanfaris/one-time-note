import { Hono } from "hono";
import { NoteStorage } from "../storage";
import { validateCreateNoteRequest } from "../middleware";
import type { Env } from "../types";

export const noteRoutes = new Hono<{ Bindings: Env }>();

noteRoutes.post("/notes", async (c) => {
  const body = await c.req.json();
  const validation = validateCreateNoteRequest(body);

  if (!validation.valid) {
    return c.json(
      { error: { status: 400, code: "VALIDATION_ERROR", message: validation.error! } },
      400
    );
  }

  const { ciphertext, salt, iv, ttl_seconds, access_key } = body;
  const storage = new NoteStorage(c.env.NOTES_KV);

  await storage.save(access_key, { ciphertext, salt, iv }, ttl_seconds);

  const expiresAt = new Date(Date.now() + ttl_seconds * 1000).toISOString();

  return c.json({ access_key, expires_at: expiresAt }, 201);
});

noteRoutes.get("/notes/:key", async (c) => {
  const key = c.req.param("key");
  const storage = new NoteStorage(c.env.NOTES_KV);
  const noteData = await storage.retrieve(key);

  if (!noteData) {
    return c.json({ error: { status: 404, code: "NOT_FOUND", message: "Note not found or already retrieved" } }, 404);
  }

  return c.json(noteData);
});