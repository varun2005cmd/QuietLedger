/**
 * webCrypto.ts
 *
 * Low-level wrappers over the browser's Web Crypto API.
 * Every function in this file is pure — no side effects, no external dependencies.
 *
 * Algorithm: AES-GCM 256-bit
 * IV:        12 bytes, randomly generated per encryption operation
 * Format:    Both iv and ciphertext are stored/transferred as base64 strings
 */

/** Generate a fresh AES-GCM-256 key. Called once per new user/device. */
export async function generateAESKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,            // extractable: allows export as JWK for storage
    ['encrypt', 'decrypt'],
  );
}

/** Export a CryptoKey to JSON Web Key format for localStorage persistence. */
export async function exportKeyAsJWK(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key);
}

/** Import a JSON Web Key back into a CryptoKey for use in encrypt/decrypt. */
export async function importKeyFromJWK(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

export interface EncryptedPayload {
  iv: string;          // base64-encoded 12-byte IV
  ciphertext: string;  // base64-encoded ciphertext
}

/**
 * Encrypt a plaintext string.
 * A fresh random IV is generated for every call — never reuse IVs with the same key.
 */
export async function encryptText(
  key: CryptoKey,
  plaintext: string,
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(plaintext);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as Uint8Array<ArrayBuffer> },
    key,
    encodedText,
  );

  return {
    iv: uint8ArrayToBase64(iv),
    ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertextBuffer)),
  };
}

/**
 * Decrypt an EncryptedPayload back to the original plaintext string.
 * Will throw if the key, iv, or ciphertext is wrong — callers must handle.
 */
export async function decryptText(
  key: CryptoKey,
  payload: EncryptedPayload,
): Promise<string> {
  const iv = base64ToUint8Array(payload.iv);
  const ciphertextBytes = base64ToUint8Array(payload.ciphertext);

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as Uint8Array<ArrayBuffer> },
    key,
    ciphertextBytes as BufferSource,
  );

  return new TextDecoder().decode(plaintextBuffer);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes as Uint8Array<ArrayBuffer>;
}
