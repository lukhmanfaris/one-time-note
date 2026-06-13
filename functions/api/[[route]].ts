import app from "../../src/server";
import type { Env } from "../../src/server/types";

export const onRequest = async (context: {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<unknown>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  params: Record<string, string>;
}) => {
  return app.fetch(context.request, context.env, context as unknown as ExecutionContext);
};
