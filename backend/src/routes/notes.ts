import { Hono } from "hono";

export const noteRoutes = new Hono();

noteRoutes.post("/notes", (c) => {
  return c.json({ error: { status: 501, code: "NOT_IMPLEMENTED", message: "Not implemented yet" } }, 501);
});

noteRoutes.get("/notes/:key", (c) => {
  return c.json({ error: { status: 501, code: "NOT_IMPLEMENTED", message: "Not implemented yet" } }, 501);
});