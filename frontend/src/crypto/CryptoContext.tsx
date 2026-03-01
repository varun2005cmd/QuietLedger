/**
 * CryptoContext.tsx
 *
 * Initializes the CryptoProvider once at app startup and exposes it via Context.
 * Components and store actions call useCrypto() to get the provider — they never
 * instantiate or import the provider class directly.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { LocalStorageKeyProvider } from './localStorageKeyProvider';
import type { CryptoProvider } from './cryptoProvider';

const CryptoContext = createContext<CryptoProvider | null>(null);

/** Initializes the encryption key and provides the CryptoProvider to the tree. */
export function CryptoProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<LocalStorageKeyProvider | null>(null);

  useEffect(() => {
    const instance = new LocalStorageKeyProvider();
    instance.initialize().then(() => {
      setProvider(instance);
    });
  }, []);

  if (!provider?.isReady) {
    // Key import/generation is async but typically <5ms.
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f2eb] dark:bg-[#111110]">
        <span className="text-sm text-neutral-400">Loading…</span>
      </div>
    );
  }

  return <CryptoContext.Provider value={provider}>{children}</CryptoContext.Provider>;
}

/** Returns the initialized CryptoProvider. Must be used inside CryptoProvider. */
export function useCrypto(): CryptoProvider {
  const ctx = useContext(CryptoContext);
  if (!ctx) throw new Error('useCrypto must be used inside <CryptoProvider>');
  return ctx;
}
