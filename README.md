# QuietLedger

A minimal, private-first digital journaling web app focused on gratitude and emotional clarity.

**Live links** (fill in after deployment)
- Frontend: `https://your-app.vercel.app`
- Backend: `https://quietledger-api.onrender.com`

---

## Encryption Architecture

This section is required. Read it before reviewing the code.

### The core guarantee

The backend has **zero ability to read your journal entries**. It never receives plaintext. It stores two opaque base64 strings per entry (`iv` and `ciphertext`) and has no access to the key required to decrypt them.

### Where encryption happens

All encryption and decryption runs in the browser, inside the Web Crypto API.

The relevant code is in `frontend/src/crypto/`:

| File | Responsibility |
|---|---|
| `webCrypto.ts` | Raw Web Crypto API wrappers. `encrypt`, `decrypt`, `generateKey`, `exportKey`, `importKey`. No side effects. |
| `cryptoProvider.ts` | TypeScript interface (`CryptoProvider`). The abstraction layer — components and store actions only touch this interface. |
| `localStorageKeyProvider.ts` | MVP implementation. Manages key lifecycle: generate on first use, export as JWK, persist in `localStorage`, re-import on subsequent visits. |
| `CryptoContext.tsx` | React context that initializes the provider once at app startup and exposes it via `useCrypto()`. |

**The boundary is enforced architecturally:** `entriesApi.ts` (the only file that talks to the backend) has no `content` field in any of its types. There is no code path that sends plaintext to the server.

### Where the key is stored

The AES-GCM-256 key is exported as a JSON Web Key (JWK) and stored in `localStorage` under the key `ql_enc_key`. It is only ever held in `CryptoKey` form (a non-extractable handle) during the session after the initial import.

The backend has no copy of this key. MongoDB has no copy of this key.

### How decryption works

1. User opens the app → `localStorageKeyProvider.ts` reads `ql_enc_key` from `localStorage` and calls `crypto.subtle.importKey()`. This reconstructs the `CryptoKey` object in memory. Takes <5ms.
2. User clicks a calendar date → `journalStore.fetchAndDecryptEntry()` is called.
3. The store calls `GET /entries?date=YYYY-MM-DD`.
4. The backend returns `{ iv: "base64...", ciphertext: "base64..." }`. No plaintext.
5. The store calls `cryptoProvider.decrypt({ iv, ciphertext })`.
6. This calls `crypto.subtle.decrypt()` in the browser.
7. The decrypted string is stored **only in Zustand store memory** and rendered by the React component. It is never re-sent to any server.

### When you write an entry

1. You type in the editor.
2. On save, the store calls `cryptoProvider.encrypt(plaintext)`.
3. This generates a fresh **random 12-byte IV** (via `crypto.getRandomValues`) and calls `crypto.subtle.encrypt()`.
4. Returns `{ iv: "base64...", ciphertext: "base64..." }`.
5. The store calls `POST /entries` with only `{ date, iv, ciphertext }`.
6. The plaintext string is destroyed with the function call — it is never passed to `entriesApi.ts`.

### Tradeoff: single-device limitation (MVP)

The random key is stored per-browser. If you log in from a second device, a new key is generated, and entries from the first device **cannot be decrypted** on the second device. This is the honest tradeoff of the MVP approach.

**Production upgrade path:** Replace `localStorageKeyProvider.ts` with a `PassphraseKeyProvider` that derives the AES key via PBKDF2 from a user-supplied passphrase:

