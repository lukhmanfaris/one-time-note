export interface Env {
  NOTES_KV: KVNamespace;
  DB: D1Database;
  ENVIRONMENT: string;
}

export interface CreateNoteRequest {
  ciphertext: string;
  salt: string;
  iv: string;
  ttl_seconds: number;
  access_key: string;
}

export interface NoteData {
  ciphertext: string;
  salt: string;
  iv: string;
}

export interface NoteMetadata {
  id: string;
  user_id: string | null;
  access_key: string;
  ttl_seconds: number;
  created_at: string;
  status: "active" | "claimed";
}

export const VALID_TTL_SECONDS = [3600, 86400, 604800] as const;
export type ValidTTL = (typeof VALID_TTL_SECONDS)[number];

export const MAX_NOTE_SIZE_BYTES = 10240;

export const ACCESS_KEY_LENGTH = 12;
export const ACCESS_KEY_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";