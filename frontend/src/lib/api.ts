import type { EncryptedNote } from "./crypto";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export interface CreateNoteResponse {
  access_key: string;
  expires_at: string;
}

export interface ApiError {
  error: {
    status: number;
    code: string;
    message: string;
  };
}

export async function createNote(
  encrypted: EncryptedNote,
  ttlSeconds: number,
  accessKey: string
): Promise<CreateNoteResponse> {
  const res = await fetch(`${API_URL}/api/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ciphertext: encrypted.ciphertext,
      salt: encrypted.salt,
      iv: encrypted.iv,
      ttl_seconds: ttlSeconds,
      access_key: accessKey,
    }),
  });

  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new Error(err.error?.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function retrieveNote(accessKey: string): Promise<EncryptedNote | null> {
  const res = await fetch(`${API_URL}/api/notes/${accessKey}`);

  if (res.status === 404) return null;
  if (res.status === 410) return null;

  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new Error(err.error?.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}