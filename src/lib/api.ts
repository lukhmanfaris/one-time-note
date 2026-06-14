import type { EncryptedNote } from "./crypto";
import { ApiError as ApiErrorClass } from "./api-errors";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface CreateNoteResponse {
  lookup_id: string;
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
  lookupId: string,
  turnstileToken: string
): Promise<CreateNoteResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ciphertext: encrypted.ciphertext,
        salt: encrypted.salt,
        iv: encrypted.iv,
        ttl_seconds: ttlSeconds,
        lookup_id: lookupId,
        turnstileToken: turnstileToken,
      }),
    });
  } catch {
    throw new Error("Unable to reach the server. Check your internet connection.");
  }

  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new Error(err.error?.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function retrieveNote(lookupId: string): Promise<EncryptedNote | null> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/notes/${lookupId}`);
  } catch {
    throw new Error("Unable to reach the server. Check your internet connection.");
  }

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

export interface UserPublic {
  id: string;
  email: string;
  tier: string;
  created_at: string;
  active_notes: number;
}

export interface AuthResponse {
  user: UserPublic;
}

export async function signup(email: string, password: string, turnstileToken: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, turnstileToken }),
  });

  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new ApiErrorClass(res.status, err.error?.code || "UNKNOWN", err.error?.message || "Signup failed");
  }

  return res.json();
}

export async function login(email: string, password: string, turnstileToken: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, turnstileToken }),
  });

  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new ApiErrorClass(res.status, err.error?.code || "UNKNOWN", err.error?.message || "Login failed");
  }

  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function refreshToken(): Promise<AuthResponse | null> {
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) return null;
  return res.json();
}

export async function getCurrentUser(): Promise<UserPublic | null> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    credentials: "include",
  });

  if (res.status === 401) return null;
  if (!res.ok) return null;
  return res.json();
}

export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/reset-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new ApiErrorClass(res.status, err.error?.code || "UNKNOWN", err.error?.message || "Reset request failed");
  }
}

export async function confirmPasswordReset(token: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/reset-confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token, password }),
  });

  if (!res.ok) {
    const err: ApiError = await res.json();
    throw new ApiErrorClass(res.status, err.error?.code || "UNKNOWN", err.error?.message || "Password reset failed");
  }
}