const PBKDF2_ITERATIONS = 260000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ENCRYPTION_KEY_BYTES = 32;

export interface EncryptedNote {
  ciphertext: string;
  salt: string;
  iv: string;
}

function arrayBufferToBase64(source: Uint8Array | ArrayBuffer): string {
  const bytes = source instanceof Uint8Array ? source : new Uint8Array(source);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateEncryptionKey(): string {
  const bytes = new Uint8Array(ENCRYPTION_KEY_BYTES);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function deriveLookupId(encryptionKey: string): Promise<string> {
  const binary = atob(encryptionKey.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return arrayBufferToHex(hashBuffer);
}

async function deriveKey(encryptionKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const binary = atob(encryptionKey.replace(/-/g, "+").replace(/_/g, "/"));
  const keyBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    keyBytes[i] = binary.charCodeAt(i);
  }

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptNote(plaintext: string, encryptionKey: string): Promise<EncryptedNote> {
  const encoder = new TextEncoder();
  const salt = new Uint8Array(SALT_LENGTH);
  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(salt);
  crypto.getRandomValues(iv);

  const key = await deriveKey(encryptionKey, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
  };
}

export async function decryptNote(encrypted: EncryptedNote, encryptionKey: string): Promise<string> {
  const salt = base64ToArrayBuffer(encrypted.salt);
  const iv = base64ToArrayBuffer(encrypted.iv);
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);

  const key = await deriveKey(encryptionKey, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

export function buildShareUrl(lookupId: string, encryptionKey: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/receive/${lookupId}#key=${encodeURIComponent(encryptionKey)}`;
}

export function parseShareUrl(): { lookupId: string; encryptionKey: string } | null {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash;
  if (!hash || !hash.startsWith("#key=")) return null;

  const encryptionKey = decodeURIComponent(hash.slice(5));
  if (!encryptionKey) return null;

  const pathParts = window.location.pathname.split("/");
  const lookupId = pathParts[pathParts.length - 1];
  if (!lookupId) return null;

  return { lookupId, encryptionKey };
}