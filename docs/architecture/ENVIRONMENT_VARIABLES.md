# Environment Variables

Client-exposed variables must never contain secrets.

| Name | Purpose | Secret? | Status |
|---|---|---|---|
| `VITE_FIREBASE_*` (6) | Public Firebase web config, project `olaa-ecosystem` | No | In `.env.development`, `.env.production` |
| `VITE_OLAA_LANGUAGE_URL` | Olaa Language address for "Study now" | No | Optional, has default |
| `VITE_OLAA_TAKENOTE_URL` | Olaa Note address for notebook links | No | Optional, has default |
