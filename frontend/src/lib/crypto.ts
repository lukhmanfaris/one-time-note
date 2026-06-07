const PBKDF2_ITERATIONS = 260000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ACCESS_KEY_LENGTH = 12;
const ACCESS_KEY_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export interface EncryptedNote {
  ciphertext: string;
  salt: string;
  iv: string;
}

export function generateAccessKey(): string {
  const array = new Uint8Array(ACCESS_KEY_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((byte) => ACCESS_KEY_CHARS[byte % ACCESS_KEY_CHARS.length])
    .join("");
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(accessKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(accessKey),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptNote(plaintext: string, accessKey: string): Promise<EncryptedNote> {
  const encoder = new TextEncoder();
  const salt = new Uint8Array(SALT_LENGTH);
  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(salt);
  crypto.getRandomValues(iv);

  const key = await deriveKey(accessKey, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
  };
}

export async function decryptNote(encrypted: EncryptedNote, accessKey: string): Promise<string> {
  const salt = new Uint8Array(base64ToArrayBuffer(encrypted.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(encrypted.iv));
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);

  const key = await deriveKey(accessKey, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}