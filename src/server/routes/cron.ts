import { Hono } from "hono";
import { NoteDatabase } from "../database";
import type { Env } from "../types";

const cronRoutes = new Hono<{ Bindings: Env }>();

cronRoutes.post("/sweep", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: { status: 401, code: "UNAUTHORIZED", message: "Missing or invalid Authorization header" } }, 401);
  }

  const token = authHeader.slice(7);
  if (token !== c.env.CRON_SECRET) {
    return c.json({ error: { status: 401, code: "UNAUTHORIZED", message: "Invalid cron secret" } }, 401);
  }

  const noteDb = new NoteDatabase(c.env.DB);
  const deleted = await noteDb.deleteExpiredNotes();

  return c.json({ success: true, deleted });
});

export { cronRoutes };