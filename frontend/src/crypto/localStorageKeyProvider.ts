/**
 * localStorageKeyProvider.ts
 *
 * MVP CryptoProvider implementation.
 *
 * Key strategy: AES-GCM-256, randomly generated on first use, exported as JWK,
 * persisted in localStorage under 'ql_enc_key'.
 *
 * Tradeoffs (documented in README):
 * - Pro: Zero UX friction, no passphrase to remember.
 * - Con: Key is device-local. A second device produces a different key
 *        and cannot decrypt entries created on the first device.
 * - For an MVP demonstrating the encryption architecture, this is the correct choice.
 * - Production path: replace with a PBKDF2-passphrase provider that derives
 *   the key deterministically so it works across devices.
 *
 * Security note on localStorage: it is accessible to any JS on the page (XSS risk).
 * Acceptable for MVP. Production path: move to a more isolated storage mechanism
 * or use a passphrase-derived key that avoids storage entirely.
 */

import type { CryptoProvider, EncryptedPayload } from './cryptoProvider';
import {
  generateAESKey,
  exportKeyAsJWK,
  importKeyFromJWK,
  encryptText,
  decryptText,
} from './webCrypto';

const STORAGE_KEY = 'ql_enc_key';

export class LocalStorageKeyProvider implements CryptoProvider {
  private key: CryptoKey | null = null;

  get isReady(): boolean {
    return this.key !== null;
  }

  /**
   * Load the key from localStorage, or generate and persist a new one.
   * Must be called (and awaited) before encrypt/decrypt are usable.
   */
  async initialize(): Promise<void> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      try {
        const jwk: JsonWebKey = JSON.parse(stored) as JsonWebKey;
        this.key = await importKeyFromJWK(jwk);
        return;
      } catch {
        // Stored key is corrupt — generate a fresh one
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // First visit or corrupt key: generate and persist
    this.key = await generateAESKey();
    const jwk = await exportKeyAsJWK(this.key);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jwk));
  }

  async encrypt(plaintext: string): Promise<EncryptedPayload> {
    if (!this.key) throw new Error('CryptoProvider not initialized');
    return encryptText(this.key, plaintext);
  }

  async decrypt(payload: EncryptedPayload): Promise<string> {
    if (!this.key) throw new Error('CryptoProvider not initialized');
    return decryptText(this.key, payload);
  }
}
