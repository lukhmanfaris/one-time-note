import { VALID_TTL_SECONDS, MAX_NOTE_SIZE_BYTES, ACCESS_KEY_LENGTH, ACCESS_KEY_CHARS } from "./types";

interface ValidationResult {
  valid: boolean;
  error?: string;
}

const ACCESS_KEY_REGEX = new RegExp(`^[${ACCESS_KEY_CHARS}]{${ACCESS_KEY_LENGTH}}$`);
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

  if (!VALID_TTL_SECONDS.includes(req.ttl_seconds as any)) {
    return { valid: false, error: "ttl_seconds must be one of: 3600, 86400, 604800" };
  }

  if (!req.access_key || typeof req.access_key !== "string") {
    return { valid: false, error: "access_key is required and must be a string" };
  }

  if (!ACCESS_KEY_REGEX.test(req.access_key)) {
    return { valid: false, error: `access_key must be exactly ${ACCESS_KEY_LENGTH} alphanumeric characters` };
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