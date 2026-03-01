/**
 * cryptoProvider.ts
 *
 * The CryptoProvider abstraction.
 *
 * UI components and store actions ONLY interact with this interface — they never
 * import from webCrypto.ts directly. This decoupling means the key strategy
 * (localStorage JWK vs passphrase-PBKDF2 vs hardware key) can be swapped
 * by changing only the provider implementation, with zero changes to any
 * component or store.
 */

import type { EncryptedPayload } from './webCrypto';

export type { EncryptedPayload };

export interface CryptoProvider {
  /** True once the key has been loaded/generated and the provider is ready to use. */
  readonly isReady: boolean;

  /**
   * Encrypt a plaintext string.
   * Returns an opaque payload containing iv + ciphertext as base64 strings.
   * The plaintext is never passed to any API layer — only the payload is.
   */
  encrypt(plaintext: string): Promise<EncryptedPayload>;

  /**
   * Decrypt an EncryptedPayload back to the original string.
   * Called on the client only, after data is retrieved from the server.
   */
  decrypt(payload: EncryptedPayload): Promise<string>;
}
