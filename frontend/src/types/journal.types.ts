/** The encrypted entry as received from the backend. */
export interface RawEntry {
  id: string;
  date: string;        // "YYYY-MM-DD"
  iv: string;          // base64
  ciphertext: string;  // base64
  created_at: string;
  updated_at: string;
}

/** An entry after client-side decryption — only exists in memory. */
export interface DecryptedEntry {
  id: string;
  date: string;
  content: string;     // plaintext — never sent to the server
  created_at: string;
  updated_at: string;
}

/** Payload sent to POST /entries — no plaintext content field. */
export interface EntryCreatePayload {
  date: string;
  iv: string;
  ciphertext: string;
}
