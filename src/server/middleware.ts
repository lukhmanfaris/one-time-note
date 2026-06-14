import { VALID_TTL_SECONDS, MAX_NOTE_SIZE_BYTES, LOOKUP_ID_REGEX, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, type ValidTTL } from "./types";

interface ValidationResult {
  valid: boolean;
  error?: string;
}

const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;

export function validateCreateNoteRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const req = body as Record<string, unknown>;

  if (!req.ciphertext || typeof req.ciphertext !== "string") {
    return { valid: false, error: "ciphertext is required and must be a string" };
  }

  if (!req.salt || typeof req.salt !== "string") {
    return { valid: false, error: "salt is required and must be a string" };
  }

  if (!req.iv || typeof req.iv !== "string") {
    return { valid: false, error: "iv is required and must be a string" };
  }

  if (!req.ttl_seconds || typeof req.ttl_seconds !== "number") {
    return { valid: false, error: "ttl_seconds is required and must be a number" };
  }

  if (!VALID_TTL_SECONDS.includes(req.ttl_seconds as ValidTTL)) {
    return { valid: false, error: "ttl_seconds must be one of: 3600, 86400, 604800" };
  }

  if (!req.lookup_id || typeof req.lookup_id !== "string") {
    return { valid: false, error: "lookup_id is required and must be a string" };
  }

  if (!LOOKUP_ID_REGEX.test(req.lookup_id)) {
    return { valid: false, error: "lookup_id must be exactly 64 hex characters (SHA-256)" };
  }

  if (!req.turnstileToken || typeof req.turnstileToken !== "string") {
    return { valid: false, error: "turnstileToken is required" };
  }

  if (req.ciphertext.length > MAX_NOTE_SIZE_BYTES) {
    return { valid: false, error: `ciphertext size must not exceed ${MAX_NOTE_SIZE_BYTES} bytes` };
  }

  if (!BASE64_REGEX.test(req.ciphertext)) {
    return { valid: false, error: "ciphertext must be valid base64" };
  }

  if (!BASE64_REGEX.test(req.salt)) {
    return { valid: false, error: "salt must be valid base64" };
  }

  if (!BASE64_REGEX.test(req.iv)) {
    return { valid: false, error: "iv must be valid base64" };
  }

  return { valid: true };
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

export function rateLimiter(options: RateLimiterOptions): (key: string) => RateLimitResult {
  const { windowMs, maxRequests } = options;
  const hits = new Map<string, { count: number; windowStart: number }>();

  return (key: string): RateLimitResult => {
    const now = Date.now();
    const record = hits.get(key);

    if (!record || now - record.windowStart > windowMs) {
      hits.set(key, { count: 1, windowStart: now });
      return { allowed: true };
    }

    record.count++;

    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.windowStart + windowMs - now) / 1000);
      return { allowed: false, retryAfter: Math.max(1, retryAfter) };
    }

    return { allowed: true };
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignup(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }
  const req = body as Record<string, unknown>;

  if (!req.email || typeof req.email !== "string" || !EMAIL_REGEX.test(req.email)) {
    return { valid: false, error: "A valid email address is required" };
  }

  if (!req.password || typeof req.password !== "string") {
    return { valid: false, error: "Password is required" };
  }

  if (req.password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }

  if (req.password.length > PASSWORD_MAX_LENGTH) {
    return { valid: false, error: `Password must be at most ${PASSWORD_MAX_LENGTH} characters` };
  }

  if (!req.turnstileToken || typeof req.turnstileToken !== "string") {
    return { valid: false, error: "turnstileToken is required" };
  }

  return { valid: true };
}

export function validateLogin(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }
  const req = body as Record<string, unknown>;

  if (!req.email || typeof req.email !== "string") {
    return { valid: false, error: "Email is required" };
  }

  if (!req.password || typeof req.password !== "string") {
    return { valid: false, error: "Password is required" };
  }

  if (!req.turnstileToken || typeof req.turnstileToken !== "string") {
    return { valid: false, error: "turnstileToken is required" };
  }

  return { valid: true };
}

export function validateResetRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }
  const req = body as Record<string, unknown>;

  if (!req.email || typeof req.email !== "string" || !EMAIL_REGEX.test(req.email)) {
    return { valid: false, error: "A valid email address is required" };
  }

  return { valid: true };
}

export function validateResetConfirm(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }
  const req = body as Record<string, unknown>;

  if (!req.token || typeof req.token !== "string") {
    return { valid: false, error: "Reset token is required" };
  }

  if (!req.password || typeof req.password !== "string") {
    return { valid: false, error: "New password is required" };
  }

  if (req.password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }

  if (req.password.length > PASSWORD_MAX_LENGTH) {
    return { valid: false, error: `Password must be at most ${PASSWORD_MAX_LENGTH} characters` };
  }

  return { valid: true };
}