```typescript
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 310000 },
  passphraseKeyMaterial,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

The salt is stored server-side (not a secret). The passphrase is never sent to the server. The key is deterministic — same passphrase on any device produces the same key. The `CryptoProvider` interface means this swap requires **zero changes** to any component or store.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| State | Zustand (journal) + React Context (auth) |
| Auth frontend | `@react-oauth/google` |
| HTTP client | Axios |
| Calendar | react-calendar |
| Backend | FastAPI (Python) |
| Database | MongoDB via Motor (async) |
| Auth backend | Google OAuth ID token verification + python-jose JWT |
| Frontend deploy | Vercel |
| Backend deploy | Render |

---

## Project Structure

```
QuietLedger/
├── frontend/
│   └── src/
│       ├── api/             # Axios client + typed API modules (no plaintext entry content)
│       ├── auth/            # AuthContext, ProtectedRoute, GoogleLoginButton
│       ├── components/
│       │   ├── Calendar/    # CalendarView (react-calendar wrapper + dot indicators)
│       │   ├── Editor/      # JournalEditor, EntryViewer
│       │   └── Layout/      # AppShell (persistent sidebar + outlet)
│       ├── crypto/          # ← Encryption layer (see above)
│       ├── hooks/           # useJournalEntry, useDotDates
│       ├── pages/           # JournalPage, HistoryPage, SettingsPage, LoginPage
│       ├── store/           # journalStore (Zustand), settingsStore (Zustand)
│       └── types/           # auth.types.ts, journal.types.ts, api.types.ts
│
└── backend/
    ├── auth/                # jwt_utils.py, dependencies.py (get_current_user)
    ├── db/                  # mongo.py (Motor client), collections.py
    ├── models/              # Pydantic models: user.py, entry.py
    ├── routers/             # auth.py, entries.py, users.py (thin, delegate to services)
    ├── services/            # auth_service.py, entry_service.py, user_service.py
    ├── config.py            # Pydantic Settings (reads .env)
    └── main.py              # FastAPI app factory, CORS, lifespan (MongoDB indexes)
```

---

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.11+
- A MongoDB Atlas cluster (free tier works)
- A Google Cloud project with OAuth 2.0 Client ID

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate     # Windows
# source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt

# Copy and fill in the environment variables
cp .env.example .env

uvicorn main:app --reload
```

The API runs at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install

# Copy and fill in the environment variables
cp .env.example .env.local

npm run dev
```

The app runs at `http://localhost:5173`.

### Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application type)
3. Add these **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - `https://your-app.vercel.app` (after deployment)
4. Copy the Client ID to both `backend/.env` (`GOOGLE_CLIENT_ID`) and `frontend/.env.local` (`VITE_GOOGLE_CLIENT_ID`)

---

## Deployment

### Backend → Render

1. Push the repo to GitHub
2. Create a new **Web Service** on Render, connect the repo, set root directory to `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (see `backend/.env.example`)
6. Set `ALLOWED_ORIGINS` to your Vercel URL

### Frontend → Vercel

1. Create a new project on Vercel, connect the repo, set root directory to `frontend/`
2. Framework preset: Vite
3. Add environment variables:
   - `VITE_GOOGLE_CLIENT_ID` — your Google Client ID
   - `VITE_API_BASE_URL` — your Render backend URL (e.g. `https://quietledger-api.onrender.com`)
4. The `vercel.json` in `frontend/` handles client-side routing rewrites automatically

---

## Authentication Flow

```
Browser                          Backend
  │                                 │
  │  @react-oauth/google renders    │
  │  Google sign-in button          │
  │  User clicks → Google issues    │
  │  a short-lived ID token         │
  │                                 │
  │  POST /auth/google              │
  │  { id_token: "eyJ..." }  ──────►│
  │                                 │  google-auth verifies token
  │                                 │  (signature, expiry, audience)
  │                                 │  Upserts user in MongoDB
  │                                 │  Issues application JWT (24h)
  │  { access_token, user }  ◄──────│
  │                                 │
  │  Store JWT in localStorage      │
  │  All subsequent requests:       │
  │  Authorization: Bearer {jwt}  ──►│
```

The backend **never** needs the Google client secret in this flow (that's only for authorization code flow). The client ID is all that's needed to verify the ID token's `aud` claim.

---

## State Management Design

| State | Where | Why |
|---|---|---|
| Auth identity (user, token) | React Context (`AuthContext`) | Simple, rarely changes, no caching needed |
| Journal entries (per-date cache) | Zustand (`journalStore`) | Singleton outside React tree → survives route changes without re-mounting |
| Calendar dot-dates | Zustand (`journalStore`) | Fetched once per month, shared between `CalendarView` and `JournalPage` |
| Theme preference | Zustand (`settingsStore`) | Applied to `<html>` element before first render to prevent theme flash |

The key Zustand property enabling cross-navigation persistence: the store is a **module-level singleton**. It is not a React component. When you navigate from Journal → Settings → Journal, the Zustand store has not unmounted — all previously loaded entries are still in `journalStore.entriesByDate` with no re-fetch required.
