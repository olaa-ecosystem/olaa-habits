# Local-first & Sync

- Everything works offline and without an account. State lives in localStorage key `olaa-habits/state` (versioned, `STATE_VERSION = 1`).
- Signed in: each local change is written to Firestore `habits/{uid}` after 1.5 s; changes from other devices arrive by snapshot listener.
- After sign-in: empty device pulls; no account copy pushes; otherwise newer `updatedAt` wins. A document with an unknown `schemaVersion` is never overwritten.
- Language events are facts, not edits: they are merged into any copy, never lost by a pull.
- Sign-out flushes pending writes, then clears the device.
- Backup: JSON export/import in Settings.
