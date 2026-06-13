import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { healthRoutes } from "./routes/health";
import { noteRoutes } from "./routes/notes";
import { authRoutes } from "./routes/auth";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
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