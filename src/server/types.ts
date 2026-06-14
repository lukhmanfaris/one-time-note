export interface Env {
  NOTES_KV: KVNamespace;
  REFRESH_KV: KVNamespace;
  RESET_KV: KVNamespace;
  DB: D1Database;
  ENVIRONMENT: string;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
}

export interface CreateNoteRequest {
  ciphertext: string;
  salt: string;
  iv: string;
  ttl_seconds: number;
  lookup_id: string;
}

export interface NoteData {
  ciphertext: string;
  salt: string;
  iv: string;
}

export interface NoteMetadata {
  id: string;
  user_id: string | null;
  lookup_id: string;
  ttl_seconds: number;
  created_at: string;
  status: "active" | "claimed" | "expired";
  expires_at: string | null;
  read_at: string | null;
}

export const VALID_TTL_SECONDS = [3600, 86400, 604800] as const;
export type ValidTTL = (typeof VALID_TTL_SECONDS)[number];

export const MAX_NOTE_SIZE_BYTES = 10240;

export const LOOKUP_ID_LENGTH = 64;
export const LOOKUP_ID_REGEX = /^[a-f0-9]{64}$/;

export interface User {
  id: string;
  email: string;
  password_hash: string;
  tier: "free" | "pro" | "enterprise";
  created_at: string;
  updated_at: string;
}

export interface UserPublic {
  id: string;
  email: string;
  tier: string;
  created_at: string;
  active_notes: number;
}

export interface SignupRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ResetRequestRequest {
  email: string;
}

export interface ResetConfirmRequest {
  token: string;
  password: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
  tier: string;
  iat: number;
  exp: number;
}

export const FREE_TTL_MAX = 3600;
export const PRO_TTL_OPTIONS = [3600, 86400, 604800];
export const FREE_MAX_ACTIVE_NOTES = 1;

export const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60;
export const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;
export const RESET_TOKEN_EXPIRY_SECONDS = 15 * 60;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;