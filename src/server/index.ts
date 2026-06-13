import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { healthRoutes } from "./routes/health";
import { noteRoutes } from "./routes/notes";
import { authRoutes } from "./routes/auth";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());

app.onError((err, c) => {
  console.error("Unhandled error:", err.message, err.stack);
  return c.json(
    { error: { status: 500, code: "INTERNAL_ERROR", message: "Internal server error" } },
    500
  );
});

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:8787",
  "https://revelio.app",
];

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return null;
      if (allowedOrigins.includes(origin)) return origin;
      if (origin.endsWith(".pages.dev")) return origin;
      return null;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.route("/api", healthRoutes);
app.route("/api", noteRoutes);
app.route("/api/auth", authRoutes);

export default app;